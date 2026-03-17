import { app } from "@azure/functions";
import sql from "mssql";
import axios from "axios";

// Database configuration
const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME, // Note: Make sure this matches your local.settings.json (DB_DATABASE vs DB_NAME)
  server: process.env.DB_SERVER,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
};

let poolPromise = new sql.ConnectionPool(sqlConfig)
  .connect()
  .then((pool) => {
    console.log("Connected to MSSQL for Scores Ingestion");
    return pool;
  })
  .catch((err) => console.log("Database Connection Failed! Bad Config: ", err));

app.timer("ingestScoresTimer", {
  schedule: "0 */5 * * * *", // Every 5 minutes
  handler: async (myTimer, context) => {
    context.log("Checking for live games to update scores via ESPN...");

    try {
      const pool = await poolPromise;

      // 1. GATEKEEPER (Added dbo. prefix)
      const activeGamesResult = await pool.request().query(`
                SELECT COUNT(id) as activeCount 
                FROM dbo.events 
                WHERE start_time <= SYSDATETIME() 
                  AND status != 'completed'
            `);

      if (activeGamesResult.recordset[0].activeCount === 0) {
        context.log("Gatekeeper: No live games right now. Skipping ESPN call.");
        return;
      }

      // 2. FETCH SCORES FROM ESPN
      const espnUrl =
        "https://site.api.espn.com/apis/site/v2/sports/soccer/eng.1/scoreboard";
      const response = await axios.get(espnUrl);
      const espnEvents = response.data.events;

      if (!espnEvents || espnEvents.length === 0) return;

      // 3. PROCESS THE ESPN SCORES
      for (const espnGame of espnEvents) {
        const competitors = espnGame.competitions[0].competitors;

        const homeTeamObj = competitors.find((c) => c.homeAway === "home");
        const awayTeamObj = competitors.find((c) => c.homeAway === "away");

        const homeTeamName = homeTeamObj.team.name;
        const awayTeamName = awayTeamObj.team.name;

        // 4. FIND THE EVENT IN YOUR DB (Added dbo. prefix)
        const eventResult = await pool
          .request()
          .input("homeName", sql.NVarChar, homeTeamName)
          .input("awayName", sql.NVarChar, awayTeamName)
          .input("startTime", sql.DateTime2, new Date(espnGame.date)).query(`
                        SELECT e.id, e.status 
                        FROM dbo.events e
                        JOIN dbo.teams h ON e.home_team_id = h.id
                        JOIN dbo.teams a ON e.away_team_id = a.id
                        WHERE h.name = @homeName 
                          AND a.name = @awayName 
                          AND CAST(e.start_time AS DATE) = CAST(@startTime AS DATE)
                    `);

        if (eventResult.recordset.length === 0) continue;

        const dbEvent = eventResult.recordset[0];
        if (dbEvent.status === "completed") continue;

        // 5. PARSE STATUS AND SCORES
        const isCompleted = espnGame.status.type.completed;
        const newStatus = isCompleted ? "completed" : "in_progress";

        const homeScore = parseInt(homeTeamObj.score, 10);
        const awayScore = parseInt(awayTeamObj.score, 10);

        // 6. UPDATE DB
        if (espnGame.status.type.state !== "pre") {
          await pool
            .request()
            .input("eventId", sql.VarChar, dbEvent.id) // FIXED: Was sql.BigInt, now sql.VarChar
            .input("homeScore", sql.Int, homeScore)
            .input("awayScore", sql.Int, awayScore)
            .input("status", sql.VarChar, newStatus).query(`
                            UPDATE dbo.events 
                            SET home_score = @homeScore, 
                                away_score = @awayScore, 
                                status = @status
                            WHERE id = @eventId
                        `);

          context.log(
            `✅ Updated: ${homeTeamName} ${homeScore} - ${awayScore} ${awayTeamName} (${newStatus})`,
          );
        }
      }
    } catch (error) {
      context.error("Error during ESPN scores ingestion:", error);
    }
  },
});
