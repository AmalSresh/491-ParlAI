import sql from 'mssql';

const config = {
  server: 'parlai-new.database.windows.net',
  user: 'CloudSAc3ceb5b1',
  password: 'Parlai123$',
  database: 'free-sql-db-5521983',
  options: { encrypt: true, trustServerCertificate: false }
};

const pool = await sql.connect(config);
await pool.request().query('ALTER TABLE users DROP CONSTRAINT UQ__users__5CF1C59BB47214E6');
console.log('Constraint dropped!');
await sql.close();
