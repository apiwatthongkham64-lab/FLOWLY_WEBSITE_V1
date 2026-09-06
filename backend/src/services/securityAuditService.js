const repo = require('../repositories/securityAuditRepository');
const logger = require('../utils/logger');

function safeDetails(details = {}) {
  const blocked = new Set(['password', 'token', 'authorization', 'cookie', 'jwtSecret']);
  const out = {};
  for (const [key, value] of Object.entries(details)) {
    if (blocked.has(key.toLowerCase())) continue;
    out[key] = value;
  }
  return out;
}

async function record(req, eventType, success = true, details = {}) {
  const event = {
    businessId: req.user?.businessId || details.businessId || null,
    actorUserId: req.user?.id || details.actorUserId || null,
    requestId: req.requestId,
    eventType,
    success,
    ipAddress: req.ip || null,
    userAgent: String(req.get('user-agent') || '').slice(0, 1000) || null,
    details: safeDetails(details)
  };
  try {
    await repo.write(event);
  } catch (error) {
    logger.warn('security_audit_write_failed', { requestId: req.requestId, eventType, error });
  }
}

module.exports = { record };
