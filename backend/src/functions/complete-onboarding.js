import { app } from '@azure/functions';
import sql from 'mssql';
import { poolPromise } from '../../components/db-connect.js';
import { getDbUserIdFromRequest } from '../../components/auth-helper.js';

app.http('complete-onboarding', {
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const pool = await poolPromise;
      const userId = await getDbUserIdFromRequest(request, pool);

      if (userId == null) {
        return { status: 401, jsonBody: { error: 'Unauthorized. Please log in.' } };
      }

      const body = await request.json();
      const { nickname, teamIds } = body;

      const userResult = await pool.request()
        .input('userId', sql.Int, userId)
        .input('nickname', sql.NVarChar, nickname)
        .query(`
          UPDATE users
          SET nickname = @nickname, onboarding_stage = 1
          OUTPUT INSERTED.id
          WHERE id = @userId
        `);

      if (userResult.recordset.length === 0) {
        return { status: 404, jsonBody: { error: 'User profile not found in database.' } };
      }

      const dbUserId = userResult.recordset[0].id;

      await pool.request()
        .input('userId', sql.BigInt, dbUserId)
        .query('DELETE FROM user_favorite_teams WHERE user_id = @userId');

      for (const teamId of teamIds) {
        await pool.request()
          .input('userId', sql.BigInt, dbUserId)
          .input('teamId', sql.Int, teamId)
          .query('INSERT INTO user_favorite_teams (user_id, team_id) VALUES (@userId, @teamId)');
      }

      return { status: 200, jsonBody: { message: 'Onboarding complete!' } };
    } catch (error) {
      context.error('Error saving onboarding:', error);
      if (error.number === 2627) {
        return { status: 409, jsonBody: { error: 'That nickname is already taken! Please choose another one.' } };
      }
      return { status: 500, jsonBody: { error: 'Failed to save profile.' } };
    }
  },
});
