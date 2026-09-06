const { env } = require('../config/env');
const { HttpError } = require('../utils/httpError');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function csrfGuard(req, _res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const hasSessionCookie = Boolean(req.cookies?.[env.cookieName]);
  const hasBearer = /^Bearer\s+/i.test(req.get('authorization') || '');
  if (!hasSessionCookie || hasBearer) return next();
  const origin = req.get('origin');
  if (origin !== env.frontendOrigin) {
    return next(new HttpError(403, 'Request origin is not allowed for cookie-authenticated writes', 'CSRF_ORIGIN_REJECTED'));
  }
  next();
}

module.exports = { csrfGuard };
