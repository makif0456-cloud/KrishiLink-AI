const AuditLog = require('../models/AuditLog');

function auditLog(action, entityType = null) {
  return async (req, res, next) => {
    // Record original end to intercept completion
    const originalEnd = res.end;
    res.end = function (...args) {
      if (res.statusCode >= 200 && res.statusCode < 400 && req.user) {
        const entityId = req.params.id || req.body.id || null;
        AuditLog.create({
          userId: req.user.id,
          action,
          entityType,
          entityId,
          details: { path: req.path, method: req.method },
          ipAddress: req.ip || req.connection.remoteAddress
        }).catch(err => console.error('Audit log error:', err));
      }
      originalEnd.apply(res, args);
    };
    next();
  };
}

module.exports = { auditLog };
