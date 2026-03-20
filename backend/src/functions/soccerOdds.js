import { app } from "@azure/functions";
import sql from "mssql";
import axios from "axios";

// ==========================================
// DATABASE CONFIGURATION
// ==========================================
const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  server: process.env.DB_SERVER,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

let poolPromise = new sql.ConnectionPool(sqlConfig)
  .connect()
  .then((pool) => {
    console.log("Connected to MSSQL for Odds Ingestion");
    return pool;
  })
  .catch((err) => console.log("Database Connection Failed! Bad Config: ", err));

// ==========================================
// HELPER FUNCTIONS (The "Integer ID" Handlers)
// ==========================================

async function getOrCreateLeague(pool, leagueName) {
  let res = await pool
    .request()
    .input("name", sql.NVarChar, leagueName)
    .query("SELECT id FROM leagues WHERE name = @name");
  if (res.recordset.length > 0) return res.recordset[0].id;

  res = await pool
    .request()
    .input("name", sql.NVarChar, leagueName)
    .query(
      "INSERT INTO leagues (name, country) OUTPUT INSERTED.id VALUES (@name, 'Unknown')",
    );
  return res.recordset[0].id;
}

async function getOrCreateTeam(pool, teamName, leagueId) {
  let res = await pool
    .request()
    .input("name", sql.NVarChar, teamName)
    .query("SELECT id FROM teams WHERE name = @name");
  if (res.recordset.length > 0) return res.recordset[0].id;

  res = await pool
    .request()
    .input("name", sql.NVarChar, teamName)
    .input("leagueId", sql.Int, leagueId)
    .query(
      "INSERT INTO teams (league_id, name) OUTPUT INSERTED.id VALUES (@leagueId, @name)",
    );
  return res.recordset[0].id;
}

async function getOrCreateEvent(
  pool,
  leagueId,
  homeTeamId,
  awayTeamId,
  startTime,
) {
  let res = await pool
    .request()
    .input("homeTeamId", sql.Int, homeTeamId)
    .input("awayTeamId", sql.Int, awayTeamId)
    .input("startTime", sql.DateTime2, new Date(startTime)).query(`
      SELECT id FROM events 
      WHERE home_team_id = @homeTeamId 
        AND away_team_id = @awayTeamId 
        AND CAST(start_time AS DATE) = CAST(@startTime AS DATE)
    `);
  if (res.recordset.length > 0) return res.recordset[0].id;

  res = await pool
    .request()
    .input("leagueId", sql.Int, leagueId)
    .input("homeTeamId", sql.Int, homeTeamId)
    .input("awayTeamId", sql.Int, awayTeamId)
    .input("startTime", sql.DateTime2, new Date(startTime)).query(`
      INSERT INTO events (league_id, home_team_id, away_team_id, start_time, status) 
      OUTPUT INSERTED.id 
      VALUES (@leagueId, @homeTeamId, @awayTeamId, @startTime, 'scheduled')
    `);
  return res.recordset[0].id;
}

async function getOrCreateMarket(pool, eventId, type) {
  let res = await pool
    .request()
    .input("eventId", sql.BigInt, eventId)
    .input("type", sql.VarChar, type)
    .query("SELECT id FROM markets WHERE event_id = @eventId AND type = @type");
  if (res.recordset.length > 0) return res.recordset[0].id;

  res = await pool
    .request()
    .input("eventId", sql.BigInt, eventId)
    .input("type", sql.VarChar, type)
    .query(
      "INSERT INTO markets (event_id, type) OUTPUT INSERTED.id VALUES (@eventId, @type)",
    );
  return res.recordset[0].id;
}

async function upsertSelection(pool, marketId, label, odds, lineValue) {
  let res = await pool
    .request()
    .input("marketId", sql.BigInt, marketId)
    .input("label", sql.NVarChar, label)
    .query(
      "SELECT id FROM selections WHERE market_id = @marketId AND label = @label",
    );

  if (res.recordset.length > 0) {
    const selectionId = res.recordset[0].id;
    await pool
      .request()
      .input("id", sql.BigInt, selectionId)
      .input("odds", sql.Decimal(10, 4), odds)
      .input("lineValue", sql.Decimal(10, 2), lineValue)
      .query(
        "UPDATE selections SET odds = @odds, line_value = @lineValue WHERE id = @id",
      );
    return selectionId;
  } else {
    res = await pool
      .request()
      .input("marketId", sql.BigInt, marketId)
      .input("label", sql.NVarChar, label)
      .input("odds", sql.Decimal(10, 4), odds)
      .input("lineValue", sql.Decimal(10, 2), lineValue).query(`
        INSERT INTO selections (market_id, label, odds, line_value) 
        OUTPUT INSERTED.id 
        VALUES (@marketId, @label, @odds, @lineValue)
      `);
    return res.recordset[0].id;
  }
}

