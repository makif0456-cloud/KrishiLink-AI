const { errorResponse } = require('../utils/responseHelper');

/**
 * Role-Based Access Control Middleware
 * @param  {...string} allowedRoles - 'farmer', 'buyer', 'fpo', 'admin'
 */
function rbac(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'प्रमाणीकरण आवश्यक है (Authentication required)', 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(
        res,
        `इस क्रिया के लिए अनुमति नहीं है (${req.user.role} role cannot perform this action)`,
        403
      );
    }

    next();
  };
}

module.exports = {
  rbac
};
