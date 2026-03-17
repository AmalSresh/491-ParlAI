import { app } from "@azure/functions";
import sql from "mssql";
// Database configuration (Store these in your Azure App Settings / local.settings.json)
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

// Global pool connection so we don't open a new connection every single execution
let poolPromise = new sql.ConnectionPool(sqlConfig)
  .connect()
  .then((pool) => {
    console.log("Connected to MSSQL");
    return pool;
  })
  .catch((err) => console.log("Database Connection Failed! Bad Config: ", err));

app.http("getGames", {
  methods: ["GET"],
  authLevel: "anonymous", // Change to 'function' if you want to require an API key from the frontend
  handler: async (request, context) => {
    context.log(
      "HTTP trigger invoked: Fetching games and odds for the frontend.",
    );

    try {
      const pool = await poolPromise;

      // 1. THE MASSIVE JOIN QUERY
      // Grab games from yesterday (to show finished results) up to 7 days in the future
      const result = await pool.request().query(`
                SELECT 
                    e.id AS event_id, 
                    e.start_time, 
                    e.status, 
                    e.home_score, 
                    e.away_score,
                    h.name AS home_team, 
                    a.name AS away_team,
                    m.id AS market_id, 
                    m.type AS market_type,
                    s.id AS selection_id, 
                    s.label AS selection_label, 
                    s.odds, 
                    s.line_value
                FROM events e
                JOIN teams h ON e.home_team_id = h.id
                JOIN teams a ON e.away_team_id = a.id
                LEFT JOIN markets m ON e.id = m.event_id AND m.status = 'open'
                LEFT JOIN selections s ON m.id = s.market_id
                WHERE e.start_time >= DATEADD(day, -1, SYSDATETIME()) 
                  AND e.start_time <= DATEADD(day, 7, SYSDATETIME())
                ORDER BY e.start_time ASC;
            `);

      const rows = result.recordset;

      // 2. THE JSON SHAPER
      // Convert flat SQL rows into a nested JSON object
      const eventsMap = new Map();

      for (const row of rows) {
        // If we haven't seen this event yet, create its base object
        if (!eventsMap.has(row.event_id)) {
          eventsMap.set(row.event_id, {
            id: row.event_id,
            homeTeam: row.home_team,
            awayTeam: row.away_team,
            startTime: row.start_time,
            status: row.status,
            scores: {
              home: row.home_score,
              away: row.away_score,
            },
            markets: [], // We will push markets in here
          });
        }

        const event = eventsMap.get(row.event_id);

        // If this row actually has market data (because of the LEFT JOIN)
        if (row.market_id) {
          // Check if we've already added this market to the event
          let market = event.markets.find((m) => m.id === row.market_id);

          if (!market) {
            market = {
              id: row.market_id,
              type: row.market_type,
              selections: [],
            };
            event.markets.push(market);
          }

          // Push the specific bet selection into the market
          if (row.selection_id) {
            market.selections.push({
              id: row.selection_id,
              label: row.selection_label,
              odds: row.odds,
              lineValue: row.line_value,
            });
          }
        }
      }

      // Convert the Map values back into a clean array
      const formattedGames = Array.from(eventsMap.values());

      // 3. RETURN TO FRONTEND
      return {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          // Note: In production, configure CORS in the Azure Portal, not just here
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify(formattedGames),
      };
    } catch (error) {
      context.error("Database query failed:", error);
      return {
        status: 500,
        body: JSON.stringify({
          error: "Internal Server Error while fetching games.",
        }),
      };
    }
  },
});
