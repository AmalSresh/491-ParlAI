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
  req.input('azureUserId', sql.NVarChar, 'test-user-123');
  req.input('email', sql.NVarChar, 'test@test.com');
  req.input('balance', sql.Decimal, 1000.0);
  
  const result = await req.query(`
    INSERT INTO users (azure_user_id, email, onboarding_stage, balance)
    OUTPUT INSERTED.id, INSERTED.email, INSERTED.onboarding_stage as onboardingStage, INSERTED.balance
    VALUES (@azureUserId, @email, 0, @balance)
  `);
  console.log('Success:', result.recordset);
} catch(e) {
  console.error('Error:', e.message);
}

await sql.close();
