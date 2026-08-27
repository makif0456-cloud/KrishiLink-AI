const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { validate } = require('../middleware/validate');
const { successResponse } = require('../utils/responseHelper');
const PaymentService = require('../services/paymentService');

// POST /api/v1/payments (Buyer records simulated payment)
router.post(
  '/',
  authMiddleware,
  rbac('buyer', 'admin'),
  [
    body('order_id').notEmpty().withMessage('ऑर्डर आईडी आवश्यक है (order_id required)'),
    body('amount').isFloat({ min: 1 }).withMessage('मान्य भुगतान राशि आवश्यक है (Valid amount required)'),
    validate
  ],
  async (req, res, next) => {
    try {
      const payment = await PaymentService.recordPayment(req.user.id, req.body);
      return successResponse(res, { payment }, 'भुगतान दर्ज किया गया (Payment recorded successfully)', 201);
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/payments/order/:orderId (Get payments for an order)
router.get('/order/:orderId', authMiddleware, async (req, res, next) => {
  try {
    const payments = await PaymentService.getPaymentsForOrder(req.params.orderId, req.user.id, req.user.role);
    return successResponse(res, { payments }, 'भुगतान विवरण (Payments list fetched)');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/payments/my (User's payments history)
router.get('/my', authMiddleware, async (req, res, next) => {
  try {
    const payments = await PaymentService.getPaymentsForUser(req.user.id, req.user.role);
    return successResponse(res, { payments }, 'भुगतान इतिहास (Payments history fetched)');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
