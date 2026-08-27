const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { successResponse } = require('../utils/responseHelper');
const ForecastService = require('../services/forecastService');

// GET /api/v1/forecast/prices (Get price forecast for commodity)
router.get('/prices', authMiddleware, async (req, res, next) => {
  try {
    const { commodity_id, horizon_days } = req.query;
    const commId = commodity_id || 'b0000000-0000-0000-0000-000000000001';
    const horizon = horizon_days ? parseInt(horizon_days) : 15;
    const forecastData = await ForecastService.getForecast(commId, horizon);
    return successResponse(res, forecastData, 'मूल्य पूर्वानुमान (Price forecast generated)');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
