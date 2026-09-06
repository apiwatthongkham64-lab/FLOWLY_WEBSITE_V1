const { HttpError } = require('../utils/httpError');

function isUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || ''));
}

function sanitizeString(value, max = 5000) {
  if (value === undefined || value === null) return value;
  if (typeof value !== 'string') return value;
  return value.replace(/\u0000/g, '').trim().slice(0, max);
}

function deepSanitize(value, depth = 0) {
  if (depth > 6) throw new HttpError(400, 'Payload nesting is too deep', 'VALIDATION_ERROR');
  if (Array.isArray(value)) return value.slice(0, 200).map(v => deepSanitize(v, depth + 1));
  if (value && typeof value === 'object') {
    const out = {};
    for (const [key, val] of Object.entries(value).slice(0, 200)) {
      if (['__proto__', 'prototype', 'constructor'].includes(key)) continue;
      out[key] = deepSanitize(val, depth + 1);
    }
    return out;
  }
  return sanitizeString(value);
}

function sanitizeInput(req, _res, next) {
  try {
    if (req.body) req.body = deepSanitize(req.body);
    if (req.query) {
      for (const key of Object.keys(req.query)) {
        if (typeof req.query[key] === 'string') req.query[key] = sanitizeString(req.query[key], 1000);
      }
    }
    next();
  } catch (error) { next(error); }
}

function validateUuidParam(name = 'id') {
  return (req, _res, next) => {
    if (!isUuid(req.params?.[name])) return next(new HttpError(400, `Invalid ${name}`, 'VALIDATION_ERROR'));
    next();
  };
}

function validateLogin(req, _res, next) {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
    return next(new HttpError(400, 'A valid email is required', 'VALIDATION_ERROR'));
  }
  if (typeof password !== 'string' || password.length < 8 || password.length > 200) {
    return next(new HttpError(400, 'Password must be 8-200 characters', 'VALIDATION_ERROR'));
  }
  next();
}

function validatePublicRequest(req, _res, next) {
  const body = req.body || {};
  const contact = body.contact || {};
  const name = contact.name || body.name || body.customer_name || body.customerName;
  const phone = contact.phone || body.phone || body.customer_phone || body.customerPhone;
  const email = contact.email || body.email;
  if (typeof body.businessSlug !== 'string' || body.businessSlug.length < 2 || body.businessSlug.length > 120) return next(new HttpError(400, 'Invalid businessSlug', 'VALIDATION_ERROR'));
  if (typeof name !== 'string' || name.length < 1 || name.length > 160) return next(new HttpError(400, 'Invalid customer name', 'VALIDATION_ERROR'));
  if (typeof phone !== 'string' || !/^[+0-9()\-\s]{7,30}$/.test(phone)) return next(new HttpError(400, 'Invalid phone number', 'VALIDATION_ERROR'));
  if (email && (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email) || email.length > 254)) return next(new HttpError(400, 'Invalid email', 'VALIDATION_ERROR'));
  if (body.summary && (typeof body.summary !== 'string' || body.summary.length > 2000)) return next(new HttpError(400, 'Summary is too long', 'VALIDATION_ERROR'));
  next();
}

module.exports = { sanitizeInput, validateUuidParam, validateLogin, validatePublicRequest, isUuid };
