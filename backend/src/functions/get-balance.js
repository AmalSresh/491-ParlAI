import { app } from '@azure/functions';
import sql from 'mssql';
import { poolPromise } from '../../components/db-connect.js';
import { getDbUserIdFromRequest } from '../../components/auth-helper.js';

app.http('user-balance', {
  methods: ['GET'],
  route: 'user/balance',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const pool = await poolPromise;
      const userId = await getDbUserIdFromRequest(request, pool);

      if (userId == null) {
        return { status: 401, jsonBody: { error: 'Not logged in' } };
      }

      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query('SELECT balance FROM users WHERE id = @userId');

      if (!result.recordset.length) {
        return { status: 404, jsonBody: { error: 'User not found' } };
      }

      return { status: 200, jsonBody: { balance: result.recordset[0].balance } };
    } catch (error) {
      context.error('Error fetching balance:', error);
      return { status: 500, jsonBody: { error: 'Internal Server Error' } };
    }
  },
});
