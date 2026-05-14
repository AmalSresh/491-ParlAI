import { app } from '@azure/functions';
import sql from 'mssql';
import { poolPromise } from '../../components/db-connect.js';
import {
  generateSalt,
  hashPassword,
  verifyPassword,
  createToken,
} from '../../components/auth-helper.js';

async function ensurePasswordColumns(pool) {
  await pool.request().query(`
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='users' AND COLUMN_NAME='password_hash')
      ALTER TABLE users ADD password_hash NVARCHAR(MAX) NULL;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='users' AND COLUMN_NAME='password_salt')
      ALTER TABLE users ADD password_salt NVARCHAR(MAX) NULL;
  `);
}

app.http('auth-register', {
  methods: ['POST'],
  route: 'auth/register',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { email, password, nickname } = await request.json();

      if (!email || !password || !nickname) {
        return { status: 400, jsonBody: { error: 'Email, password, and nickname are required.' } };
      }
      if (password.length < 6) {
        return { status: 400, jsonBody: { error: 'Password must be at least 6 characters.' } };
      }

      const pool = await poolPromise;
      await ensurePasswordColumns(pool);

      const existing = await pool.request()
        .input('email', sql.NVarChar, email.toLowerCase().trim())
        .query('SELECT id FROM users WHERE email = @email');

      if (existing.recordset.length > 0) {
        return { status: 409, jsonBody: { error: 'An account with that email already exists.' } };
      }

      const salt = generateSalt();
      const hash = await hashPassword(password, salt);

      const result = await pool.request()
        .input('email', sql.NVarChar, email.toLowerCase().trim())
        .input('nickname', sql.NVarChar, nickname.trim())
        .input('hash', sql.NVarChar, hash)
        .input('salt', sql.NVarChar, salt)
        .query(`
          INSERT INTO users (email, nickname, password_hash, password_salt, onboarding_stage, balance)
          OUTPUT INSERTED.id, INSERTED.email, INSERTED.nickname,
                 INSERTED.onboarding_stage AS onboardingStage, INSERTED.balance
          VALUES (@email, @nickname, @hash, @salt, 1, 1000.00)
        `);

      const user = result.recordset[0];
      const token = createToken(user.id);

      return {
        status: 201,
        jsonBody: {
          token,
          user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            onboardingStage: user.onboardingStage,
            balance: Number(user.balance),
          },
        },
      };
    } catch (error) {
      context.error('Registration error:', error);
      if (error.number === 2627) {
        const msg = String(error.message || '');
        const isNickname = msg.toLowerCase().includes('nickname');
        return {
          status: 409,
          jsonBody: { error: isNickname ? 'That display name is already taken.' : 'Registration failed due to a conflict.' },
        };
      }
      return { status: 500, jsonBody: { error: 'Registration failed.' } };
    }
  },
});

app.http('auth-login', {
  methods: ['POST'],
  route: 'auth/login',
  authLevel: 'anonymous',
  handler: async (request, context) => {
    try {
      const { email, password } = await request.json();

      if (!email || !password) {
        return { status: 400, jsonBody: { error: 'Email and password are required.' } };
      }

      const pool = await poolPromise;

      const result = await pool.request()
        .input('email', sql.NVarChar, email.toLowerCase().trim())
        .query(`
          SELECT id, email, nickname, password_hash, password_salt,
                 onboarding_stage AS onboardingStage, balance
          FROM users
          WHERE email = @email
        `);

      const user = result.recordset[0];

      if (!user || !user.password_hash || !user.password_salt) {
        return { status: 401, jsonBody: { error: 'Invalid email or password.' } };
      }

      const valid = await verifyPassword(password, user.password_hash, user.password_salt);
      if (!valid) {
        return { status: 401, jsonBody: { error: 'Invalid email or password.' } };
      }

      const token = createToken(user.id);

      return {
        status: 200,
        jsonBody: {
          token,
          user: {
            id: user.id,
            email: user.email,
            nickname: user.nickname,
            onboardingStage: user.onboardingStage,
            balance: Number(user.balance),
          },
        },
      };
    } catch (error) {
      context.error('Login error:', error);
      return { status: 500, jsonBody: { error: 'Login failed.' } };
    }
  },
});
