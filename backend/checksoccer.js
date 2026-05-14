import sql from 'mssql';

const config = {
  server: 'parlai-new.database.windows.net',
  user: 'CloudSAc3ceb5b1',
  password: 'Parlai123$',
  database: 'free-sql-db-5521983',
  options: { encrypt: true, trustServerCertificate: false }
};

const pool = await sql.connect(config);

const result = await pool.request().query(`
  SELECT TOP 10 
    e.id as event_id, 
    e.status,
    e.home_score, 
    e.away_score,
    ht.name as home_team, 
    at.name as away_team,
    m.id as market_id,
    m.type as market_type,
    s.id as selection_id,
    s.label,
    s.odds,
    s.result
  FROM events e
  JOIN teams ht ON e.home_team_id = ht.id
  JOIN teams at ON e.away_team_id = at.id
  JOIN markets m ON m.event_id = e.id
  JOIN selections s ON s.market_id = m.id
  JOIN leagues l ON e.league_id = l.id
  WHERE e.status = 'completed'
  AND l.name = 'English Premier League'
  AND s.result IS NOT NULL
  ORDER BY e.id DESC
`);

console.log(result.recordset);
await sql.close();
