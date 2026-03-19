import { app } from "@azure/functions";
import sql from "mssql";

app.http("teams", {
  methods: ["GET"],
  route: "teams",
  authLevel: "anonymous",
  handler: async (request, context) => {
    try {
      const sqlConfig = {
        server: process.env.DB_SERVER,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        options: { encrypt: true, trustServerCertificate: false },
      };

      const pool = await sql.connect(sqlConfig);

      // Fetch teams ordered by name
      const result = await pool.request().query(`
                SELECT id, name, logo_url as logoUrl, league_id 
                FROM teams 
                ORDER BY name ASC
            `);

      return {
        status: 200,
        jsonBody: result.recordset,
      };
    } catch (error) {
      context.error("Error fetching teams:", error);
      return { status: 500, jsonBody: { error: "Internal Server Error" } };
    }
  },
});
