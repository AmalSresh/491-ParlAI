import crypto from 'node:crypto';
import sql from 'mssql';

const SECRET = process.env.JWT_SECRET ?? 'parlai-dev-secret-do-not-use-in-production';
const ITERATIONS = 100_000;
const KEYLEN = 64;
const DIGEST = 'sha512';

export function generateSalt() {
  return crypto.randomBytes(32).toString('hex');
}

export function hashPassword(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.pbkdf2(password, salt, ITERATIONS, KEYLEN, DIGEST, (err, key) => {
      if (err) reject(err);
      else resolve(key.toString('hex'));
    });
  });
}

export async function verifyPassword(password, hash, salt) {
  const derived = await hashPassword(password, salt);
  try {
    return crypto.timingSafeEqual(Buffer.from(derived, 'hex'), Buffer.from(hash, 'hex'));
  } catch {
    return false;
  }
}

const HEADER_B64 = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');

export function createToken(userId) {
  const payload = Buffer.from(JSON.stringify({
    sub: userId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60,
  })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(`${HEADER_B64}.${payload}`).digest('base64url');
  return `${HEADER_B64}.${payload}.${sig}`;
}

export function verifyToken(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [h, p, sig] = parts;
    const expected = crypto.createHmac('sha256', SECRET).update(`${h}.${p}`).digest('base64url');
    if (!crypto.timingSafeEqual(Buffer.from(sig, 'base64url'), Buffer.from(expected, 'base64url'))) return null;
    const data = JSON.parse(Buffer.from(p, 'base64url').toString());
    if (data.exp && data.exp < Math.floor(Date.now() / 1000)) return null;
    return { userId: data.sub };
  } catch {
    return null;
  }
}

// Returns the integer DB user id, or null if not authenticated.
// Checks Bearer JWT first, then falls back to Azure SWA header.
export async function getDbUserIdFromRequest(request, pool) {
  const auth = request.headers.get('authorization') ?? '';
  if (auth.startsWith('Bearer ')) {
    const payload = verifyToken(auth.slice(7));
    if (payload?.userId != null) return payload.userId;
  }

  const azureHeader = request.headers.get('x-ms-client-principal');
  if (!azureHeader) return null;

  try {
    const cp = JSON.parse(Buffer.from(azureHeader, 'base64').toString('ascii'));
    let azureId = cp.userId;
    if (!azureId && cp.claims) {
      const c = cp.claims.find((c) => c.typ === 'sub' || c.typ.includes('nameidentifier'));
      if (c) azureId = c.val;
    }
    if (!azureId) return null;
    const res = await pool.request()
      .input('azureUserId', sql.NVarChar, azureId)
      .query('SELECT id FROM users WHERE azure_user_id = @azureUserId');
    return res.recordset[0]?.id ?? null;
  } catch {
    return null;
  }
}
