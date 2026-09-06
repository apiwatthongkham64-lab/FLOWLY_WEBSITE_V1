const { env } = require('../config/env');
const logger = require('../utils/logger');

function errorHandler(error, req, res, _next) {
  let status = Number(error.status || 500);
  let code = error.code || 'INTERNAL_ERROR';
  let message = error.message || 'Internal server error';

  if (error.type === 'entity.too.large') {
    status = 413; code = 'PAYLOAD_TOO_LARGE'; message = 'Request payload is too large';
  } else if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    status = 400; code = 'INVALID_JSON'; message = 'Malformed JSON payload';
  }

  if (status >= 500 && env.nodeEnv === 'production') message = 'Internal server error';

  const payload = {
    ok: false,
    error: {
      code,
      message,
      details: status < 500 ? error.details || undefined : undefined,
      requestId: req.requestId
    }
  };

  if (status >= 500) logger.error('request_failed', { requestId: req.requestId, method: req.method, path: req.originalUrl, status, error });
  else if (status >= 400) logger.warn('request_rejected', { requestId: req.requestId, method: req.method, path: req.originalUrl, status, code });

  if (res.headersSent) return;
  res.status(status).json(payload);
}

module.exports = { errorHandler };
