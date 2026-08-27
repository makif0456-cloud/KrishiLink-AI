const express = require('express');
const router = express.Router();
const MarketService = require('../services/marketService');
const { optionalAuth } = require('../middleware/auth');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// GET /api/v1/market/commodities
router.get('/commodities', async (req, res, next) => {
  try {
    const commodities = await MarketService.getCommodities();
    return successResponse(res, { commodities }, 'फसल सूची (Commodities fetched)');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/market/mandis
router.get('/mandis', async (req, res, next) => {
  try {
    const mandis = await MarketService.getMandis({ state: req.query.state });
    return successResponse(res, { mandis }, 'मंडी सूची (Mandis fetched)');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/market/prices
router.get('/prices', optionalAuth, async (req, res, next) => {
  try {
    const { commodity_id, mandi_id } = req.query;
    const prices = await MarketService.getPrices({
      commodityId: commodity_id,
      mandiId: mandi_id
    });
    return successResponse(res, { prices }, 'मंडी भाव (Market prices fetched)');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/market/prices/trends
router.get('/prices/trends', async (req, res, next) => {
  try {
    const { commodity_id, mandi_id, days = 30 } = req.query;
    if (!commodity_id) {
      return errorResponse(res, 'commodity_id आवश्यक है (commodity_id is required)', 400);
    }
    const trends = await MarketService.getPriceTrends(commodity_id, mandi_id, days);
    return successResponse(res, { trends }, 'मूल्य रुझान (Price trends fetched)');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/market/prices/compare
router.get('/prices/compare', async (req, res, next) => {
  try {
    const { commodity_id } = req.query;
    if (!commodity_id) {
      return errorResponse(res, 'commodity_id आवश्यक है (commodity_id is required)', 400);
    }
    const comparison = await MarketService.compareMandiPrices(commodity_id);
    return successResponse(res, comparison, 'मंडी तुलना (Mandi price comparison)');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
