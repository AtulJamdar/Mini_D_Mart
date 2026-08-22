import AuditLog from '../models/AuditLog.js';

/**
 * Audit Logger Service
 * Asynchronously records system security, authentication, and resource events.
 */
class AuditLoggerService {
  /**
   * Log authentication attempts (login success / failure)
   */
  static async logLoginAttempt({ email, success, userId = null, req, reason = null }) {
    try {
      const ip =
        req.headers['x-forwarded-for']?.split(',')[0] ||
        req.socket?.remoteAddress ||
        req.ip ||
        'unknown';
      const userAgent = req.headers['user-agent'] || 'unknown';

      await AuditLog.create({
        userId: userId || null,
        action: success ? 'AUTH_LOGIN_SUCCESS' : 'AUTH_LOGIN_FAILURE',
        resource: 'AUTH',
        resourceId: email || 'unknown',
        metadata: {
          email,
          success,
          reason,
          ip,
          userAgent,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      // Never block or break request flow due to audit logging failures
      console.error('[AuditLogger Error] Failed to record login audit log:', err.message);
    }
  }

  /**
   * Generic audit event logger
   */
  static async logEvent({ userId = null, action, resource, resourceId = null, metadata = {} }) {
    try {
      await AuditLog.create({
        userId,
        action,
        resource,
        resourceId: resourceId ? String(resourceId) : undefined,
        metadata,
      });
    } catch (err) {
      console.error('[AuditLogger Error] Failed to record audit event:', err.message);
    }
  }
}

export default AuditLoggerService;
