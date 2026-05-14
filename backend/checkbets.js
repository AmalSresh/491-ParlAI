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
  SELECT COLUMN_NAME, DATA_TYPE 
  FROM INFORMATION_SCHEMA.COLUMNS 
  WHERE TABLE_NAME = 'bets'
`);
console.log(result.recordset);
await sql.close();
