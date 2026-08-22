import { sendError } from '../utils/responseHelper.js';

/**
 * Role-Based Access Control (RBAC) Middleware
 * Higher-order middleware factory that checks if req.user has one of the allowed roles.
 *
 * @param  {...string} allowedRoles - e.g. 'admin', 'store_manager', 'store_staff'
 */
export const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, {
        statusCode: 401,
        message: 'Authentication required before accessing this resource.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, {
        statusCode: 403,
        message: `Forbidden: Access requires one of [${allowedRoles.join(', ')}] role(s).`,
      });
    }

    next();
  };
};

export default requireRole;
