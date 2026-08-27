const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { successResponse } = require('../utils/responseHelper');
const OfferService = require('../services/offerService');

// POST /api/v1/offers (Buyer makes offer on a lot)
router.post(
  '/',
  authMiddleware,
  rbac('buyer', 'admin'),
  [
    body('lot_id').notEmpty().withMessage('फसल आईडी आवश्यक है (lot_id required)'),
    body('offered_price').isFloat({ min: 1 }).withMessage('मान्य प्रस्ताव मूल्य दर्ज करें (Valid offered_price required)'),
    validate
  ],
  async (req, res, next) => {
    try {
      const offer = await OfferService.createOffer(req.user.id, req.body);
      return successResponse(res, { offer }, 'प्रस्ताव सफलतापूर्वक भेजा गया (Offer sent successfully)', 201);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/offers/lot/:lotId (Offers for a lot - Farmer view)
router.get('/lot/:lotId', authMiddleware, async (req, res, next) => {
  try {
    const offers = await OfferService.getOffersForLot(req.params.lotId, req.user.id, req.user.role);
    return successResponse(res, { offers }, 'फसल पर मिले प्रस्ताव (Offers fetched)');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/offers/my (Buyer's sent offers)
router.get('/my', authMiddleware, rbac('buyer', 'admin'), async (req, res, next) => {
  try {
    const offers = await OfferService.getBuyerOffers(req.user.id);
    return successResponse(res, { offers }, 'मेरे द्वारा भेजे गए प्रस्ताव (My sent offers)');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/offers/:id (Get single offer detail)
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const offer = await OfferService.getOfferDetail(req.params.id);
    return successResponse(res, { offer }, 'प्रस्ताव विवरण (Offer details)');
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/offers/:id/accept (Farmer or Buyer accepts offer -> order automatically created)
router.put('/:id/accept', authMiddleware, rbac('farmer', 'buyer', 'fpo', 'admin'), async (req, res, next) => {
  try {
    const result = await OfferService.acceptOffer(req.params.id, req.user.id);
    return successResponse(res, result, 'प्रस्ताव स्वीकार किया गया और ऑर्डर तैयार हुआ (Offer accepted & Order generated)');
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/offers/:id/reject (Reject offer)
router.put('/:id/reject', authMiddleware, async (req, res, next) => {
  try {
    const offer = await OfferService.rejectOffer(req.params.id, req.user.id);
    return successResponse(res, { offer }, 'प्रस्ताव अस्वीकार किया गया (Offer rejected)');
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/offers/:id/counter (Farmer or Buyer makes counter offer)
router.put(
  '/:id/counter',
  authMiddleware,
  rbac('farmer', 'buyer', 'fpo', 'admin'),
  [
    body('counter_price').isFloat({ min: 1 }).withMessage('मान्य काउंटर मूल्य दर्ज करें (Valid counter_price required)'),
    validate
  ],
  async (req, res, next) => {
    try {
      const offer = await OfferService.counterOffer(req.params.id, req.user.id, req.body.counter_price);
      return successResponse(res, { offer }, 'काउंटर प्रस्ताव भेजा गया (Counter offer submitted)');
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
