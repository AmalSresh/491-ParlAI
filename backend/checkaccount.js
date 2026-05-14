import sql from 'mssql';

const config = {
  server: 'parlai-new.database.windows.net',
  user: 'CloudSAc3ceb5b1',
  password: 'Parlai123$',
  database: 'free-sql-db-5521983',
  options: { encrypt: true, trustServerCertificate: false }
};

const pool = await sql.connect(config);
const result = await pool.request()
  .input('id', sql.NVarChar, '8697083cb5ca4795b2bb2c1c4c861519')
  .query('SELECT * FROM users WHERE azure_user_id = @id');
console.log('User found:', result.recordset);
await sql.close();
