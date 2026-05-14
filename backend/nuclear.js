import sql from 'mssql';

const config = {
  server: 'parlai-new.database.windows.net',
  user: 'CloudSAc3ceb5b1',
  password: 'Parlai123$',
  database: 'free-sql-db-5521983',
  options: { encrypt: true, trustServerCertificate: false }
};

const pool = await sql.connect(config);

// Show all users with null azure_user_id
const nulls = await pool.request().query('SELECT * FROM users WHERE azure_user_id IS NULL OR azure_user_id = \'\'');
console.log('NULL/empty users:', nulls.recordset);

// Delete them
const del = await pool.request().query('DELETE FROM users WHERE azure_user_id IS NULL OR azure_user_id = \'\'');
console.log('Deleted:', del.rowsAffected);

await sql.close();
