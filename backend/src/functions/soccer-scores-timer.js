import { app } from "@azure/functions";
import sql from "mssql";
import axios from "axios";
import { poolPromise } from "../../components/db-connect.js";

const espnToOddsApiMap = {
  "AFC Bournemouth": "Bournemouth",
  "Brighton & Hove Albion": "Brighton and Hove Albion",
};

// checks active games for the gatekeeper function
async function getActiveGamesCount(pool) {
  const result = await pool.request().query(`
    SELECT COUNT(id) as activeCount 
    FROM dbo.events 
    WHERE start_time <= SYSDATETIME() 
      AND status != 'completed'
  `);
  return result.recordset[0].activeCount;
}

// Find the a specific match based on the home/away team along with the game's start time
async function findEventByTeams(pool, homeName, awayName, startTime) {
  const result = await pool
    .request()
    .input("homeName", sql.NVarChar, homeName)
    .input("awayName", sql.NVarChar, awayName)
    .input("startTime", sql.DateTime2, new Date(startTime)).query(`
      SELECT e.id, e.status 
      FROM dbo.events e
      JOIN dbo.teams h ON e.home_team_id = h.id
      JOIN dbo.teams a ON e.away_team_id = a.id
      WHERE h.name = @homeName 
        AND a.name = @awayName 
        AND CAST(e.start_time AS DATE) = CAST(@startTime AS DATE)
    `);

  // Return the event object if found, otherwise return null
  if (result.recordset.length > 0) return result.recordset[0];
  return null;
}

// Update the score and status of the game
async function updateEventScore(pool, eventId, homeScore, awayScore, status) {
  await pool
    .request()
    .input("eventId", sql.VarChar, eventId)
    .input("homeScore", sql.Int, homeScore)
    .input("awayScore", sql.Int, awayScore)
    .input("status", sql.VarChar, status).query(`
      UPDATE dbo.events 
      SET home_score = @homeScore, 
          away_score = @awayScore, 
          status = @status
      WHERE id = @eventId
    `);
}

app.timer("ingestScoresTimer", {
  schedule: "0 */5 * * * *", // Every 5 minutes
  handler: async (myTimer, context) => {
    context.log("Checking for live games to update scores via ESPN...");

    try {
      const pool = await poolPromise;

      // 1. Only run whole function if there is a live game
      const activeCount = await getActiveGamesCount(pool);
      if (activeCount === 0) {
        context.log("Gatekeeper: No live games right now. Skipping ESPN call.");
        return;
      }

      // 2. Fetch latest scores
      const espnUrl =
        "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard";
      const response = await axios.get(espnUrl);
      const espnEvents = response.data.events;

      if (!espnEvents || espnEvents.length === 0) return;

      // 3. Get the event based on the team names (event is from the odd-api function and team id is from espn-api)
      for (const espnGame of espnEvents) {
        const competitors = espnGame.competitions[0].competitors;

        const homeTeamObj = competitors.find((c) => c.homeAway === "home");
        const awayTeamObj = competitors.find((c) => c.homeAway === "away");

        const rawHomeName = homeTeamObj.team.name;
        const rawAwayName = awayTeamObj.team.name;

        const mappedHomeName = espnToOddsApiMap[rawHomeName] || rawHomeName;
        const mappedAwayName = espnToOddsApiMap[rawAwayName] || rawAwayName;

        const dbEvent = await findEventByTeams(
          pool,
          mappedHomeName,
          mappedAwayName,
          espnGame.date,
        );

        if (!dbEvent) continue;
        if (dbEvent.status === "completed") continue;

        // 5. Parse status and scores from API response
        const isCompleted = espnGame.status.type.completed;
        const newStatus = isCompleted ? "completed" : "in_progress";

        const homeScore = parseInt(homeTeamObj.score, 10);
        const awayScore = parseInt(awayTeamObj.score, 10);

        // 6. Update score and status in the events table
        if (espnGame.status.type.state !== "pre") {
          await updateEventScore(
            pool,
            dbEvent.id,
            homeScore,
            awayScore,
            newStatus,
          );

          context.log(
            `✅ Updated: ${mappedHomeName} ${homeScore} - ${awayScore} ${mappedAwayName} (${newStatus})`,
          );
        }
      }
    } catch (error) {
      context.error("Error during ESPN scores ingestion:", error);
    }
  },
});
