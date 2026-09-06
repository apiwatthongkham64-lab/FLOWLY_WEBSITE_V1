const { HttpError } = require('../utils/httpError');

const stores = new Map();

function cleanup(store, now) {
  for (const [key, value] of store.entries()) {
    if (value.resetAt <= now) store.delete(key);
  }
}

function rateLimit({ windowMs = 60_000, max = 120, keyPrefix = 'global' } = {}) {
  if (!stores.has(keyPrefix)) stores.set(keyPrefix, new Map());
  const store = stores.get(keyPrefix);
  return (req, res, next) => {
    const now = Date.now();
    if (store.size > 5000) cleanup(store, now);
    const identity = req.user?.id || req.ip || req.socket?.remoteAddress || 'unknown';
    const key = `${keyPrefix}:${identity}`;
    const current = store.get(key);
    if (!current || current.resetAt <= now) {
      store.set(key, { count: 1, resetAt: now + windowMs });
      res.setHeader('RateLimit-Limit', String(max));
      res.setHeader('RateLimit-Remaining', String(Math.max(0, max - 1)));
      return next();
    }
    current.count += 1;
    res.setHeader('RateLimit-Limit', String(max));
    res.setHeader('RateLimit-Remaining', String(Math.max(0, max - current.count)));
    res.setHeader('RateLimit-Reset', String(Math.ceil(current.resetAt / 1000)));
    if (current.count > max) {
      return next(new HttpError(429, 'Too many requests. Please try again later.', 'RATE_LIMITED'));
    }
    next();
  };
}

module.exports = { rateLimit };
