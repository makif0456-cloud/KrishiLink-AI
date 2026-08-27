const { verifyToken } = require('../utils/jwt');
const { errorResponse } = require('../utils/responseHelper');
const User = require('../models/User');

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'प्रमाणीकरण आवश्यक है (Authentication token required)', 401);
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded || !decoded.id) {
      return errorResponse(res, 'अमान्य या समाप्त टोकन (Invalid or expired token)', 401);
    }

    const user = await User.findById(decoded.id);
    if (!user || !user.is_active) {
      return errorResponse(res, 'उपयोगकर्ता खाता सक्रिय नहीं है (User account inactive or not found)', 401);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'सत्र समाप्त हो गया है, कृपया पुनः लॉगिन करें (Session expired, please login again)', 401);
    }
    return errorResponse(res, 'अनधिकृत पहुंच (Unauthorized access)', 401);
  }
}

// Optional Auth (populates req.user if token is valid, doesn't block if missing)
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = verifyToken(token);
      if (decoded && decoded.id) {
        req.user = await User.findById(decoded.id);
      }
    }
  } catch (_) {
    // Ignore error for optional auth
  }
  next();
}

module.exports = {
  authMiddleware,
  optionalAuth
};
