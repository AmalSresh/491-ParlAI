import sql from 'mssql';

const config = {
  server: 'parlai-new.database.windows.net',
  user: 'CloudSAc3ceb5b1',
  password: 'Parlai123$',
  database: 'free-sql-db-5521983',
  options: { encrypt: true, trustServerCertificate: false }
};

const pool = await sql.connect(config);

// Add the new Google account that's failing
try {
  await pool.request()
    .input('azureUserId', sql.NVarChar, '8697083cb5ca4795b2bb2c1c4c861519')
    .input('email', sql.NVarChar, 'dicedsweetpotato5@gmail.com')
    .query(`
      INSERT INTO users (azure_user_id, email, onboarding_stage, balance)
      VALUES (@azureUserId, @email, 0, 1000.00)
    `);
  console.log('Created dicedsweetpotato5');
} catch(e) {
  console.log('dicedsweetpotato5 already exists:', e.message);
}

await sql.close();
