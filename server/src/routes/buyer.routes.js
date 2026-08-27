const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { successResponse } = require('../utils/responseHelper');
const BuyerRequirementService = require('../services/buyerRequirementService');

// POST /api/v1/buyers/requirements (Buyer creates requirement)
router.post(
  '/requirements',
  authMiddleware,
  rbac('buyer', 'admin'),
  [
    body('commodity_id').notEmpty().withMessage('फसल आईडी आवश्यक है (commodity_id required)'),
    body('price_max').isFloat({ min: 1 }).withMessage('अधिकतम मूल्य आवश्यक है (price_max required)'),
    body('quality_grade').optional().isIn(['A', 'B', 'C', 'any']).withMessage('अमान्य गुणवत्ता (Invalid grade)'),
    validate
  ],
  async (req, res, next) => {
    try {
      const requirement = await BuyerRequirementService.createRequirement(req.user.id, req.body);
      return successResponse(res, { requirement }, 'खरीद आवश्यकता दर्ज की गई (Requirement created)', 201);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/buyers/requirements/my (Buyer's own requirements)
router.get('/requirements/my', authMiddleware, rbac('buyer', 'admin'), async (req, res, next) => {
  try {
    const requirements = await BuyerRequirementService.getBuyerRequirements(req.user.id);
    return successResponse(res, { requirements }, 'मेरी आवश्यकताएं (My requirements fetched)');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/buyers/requirements (Browse all requirements)
router.get('/requirements', authMiddleware, async (req, res, next) => {
  try {
    const { commodity_id } = req.query;
    const requirements = await BuyerRequirementService.getAllActiveRequirements({ commodityId: commodity_id });
    return successResponse(res, { requirements }, 'खरीदारों की आवश्यकताएं (Requirements fetched)');
  } catch (err) {
    next(err);
  }
});

// DELETE /api/v1/buyers/requirements/:id (Cancel requirement)
router.delete('/requirements/:id', authMiddleware, rbac('buyer', 'admin'), async (req, res, next) => {
  try {
    const requirement = await BuyerRequirementService.deleteRequirement(req.params.id, req.user.id);
    return successResponse(res, { requirement }, 'आवश्यकता रद्द की गई (Requirement cancelled)');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
