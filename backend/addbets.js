import sql from 'mssql';

const config = {
  server: 'parlai-new.database.windows.net',
  user: 'CloudSAc3ceb5b1',
  password: 'Parlai123$',
  database: 'free-sql-db-5521983',
  options: { encrypt: true, trustServerCertificate: false }
};

const pool = await sql.connect(config);

const userRes = await pool.request()
  .input('email', sql.NVarChar, 'ethanmmcbride@gmail.com')
  .query('SELECT id, balance FROM users WHERE email = @email');

const user = userRes.recordset[0];
console.log('User:', user);

const stake = 20.00;

// Insert WON bet - Manchester City spreads
const wonOdds = 1.88;
const wonPayout = stake * wonOdds;
const wonBet = await pool.request()
  .input('userId', sql.BigInt, user.id)
  .input('stake', sql.Decimal(18,2), stake)
  .input('odds', sql.Decimal(10,4), wonOdds)
  .input('payout', sql.Decimal(18,2), wonPayout)
  .query(`
    INSERT INTO bets (user_id, wager_kind, stake, odds_at_placement, potential_payout, status, placed_at, settled_at)
    OUTPUT INSERTED.id
    VALUES (@userId, 'straight', @stake, @odds, @payout, 'WON', DATEADD(day, -2, GETUTCDATE()), DATEADD(day, -1, GETUTCDATE()))
  `);

const wonBetId = wonBet.recordset[0].id;

// Add bet leg for won bet
await pool.request()
  .input('betId', sql.BigInt, wonBetId)
  .input('selectionId', sql.NVarChar, '2625')
  .input('odds', sql.Decimal(10,4), wonOdds)
  .query(`
    INSERT INTO bet_legs (bet_id, event_id, selection_id, odds, status, outcome_label, market_key)
    VALUES (@betId, '151', @selectionId, @odds, 'WON', 'Manchester City', 'spreads')
  `);

// Add payout ledger entry
await pool.request()
  .input('userId', sql.BigInt, user.id)
  .input('betId', sql.BigInt, wonBetId)
  .input('amount', sql.Decimal(18,2), wonPayout)
  .query(`
    INSERT INTO wallet_ledger (user_id, bet_id, amount, type)
    VALUES (@userId, @betId, @amount, 'PAYOUT')
  `);

// Insert LOST bet - Crystal Palace spreads
const lostOdds = 1.97;
const lostPayout = stake * lostOdds;
const lostBet = await pool.request()
  .input('userId', sql.BigInt, user.id)
  .input('stake', sql.Decimal(18,2), stake)
  .input('odds', sql.Decimal(10,4), lostOdds)
  .input('payout', sql.Decimal(18,2), lostPayout)
  .query(`
    INSERT INTO bets (user_id, wager_kind, stake, odds_at_placement, potential_payout, status, placed_at, settled_at)
    OUTPUT INSERTED.id
    VALUES (@userId, 'straight', @stake, @odds, @payout, 'LOST', DATEADD(day, -2, GETUTCDATE()), DATEADD(day, -1, GETUTCDATE()))
  `);

const lostBetId = lostBet.recordset[0].id;

// Add bet leg for lost bet
await pool.request()
  .input('betId', sql.BigInt, lostBetId)
  .input('selectionId', sql.NVarChar, '2624')
  .input('odds', sql.Decimal(10,4), lostOdds)
  .query(`
    INSERT INTO bet_legs (bet_id, event_id, selection_id, odds, status, outcome_label, market_key)
    VALUES (@betId, '151', @selectionId, @odds, 'LOST', 'Crystal Palace', 'spreads')
  `);

// Update balance - add won payout minus stake already deducted
await pool.request()
  .input('userId', sql.BigInt, user.id)
  .input('amount', sql.Decimal(18,2), wonPayout - stake)
  .query('UPDATE users SET balance = balance + @amount WHERE id = @userId');

console.log('Won bet id:', wonBetId);
console.log('Lost bet id:', lostBetId);
console.log('Done! Balance updated by:', wonPayout - stake);
await sql.close();
