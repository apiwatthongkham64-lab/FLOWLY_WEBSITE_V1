const { HttpError } = require('../utils/httpError');
function notFound(req, _res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`, 'NOT_FOUND'));
}
module.exports = { notFound };
