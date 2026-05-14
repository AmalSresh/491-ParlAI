import { app } from '@azure/functions';
import sql from 'mssql';
import { poolPromise } from '../../components/db-connect.js';
import { getDbUserIdFromRequest } from '../../components/auth-helper.js';

app.http('user-me', {
  methods: ['GET'],
  route: 'user/me',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const pool = await poolPromise;
      const userId = await getDbUserIdFromRequest(request, pool);

      if (userId == null) {
        // Azure new-user auto-create path (legacy)
        const header = request.headers.get('x-ms-client-principal');
        if (!header) return { status: 401, jsonBody: { error: 'Not logged in' } };

        const cp = JSON.parse(Buffer.from(header, 'base64').toString('ascii'));
        const { userId: azureId, userDetails, claims } = cp;
        let finalAzureId = azureId;
        if (!finalAzureId && claims) {
          const c = claims.find(
            (c) => c.typ === 'sub' || c.typ.includes('nameidentifier'),
          );
          if (c) finalAzureId = c.val;
        }
        if (!finalAzureId) return { status: 400, jsonBody: { error: 'Missing user ID' } };

        let result = await pool.request()
          .input('azureUserId', sql.NVarChar, finalAzureId)
          .query('SELECT id, nickname, email, onboarding_stage AS onboardingStage, balance FROM users WHERE azure_user_id = @azureUserId');

        let dbUser = result.recordset[0];
        if (!dbUser) {
          const ins = pool.request();
          ins.input('azureUserId', sql.NVarChar, finalAzureId);
          ins.input('email', sql.NVarChar, userDetails || '');
          ins.input('balance', sql.Decimal, 1000.0);
          const insResult = await ins.query(`
            INSERT INTO users (azure_user_id, email, onboarding_stage, balance)
            OUTPUT INSERTED.id, INSERTED.email, INSERTED.onboarding_stage AS onboardingStage, INSERTED.balance
            VALUES (@azureUserId, @email, 0, @balance)
          `);
          dbUser = insResult.recordset[0];
        }
        return { status: 200, jsonBody: dbUser };
      }

      const result = await pool.request()
        .input('userId', sql.Int, userId)
        .query('SELECT id, nickname, email, onboarding_stage AS onboardingStage, balance FROM users WHERE id = @userId');

      const dbUser = result.recordset[0];
      if (!dbUser) return { status: 404, jsonBody: { error: 'User not found' } };

      return { status: 200, jsonBody: dbUser };
    } catch (error) {
      context.error('Error fetching user:', error);
      return { status: 500, jsonBody: { error: 'Internal Server Error' } };
    }
  },
});
