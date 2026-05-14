import sql from 'mssql';

const config = {
  server: 'parlai-new.database.windows.net',
  user: 'CloudSAc3ceb5b1',
  password: 'Parlai123$',
  database: 'free-sql-db-5521983',
  options: { encrypt: true, trustServerCertificate: false }
};

await sql.connect(config);
await sql.query('ALTER TABLE bet_legs ALTER COLUMN selection_id NVARCHAR(255)');
console.log('Done!');
await sql.close();
