const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

function bool(name, fallback = false) {
  const raw = process.env[name];
  if (raw === undefined) return fallback;
  return String(raw).toLowerCase() === 'true';
}
function int(name, fallback) {
  const value = Number(process.env[name]);
  return Number.isFinite(value) ? value : fallback;
}

const env = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: int('PORT', 8787),
  apiPrefix: process.env.API_PREFIX || '/api/v1',
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5500',
  jwtSecret: process.env.JWT_SECRET || 'dev-only-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  jwtIssuer: process.env.JWT_ISSUER || 'flowly-api',
  jwtAudience: process.env.JWT_AUDIENCE || 'flowly-web',
  cookieName: process.env.COOKIE_NAME || 'flowly_session',
  databaseUrl: process.env.DATABASE_URL || '',
  dbSsl: bool('DB_SSL', false),
  dbPoolMax: int('DB_POOL_MAX', 10),
  dbIdleTimeoutMs: int('DB_IDLE_TIMEOUT_MS', 30000),
  dbConnectionTimeoutMs: int('DB_CONNECTION_TIMEOUT_MS', 5000),
  authMode: process.env.AUTH_MODE || 'demo',
  trustProxy: bool('TRUST_PROXY', false),
  jsonLimit: process.env.JSON_LIMIT || '256kb',
  globalRateLimitMax: int('GLOBAL_RATE_LIMIT_MAX', 180),
  loginRateLimitMax: int('LOGIN_RATE_LIMIT_MAX', 10),
  publicRequestRateLimitMax: int('PUBLIC_REQUEST_RATE_LIMIT_MAX', 20),
  backupDir: process.env.BACKUP_DIR || path.resolve(__dirname, '../../backups'),
  backupRetentionDays: int('BACKUP_RETENTION_DAYS', 14)
};

if (env.nodeEnv === 'production') {
  if (env.jwtSecret === 'dev-only-change-me' || env.jwtSecret.length < 32) {
    throw new Error('JWT_SECRET must be configured with at least 32 characters in production');
  }
  if (!env.databaseUrl) throw new Error('DATABASE_URL must be configured in production');
  if (env.authMode !== 'database') throw new Error('AUTH_MODE must be database in production');
  if (!/^https:\/\//i.test(env.frontendOrigin)) throw new Error('FRONTEND_ORIGIN must use HTTPS in production');
}

module.exports = { env };
