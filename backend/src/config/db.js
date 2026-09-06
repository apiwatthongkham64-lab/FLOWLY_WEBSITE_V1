const { Pool } = require('pg');
const { env } = require('./env');
const logger = require('../utils/logger');

let pool = null;

function getPool() {
  if (!env.databaseUrl) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl,
      ssl: env.dbSsl ? { rejectUnauthorized: false } : false,
      max: env.dbPoolMax,
      idleTimeoutMillis: env.dbIdleTimeoutMs,
      connectionTimeoutMillis: env.dbConnectionTimeoutMs
    });
    pool.on('error', error => logger.error('postgres_pool_error', { error }));
  }
  return pool;
}

async function databaseStatus() {
  const db = getPool();
  if (!db) return { configured: false, connected: false };
  try {
    await db.query('SELECT 1');
    return { configured: true, connected: true };
  } catch (_error) {
    return { configured: true, connected: false };
  }
}

async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = { getPool, databaseStatus, closePool };
