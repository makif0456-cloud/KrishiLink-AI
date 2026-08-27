const { DEMO_DISCLAIMER_HI, DEMO_DISCLAIMER_EN } = require('../config/constants');

function successResponse(res, data = {}, message = 'Success', statusCode = 200, isDemoData = true) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    meta: {
      is_demo_data: isDemoData,
      disclaimer_hi: isDemoData ? DEMO_DISCLAIMER_HI : undefined,
      disclaimer_en: isDemoData ? DEMO_DISCLAIMER_EN : undefined,
      timestamp: new Date().toISOString()
    }
  });
}

function errorResponse(res, message = 'Internal Server Error', statusCode = 500, errors = null) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString()
  });
}

module.exports = {
  successResponse,
  errorResponse
};
