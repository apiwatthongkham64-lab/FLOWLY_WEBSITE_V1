const audit = require('../services/securityAuditService');

function auditMutation(eventType) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode < 400) {
        audit.record(req, eventType, true, {
          method: req.method,
          entityId: req.params?.id || null
        });
      }
    });
    next();
  };
}

module.exports = { auditMutation };
