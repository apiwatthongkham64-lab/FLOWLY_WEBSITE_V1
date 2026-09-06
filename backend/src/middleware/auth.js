const jwt = require('jsonwebtoken');
const { env } = require('../config/env');
const { HttpError } = require('../utils/httpError');
const { hasPermission } = require('../authz');

function readToken(req) {
  const auth = req.get('authorization');
  if (auth && auth.startsWith('Bearer ')) return auth.slice(7);
  return req.cookies?.[env.cookieName] || null;
}
function requireAuth(req, _res, next) {
  const token = readToken(req);
  if (!token) return next(new HttpError(401, 'Authentication required', 'AUTH_REQUIRED'));
  try { req.user = jwt.verify(token, env.jwtSecret, { issuer: env.jwtIssuer, audience: env.jwtAudience }); next(); }
  catch (_error) { next(new HttpError(401, 'Session is invalid or expired', 'AUTH_INVALID')); }
}
function requireRole(...roles) {
  return (req, _res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return next(new HttpError(403, 'You do not have permission for this action', 'FORBIDDEN'));
    next();
  };
}
function requirePermission(permission) {
  return (req, _res, next) => {
    if (!hasPermission(req.user, permission)) return next(new HttpError(403, `Permission required: ${permission}`, 'FORBIDDEN'));
    next();
  };
}
module.exports = { requireAuth, requireRole, requirePermission, readToken };
