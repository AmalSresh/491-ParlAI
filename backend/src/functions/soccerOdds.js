import { app } from "@azure/functions";
import sql from "mssql";
import axios from "axios";

// Database configuration
const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, // Ensure this matches local.settings.json
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

app.timer("ingestOddsTimer", {
  schedule: "0 0 */4 * * *", // Runs every 4 hours
  handler: async (myTimer, context) => {
    context.log("Timer trigger executing at:", new Date().toISOString());

    try {
      const pool = await poolPromise;

      // 1. THE SMART GATEKEEPER
      // Check if there are any games happening in the next 3 days
      const upcomingGamesResult = await pool.request().query(`
          SELECT COUNT(id) as upcomingCount 
          FROM dbo.events 
          WHERE start_time BETWEEN SYSDATETIME() AND DATEADD(day, 3, SYSDATETIME())
            AND status != 'completed'
      `);

      const upcomingGames = upcomingGamesResult.recordset[0].upcomingCount;

      // Check if the database is completely empty
      const totalGamesResult = await pool
        .request()
        .query(`SELECT COUNT(id) as totalCount FROM dbo.events`);
      const totalGames = totalGamesResult.recordset[0].totalCount;

      // THE BAILOUT
      if (upcomingGames === 0 && totalGames > 0) {
        context.log(
          "Gatekeeper: No upcoming games in the next 3 days. Skipping Odds API call to save quota.",
        );
        return; // 🛑 Exits immediately without using your API key
      }

      context.log(
        `Found ${upcomingGames} upcoming games. Fetching fresh odds...`,
      );
      // 2. FETCH FROM THE ODDS API
      const apiKey = process.env.ODDS_API_KEY; // Make sure this matches local.settings.json
      const response = await axios.get(
        `https://api.the-odds-api.com/v4/sports/soccer_epl/odds/?apiKey=${apiKey}&regions=us&markets=h2h,spreads,totals`,
      );
      const apiGames = response.data;

      if (!apiGames || apiGames.length === 0) return;

      // 3. PROCESS EACH GAME
      for (const apiGame of apiGames) {
        const homeTeamName = apiGame.home_team;
        const awayTeamName = apiGame.away_team;
        const eventId = apiGame.id; // The Odds API gives us a unique ID!

        context.log(`Processing: ${homeTeamName} vs ${awayTeamName}`);

        // A. CREATE TEAMS IF THEY DON'T EXIST
        // We use the team name as the ID to make it easy
        await pool.request().input("homeTeam", sql.VarChar, homeTeamName)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM dbo.teams WHERE id = @homeTeam)
            INSERT INTO dbo.teams (id, name) VALUES (@homeTeam, @homeTeam)
        `);

        await pool.request().input("awayTeam", sql.VarChar, awayTeamName)
          .query(`
            IF NOT EXISTS (SELECT 1 FROM dbo.teams WHERE id = @awayTeam)
            INSERT INTO dbo.teams (id, name) VALUES (@awayTeam, @awayTeam)
        `);

        // B. CREATE EVENT IF IT DOESN'T EXIST
        await pool
          .request()
          .input("eventId", sql.VarChar, eventId)
          .input("homeName", sql.VarChar, homeTeamName)
          .input("awayName", sql.VarChar, awayTeamName)
          .input("startTime", sql.DateTime2, new Date(apiGame.commence_time))
          .query(`
            IF NOT EXISTS (SELECT 1 FROM dbo.events WHERE id = @eventId)
            BEGIN
                INSERT INTO dbo.events (id, home_team_id, away_team_id, start_time, status)
                VALUES (@eventId, @homeName, @awayName, @startTime, 'unplayed')
            END
        `);

        // C. PROCESS ODDS
        if (apiGame.bookmakers && apiGame.bookmakers.length > 0) {
          const bookmaker =
            apiGame.bookmakers.find((b) => b.key === "lowvig") ||
            apiGame.bookmakers[0];

          for (const market of bookmaker.markets) {
            if (!["h2h", "spreads", "totals"].includes(market.key)) continue;

            const marketId = `${eventId}_${market.key}`; // Combine event ID and market type to make a unique ID

            // UPSERT MARKET
            await pool
              .request()
              .input("marketId", sql.VarChar, marketId)
              .input("eventId", sql.VarChar, eventId)
              .input("marketType", sql.VarChar, market.key).query(`
                IF NOT EXISTS (SELECT 1 FROM dbo.markets WHERE id = @marketId)
                BEGIN
                    INSERT INTO dbo.markets (id, event_id, type) VALUES (@marketId, @eventId, @marketType);
                END
            `);

            // UPSERT SELECTIONS
            for (const outcome of market.outcomes) {
              // Create a unique ID for the selection
              const safeLabel = outcome.name.replace(/\s+/g, "");
              const pointStr = outcome.point ? `_${outcome.point}` : "";
              const selectionId = `${marketId}_${safeLabel}${pointStr}`;

              await pool
                .request()
                .input("selectionId", sql.VarChar, selectionId)
                .input("marketId", sql.VarChar, marketId)
                .input("label", sql.NVarChar, outcome.name)
                .input("odds", sql.Decimal(10, 4), outcome.price)
                .input("lineValue", sql.Decimal(10, 2), outcome.point ?? null)
                .query(`
                  IF EXISTS (SELECT 1 FROM dbo.selections WHERE id = @selectionId)
                  BEGIN
                      UPDATE dbo.selections 
                      SET odds = @odds, line_value = @lineValue 
                      WHERE id = @selectionId;
                  END
                  ELSE
                  BEGIN
                      INSERT INTO dbo.selections (id, market_id, label, odds, line_value)
                      VALUES (@selectionId, @marketId, @label, @odds, @lineValue);
                  END
              `);
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
