const { getPool } = require('../config/db');
const { HttpError } = require('../utils/httpError');

function db() {
  const pool = getPool();
  if (!pool) throw new HttpError(503, 'PostgreSQL is not configured', 'DATABASE_NOT_CONFIGURED');
  return pool;
}

async function findByEmail(email) {
  const result = await db().query(`
    SELECT u.id, u.email, u.password_hash, u.display_name, u.phone, u.status,
           bm.business_id, bm.role, bm.status AS membership_status,
           b.name AS business_name, b.slug AS business_slug
    FROM users u
    LEFT JOIN business_members bm ON bm.user_id = u.id AND bm.status = 'active'
    LEFT JOIN businesses b ON b.id = bm.business_id AND b.status IN ('active','trial')
    WHERE lower(u.email) = lower($1)
    ORDER BY CASE bm.role WHEN 'owner' THEN 1 WHEN 'admin' THEN 2 ELSE 3 END, bm.created_at
    LIMIT 1
  `, [email]);
  return result.rows[0] || null;
}

async function touchLastLogin(userId) {
  await db().query('UPDATE users SET last_login_at = now() WHERE id = $1', [userId]);
}

module.exports = { findByEmail, touchLastLogin };
