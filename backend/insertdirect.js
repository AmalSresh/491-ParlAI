import sql from 'mssql';

const config = {
  server: 'parlai-new.database.windows.net',
  user: 'CloudSAc3ceb5b1',
  password: 'Parlai123$',
  database: 'free-sql-db-5521983',
  options: { encrypt: true, trustServerCertificate: false }
};

const pool = await sql.connect(config);

try {
  const req = pool.request();
  req.input('azureUserId', sql.NVarChar, '8697083cb5ca4795b2bb2c1c4c861519');
  req.input('email', sql.NVarChar, 'dicedsweetpotato5@gmail.com');
  
  const result = await req.query(`
    INSERT INTO users (azure_user_id, email, onboarding_stage, balance)
    OUTPUT INSERTED.*
    VALUES (@azureUserId, @email, 0, 1000.00)
  `);
  console.log('Inserted:', result.recordset);
} catch(e) {
  console.error('Error:', e.message);
}

await sql.close();
