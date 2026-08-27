const { validationResult } = require('express-validator');
const { errorResponse } = require('../utils/responseHelper');

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return errorResponse(
      res,
      'अमान्य इनपुट डेटा (Invalid input parameters)',
      400,
      errors.array().map(e => ({ field: e.path, message: e.msg }))
    );
  }
  next();
}

module.exports = { validate };
