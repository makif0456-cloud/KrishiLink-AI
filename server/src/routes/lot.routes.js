const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { successResponse } = require('../utils/responseHelper');
const LotService = require('../services/lotService');
const BuyerMatchingService = require('../services/buyerMatchingService');

// POST /api/v1/lots (Farmer / FPO creates lot)
router.post(
  '/',
  authMiddleware,
  rbac('farmer', 'fpo', 'admin'),
  [
    body('commodity_id').notEmpty().withMessage('फसल आईडी आवश्यक है (commodity_id required)'),
    body('quantity').isFloat({ min: 0.1 }).withMessage('मात्रा 0 से अधिक होनी चाहिए (Quantity must be > 0)'),
    body('quality_grade').optional().isIn(['A', 'B', 'C']).withMessage('अमान्य गुणवत्ता (Invalid grade)'),
    validate
  ],
  async (req, res, next) => {
    try {
      const lot = await LotService.createLot(req.user.id, req.body);
      return successResponse(res, { lot }, 'फसल सफलतापूर्वक दर्ज की गई (Lot created successfully)', 201);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/lots/my (Farmer views own lots)
router.get('/my', authMiddleware, async (req, res, next) => {
  try {
    const lots = await LotService.getFarmerLots(req.user.id);
    return successResponse(res, { lots }, 'मेरी फसलें (My lots fetched)');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/lots (Browse all active lots)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const { commodity_id, status } = req.query;
    const lots = await LotService.getAllActiveLots({ commodityId: commodity_id, status });
    return successResponse(res, { lots }, 'सक्रिय फसलें (Active lots fetched)');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/lots/:id (Get lot detail)
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const lot = await LotService.getLotDetail(req.params.id, req.user.id, req.user.role);
    return successResponse(res, { lot }, 'फसल विवरण (Lot details fetched)');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/lots/:id/matching-buyers (Deterministic buyer matching for a lot)
router.get('/:id/matching-buyers', authMiddleware, async (req, res, next) => {
  try {
    const lot = await LotService.getLotDetail(req.params.id, req.user.id, req.user.role);
    const matchingBuyers = await BuyerMatchingService.matchBuyersForLot(lot);
    return successResponse(res, { matching_buyers: matchingBuyers, total_matches: matchingBuyers.length }, 'सत्यापित खरीदार मिलान (Matched buyers fetched)');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/lots/:id (Cancel lot)
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const lot = await LotService.deleteLot(req.params.id, req.user.id);
    return successResponse(res, { lot }, 'फसल हटा दी गई (Lot cancelled)');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
