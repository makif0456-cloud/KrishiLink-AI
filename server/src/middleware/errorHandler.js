const { errorResponse } = require('../utils/responseHelper');

function errorHandler(err, req, res, next) {
  console.error('⚠️ Server Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'सर्वर पर कोई समस्या आई है (Internal Server Error)';

  return errorResponse(res, message, statusCode, process.env.NODE_ENV === 'development' ? err.stack : null);
}

module.exports = errorHandler;
