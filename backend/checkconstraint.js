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
  SELECT 
    kc.name AS constraint_name,
    col.name AS column_name
  FROM sys.key_constraints kc
  JOIN sys.index_columns ic ON kc.unique_index_id = ic.index_id AND kc.parent_object_id = ic.object_id
  JOIN sys.columns col ON ic.column_id = col.column_id AND ic.object_id = col.object_id
  WHERE kc.name = 'UQ__users__5CF1C59BB47214E6'
`);
console.log(result.recordset);
await sql.close();
