import sql from 'mssql';

const config = {
  server: 'parlai-new.database.windows.net',
  user: 'CloudSAc3ceb5b1',
  password: 'Parlai123$',
  database: 'free-sql-db-5521983',
  options: { encrypt: true, trustServerCertificate: false }
};

const pool = await sql.connect(config);

// Delete any null users first
await pool.request().query('DELETE FROM users WHERE azure_user_id IS NULL');

// Make azure_user_id NOT NULL so this can never happen again
await pool.request().query('ALTER TABLE users ALTER COLUMN azure_user_id NVARCHAR(255) NOT NULL');

console.log('Done!');
await sql.close();