// ==========================================
// 1. TIMER FUNCTION (Production)
// ==========================================
app.timer("ingestOddsTimer", {
  schedule: "0 0 */4 * * *",
  handler: async (myTimer, context) => {
    context.log("Timer trigger executing at:", new Date().toISOString());

    try {
      const pool = await poolPromise;

      // Smart Gatekeeper
      const upcomingGamesResult = await pool.request().query(`
          SELECT COUNT(id) as upcomingCount FROM dbo.events 
          WHERE start_time BETWEEN SYSDATETIME() AND DATEADD(day, 3, SYSDATETIME())
            AND status != 'completed'
      `);
      const upcomingGames = upcomingGamesResult.recordset[0].upcomingCount;

      const totalGamesResult = await pool
        .request()
        .query(`SELECT COUNT(id) as totalCount FROM dbo.events`);
      const totalGames = totalGamesResult.recordset[0].totalCount;

      if (upcomingGames === 0 && totalGames > 0) {
        context.log(
          "Gatekeeper: No upcoming games in the next 3 days. Skipping.",
        );
        return;
      }

      context.log(
        `Found ${upcomingGames} upcoming games. Fetching fresh odds...`,
      );

      const apiKey = process.env.SOCCER_ODDS_API;
      const response = await axios.get(
        `https://api.the-odds-api.com/v4/sports/soccer_epl/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals`,
      );
      const apiGames = response.data;

      if (!apiGames || apiGames.length === 0) {
        context.log("API returned 0 games. Exiting early.");
        return;
      }

      // 1. GET OR CREATE LEAGUE
      const leagueName = apiGames[0].sport_title || "EPL";
      const leagueId = await getOrCreateLeague(pool, leagueName);

      for (const apiGame of apiGames) {
        context.log(
          `\n=== Processing Game: ${apiGame.home_team} vs ${apiGame.away_team} ===`,
        );

        // 2. TEAMS
        const homeTeamId = await getOrCreateTeam(
          pool,
          apiGame.home_team,
          leagueId,
        );
        const awayTeamId = await getOrCreateTeam(
          pool,
          apiGame.away_team,
          leagueId,
        );

        // 3. EVENT
        const eventId = await getOrCreateEvent(
          pool,
          leagueId,
          homeTeamId,
          awayTeamId,
          apiGame.commence_time,
        );

        // 4. ODDS / MARKETS
        if (apiGame.bookmakers && apiGame.bookmakers.length > 0) {
          const bookmaker =
            apiGame.bookmakers.find((b) => b.key === "lowvig") ||
            apiGame.bookmakers[0];

          for (const market of bookmaker.markets) {
            if (!["h2h", "spreads", "totals"].includes(market.key)) continue;

            const marketId = await getOrCreateMarket(pool, eventId, market.key);

            for (const outcome of market.outcomes) {
              await upsertSelection(
                pool,
                marketId,
                outcome.name,
                outcome.price,
                outcome.point ?? null,
              );
            }
          }
        }
      }
      context.log("✅ Odds ingestion completed successfully.");
    } catch (error) {
      context.error("❌ Error during odds ingestion:", error);
    }
  },
});

// ==========================================
// 2. HTTP TEST FUNCTION (Manual Trigger)
// ==========================================
app.http("testIngestOdds", {
  methods: ["GET"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    context.log("Manual HTTP Trigger: Forcing Odds Ingestion...");

    try {
      const pool = await poolPromise;
      const apiKey = process.env.SOCCER_ODDS_API;

      const response = await axios.get(
        `https://api.the-odds-api.com/v4/sports/soccer_epl/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals`,
      );
      const apiGames = response.data;

      if (!apiGames || apiGames.length === 0) {
        return {
          status: 200,
          body: "API returned 0 games. Nothing to process.",
        };
      }

      // 1. GET OR CREATE LEAGUE
      const leagueName = apiGames[0].sport_title || "EPL";
      const leagueId = await getOrCreateLeague(pool, leagueName);
      context.log(`[DB] League ID: ${leagueId} (${leagueName})`);

      // We only process the first game to keep the test fast and logs readable
      const apiGame = apiGames[0];

      context.log(
        `\n=== TEST Processing Game: ${apiGame.home_team} vs ${apiGame.away_team} ===`,
      );

      // Loop through EVERY game returned by the API
      for (const apiGame of apiGames) {
        context.log(
          `\n=== Processing Game: ${apiGame.home_team} vs ${apiGame.away_team} ===`,
        );

        // 2. TEAMS
        const homeTeamId = await getOrCreateTeam(
          pool,
          apiGame.home_team,
          leagueId,
        );
        const awayTeamId = await getOrCreateTeam(
          pool,
          apiGame.away_team,
          leagueId,
        );

        // 3. EVENT
        const eventId = await getOrCreateEvent(
          pool,
          leagueId,
          homeTeamId,
          awayTeamId,
          apiGame.commence_time,
        );

        // 4. ODDS / MARKETS
        if (apiGame.bookmakers && apiGame.bookmakers.length > 0) {
          const bookmaker =
            apiGame.bookmakers.find((b) => b.key === "lowvig") ||
            apiGame.bookmakers[0];

          for (const market of bookmaker.markets) {
            if (!["h2h", "spreads", "totals"].includes(market.key)) continue;

            const marketId = await getOrCreateMarket(pool, eventId, market.key);

            for (const outcome of market.outcomes) {
              await upsertSelection(
                pool,
                marketId,
                outcome.name,
                outcome.price,
                outcome.point ?? null,
              );
            }
          }
        }
      }

      context.log(
        "✅ Test HTTP Ingestion completed successfully for ALL games.",
      );
      return {
        status: 200,
        body: "Successfully ran test ingestion on all games. Check your database!",
      };
    } catch (error) {
      context.error("❌ Error during test odds ingestion:", error);
      return { status: 500, body: `Error: ${error.message}` };
    }
  },
});
