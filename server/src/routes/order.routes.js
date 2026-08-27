const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { successResponse } = require('../utils/responseHelper');
const OrderService = require('../services/orderService');

// GET /api/v1/orders (List current user's orders)
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const orders = await OrderService.getOrdersForUser(req.user.id, req.user.role);
    return successResponse(res, { orders }, 'ऑर्डर सूची (Orders fetched)');
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/orders/:id (Get order detail)
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const order = await OrderService.getOrderDetail(req.params.id, req.user.id, req.user.role);
    return successResponse(res, { order }, 'ऑर्डर विवरण (Order details fetched)');
  } catch (err) {
    next(err);
  }
});

// PUT /api/v1/orders/:id/status (Advance order status)
router.put(
  '/:id/status',
  authMiddleware,
  [
    body('status').isIn(['dispatched', 'in_transit', 'delivered', 'completed', 'disputed', 'cancelled'])
      .withMessage('अमान्य स्थिति (Invalid status)'),
    validate
  ],
  async (req, res, next) => {
    try {
      const order = await OrderService.updateOrderStatus(req.params.id, req.body.status, req.user.id, req.user.role);
      return successResponse(res, { order }, 'ऑर्डर स्थिति अपडेट हो गई (Order status updated)');
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
