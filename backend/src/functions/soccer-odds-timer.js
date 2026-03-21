import { app } from "@azure/functions";
import sql from "mssql";
import axios from "axios";

import { poolPromise } from "../../components/db-connect.js";

// Currently hardcoded - will change to dynamically getting leagues
async function getOrCreateLeague(pool, leagueName) {
  let res = await pool
    .request()
    .input("name", sql.NVarChar, leagueName)
    .query("SELECT id FROM leagues WHERE name = @name");
  if (res.recordset.length > 0) return res.recordset[0].id;

  res = await pool
    .request()
    .input("name", sql.NVarChar, leagueName)
    .query("INSERT INTO leagues name OUTPUT INSERTED.id VALUES @name");
  return res.recordset[0].id;
}

// Returns the Team ID given the team name from the odds-api
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

// Odds-api team IDs for home and away team along with the games start time
// ESPN-api will handle the live score data and will be appended to the same table
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

// Use the event_id created from the events table to make 3 rows per match for h2h, spreads, and totals
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

// Adds the odds for different events per game in the selections table based on the id from events
// Updates odds with the latest ones from odds-api every 4 hours
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

app.timer("ingestOddsTimer", {
  schedule: "0 0 */4 * * *",
  handler: async (myTimer, context) => {
    context.log("Timer trigger executing at:", new Date().toISOString());

    try {
      const pool = await poolPromise;

      // Will only run full function if there is a game within 3 days
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

      // 1. Get the league (Hardcoded to prem for now)
      const leagueName = "English Premier League";
      const leagueId = await getOrCreateLeague(pool, leagueName);

      for (const apiGame of apiGames) {
        context.log(
          `\n=== Processing Game: ${apiGame.home_team} vs ${apiGame.away_team} ===`,
        );

        // 2. get the team id for reference
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

        // 3. Create the game event (who's playing, start time)
        const eventId = await getOrCreateEvent(
          pool,
          leagueId,
          homeTeamId,
          awayTeamId,
          apiGame.commence_time,
        );

        // 4. Add the odds for each game or update them if the odds have changed
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
