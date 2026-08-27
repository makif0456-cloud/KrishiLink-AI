const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { successResponse } = require('../utils/responseHelper');
const RecommendationService = require('../services/recommendationService');
const BuyerMatchingService = require('../services/buyerMatchingService');
const LotService = require('../services/lotService');

// GET /api/v1/recommendations/lot/:lotId (Full selling recommendation with Net Realization breakdown)
router.get('/lot/:lotId', authMiddleware, async (req, res, next) => {
  try {
    const recommendation = await RecommendationService.getRecommendationsForLot(req.params.lotId, req.user.id);
    return successResponse(res, recommendation, 'सर्वोत्तम विक्रय अनुशंसा व शुद्ध प्राप्ति गणना (Recommendations generated)');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/recommendations/lot/:lotId/options (Alternative selling options compared)
router.get('/lot/:lotId/options', authMiddleware, async (req, res, next) => {
  try {
    const recommendation = await RecommendationService.getRecommendationsForLot(req.params.lotId, req.user.id);
    return successResponse(res, {
      top_recommendation: recommendation.top_recommendation,
      all_options: recommendation.all_options,
      benchmark_local_mandi: recommendation.benchmark_local_mandi,
      additional_gain: recommendation.additional_gain_top_option
    }, 'विक्रय विकल्प तुलना (Selling options compared)');
  } catch (err) {
    next(err);
  }
});

// POST /api/v1/recommendations/buyers (Deterministic Buyer Matching for lot or custom criteria)
router.post('/buyers', authMiddleware, async (req, res, next) => {
  try {
    const { lot_id, commodity_id, quantity, quality_grade, latitude, longitude } = req.body;
    let lot = null;
    if (lot_id) {
      lot = await LotService.getLotDetail(lot_id, req.user.id, req.user.role);
    } else {
      lot = {
        commodity_id: commodity_id || 'b0000000-0000-0000-0000-000000000001',
        quantity: Number(quantity) || 100,
        quality_grade: quality_grade || 'A',
        latitude: latitude || 23.6341,
        longitude: longitude || 77.4338
      };
    }
    const matchingBuyers = await BuyerMatchingService.matchBuyersForLot(lot);
    return successResponse(res, { matching_buyers: matchingBuyers, total: matchingBuyers.length }, 'सत्यापित खरीदार मिलान (Matched buyers calculated)');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
