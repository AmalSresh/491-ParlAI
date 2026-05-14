import { app } from '@azure/functions';
import sql from 'mssql';
import { poolPromise } from '../../components/db-connect.js';
import { getDbUserIdFromRequest } from '../../components/auth-helper.js';

app.http('place-bet', {
  methods: ['POST'],
  route: 'bets/place',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const pool = await poolPromise;
      const userId = await getDbUserIdFromRequest(request, pool);

      if (userId == null) {
        return { status: 401, jsonBody: { error: 'Not logged in' } };
      }

      const payload = await request.json();
      if (!payload?.legs?.length) {
        return { status: 400, jsonBody: { error: 'Invalid bet payload' } };
      }

      const isParlay = payload.wagerKind === 'parlay';
      const stakePerWager = payload.stake.amount;
      const totalStake = isParlay ? stakePerWager : stakePerWager * payload.legs.length;

      const transaction = new sql.Transaction(pool);
      await transaction.begin();

      try {
        const userReq = new sql.Request(transaction);
        userReq.input('userId', sql.Int, userId);
        const userRes = await userReq.query(
          'SELECT id, balance FROM users WITH (UPDLOCK) WHERE id = @userId',
        );

        const dbUser = userRes.recordset[0];
        if (!dbUser) throw new Error('User not found.');
        if (dbUser.balance < totalStake) throw new Error('Insufficient funds.');

        if (isParlay) {
          const combinedOdds = payload.legs.reduce((acc, leg) => acc * leg.odds, 1);
          const potentialPayout = combinedOdds * stakePerWager;

          const betReq = new sql.Request(transaction);
          betReq.input('userId', sql.Int, dbUser.id);
          betReq.input('wagerKind', sql.NVarChar, 'parlay');
          betReq.input('stake', sql.Decimal(18, 2), stakePerWager);
          betReq.input('oddsAtPlacement', sql.Decimal(10, 4), combinedOdds);
          betReq.input('potentialPayout', sql.Decimal(18, 2), potentialPayout);
          betReq.input('status', sql.NVarChar, 'PENDING');
          const betRes = await betReq.query(`
            INSERT INTO bets (user_id, wager_kind, stake, odds_at_placement, potential_payout, status, placed_at)
            OUTPUT INSERTED.id
            VALUES (@userId, @wagerKind, @stake, @oddsAtPlacement, @potentialPayout, @status, GETUTCDATE())
          `);
          const betId = betRes.recordset[0].id;

          for (const leg of payload.legs) {
            const parsedSelId = (leg.selectionId != null && Number.isFinite(Number(leg.selectionId))) ? Number(leg.selectionId) : null;
            const legReq = new sql.Request(transaction);
            legReq.input('betId', sql.Int, betId);
            legReq.input('eventId', sql.NVarChar, leg.eventId);
            legReq.input('selectionId', sql.BigInt, parsedSelId);
            legReq.input('odds', sql.Decimal(10, 4), leg.odds);
            legReq.input('status', sql.NVarChar, 'PENDING');
            legReq.input('outcomeLabel', sql.NVarChar(500), leg.outcomeLabel || null);
            legReq.input('marketKey', sql.NVarChar(100), leg.marketKey || null);
            legReq.input('gameName', sql.NVarChar(500), leg.gameName || null);
            await legReq.query(`
              INSERT INTO bet_legs (bet_id, event_id, selection_id, odds, status, outcome_label, market_key, game_name)
              VALUES (@betId, @eventId, @selectionId, @odds, @status, @outcomeLabel, @marketKey, @gameName)
            `);
          }

          const ledgerReq = new sql.Request(transaction);
          ledgerReq.input('userId', sql.Int, dbUser.id);
          ledgerReq.input('betId', sql.Int, betId);
          ledgerReq.input('amount', sql.Decimal(18, 2), -stakePerWager);
          ledgerReq.input('type', sql.NVarChar, 'WAGER_PLACED');
          await ledgerReq.query(`
            INSERT INTO wallet_ledger (user_id, bet_id, amount, type, created_at)
            VALUES (@userId, @betId, @amount, @type, GETUTCDATE())
          `);
        } else {
          for (const leg of payload.legs) {
            const potentialPayout = leg.odds * stakePerWager;

            const betReq = new sql.Request(transaction);
            betReq.input('userId', sql.Int, dbUser.id);
            betReq.input('wagerKind', sql.NVarChar, 'straight');
            betReq.input('stake', sql.Decimal(18, 2), stakePerWager);
            betReq.input('oddsAtPlacement', sql.Decimal(10, 4), leg.odds);
            betReq.input('potentialPayout', sql.Decimal(18, 2), potentialPayout);
            betReq.input('status', sql.NVarChar, 'PENDING');
            const betRes = await betReq.query(`
              INSERT INTO bets (user_id, wager_kind, stake, odds_at_placement, potential_payout, status, placed_at)
              OUTPUT INSERTED.id
              VALUES (@userId, @wagerKind, @stake, @oddsAtPlacement, @potentialPayout, @status, GETUTCDATE())
            `);
            const betId = betRes.recordset[0].id;

            const parsedSelId = (leg.selectionId != null && Number.isFinite(Number(leg.selectionId))) ? Number(leg.selectionId) : null;
            const legReq = new sql.Request(transaction);
            legReq.input('betId', sql.Int, betId);
            legReq.input('eventId', sql.NVarChar, leg.eventId);
            legReq.input('selectionId', sql.BigInt, parsedSelId);
            legReq.input('odds', sql.Decimal(10, 4), leg.odds);
            legReq.input('status', sql.NVarChar, 'PENDING');
            legReq.input('outcomeLabel', sql.NVarChar(500), leg.outcomeLabel || null);
            legReq.input('marketKey', sql.NVarChar(100), leg.marketKey || null);
            legReq.input('gameName', sql.NVarChar(500), leg.gameName || null);
            await legReq.query(`
              INSERT INTO bet_legs (bet_id, event_id, selection_id, odds, status, outcome_label, market_key, game_name)
              VALUES (@betId, @eventId, @selectionId, @odds, @status, @outcomeLabel, @marketKey, @gameName)
            `);

            const ledgerReq = new sql.Request(transaction);
            ledgerReq.input('userId', sql.Int, dbUser.id);
            ledgerReq.input('betId', sql.Int, betId);
            ledgerReq.input('amount', sql.Decimal(18, 2), -stakePerWager);
            ledgerReq.input('type', sql.NVarChar, 'WAGER_PLACED');
            await ledgerReq.query(`
              INSERT INTO wallet_ledger (user_id, bet_id, amount, type, created_at)
              VALUES (@userId, @betId, @amount, @type, GETUTCDATE())
            `);
          }
        }

        const deductReq = new sql.Request(transaction);
        deductReq.input('totalStake', sql.Decimal(18, 2), totalStake);
        deductReq.input('userId', sql.Int, dbUser.id);
        await deductReq.query('UPDATE users SET balance = balance - @totalStake WHERE id = @userId');

        await transaction.commit();
        return { status: 200, jsonBody: { success: true, message: 'Wagers successfully placed.' } };
      } catch (dbError) {
        await transaction.rollback();
        context.log.warn('Transaction rolled back:', dbError.message);
        return { status: 400, jsonBody: { error: dbError.message } };
      }
    } catch (error) {
      context.error('Fatal error placing bet:', error);
      return { status: 500, jsonBody: { error: 'Internal Server Error' } };
    }
  },
});
