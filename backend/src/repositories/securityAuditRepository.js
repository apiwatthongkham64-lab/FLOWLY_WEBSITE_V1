const { getPool } = require('../config/db');

async function write(event) {
  const db = getPool();
  if (!db) return null;
  const sql = `INSERT INTO security_audit_log
    (business_id, actor_user_id, request_id, event_type, success, ip_address, user_agent, details)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)
    RETURNING id, created_at`;
  const values = [
    event.businessId || null,
    event.actorUserId || null,
    event.requestId || null,
    event.eventType,
    event.success !== false,
    event.ipAddress || null,
    event.userAgent || null,
    JSON.stringify(event.details || {})
  ];
  const result = await db.query(sql, values);
  return result.rows[0];
}

module.exports = { write };
