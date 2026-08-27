const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');

const VALID_TRANSITIONS = {
  confirmed: ['dispatched', 'cancelled'],
  dispatched: ['in_transit', 'delivered', 'cancelled'],
  in_transit: ['delivered', 'cancelled'],
  delivered: ['completed', 'disputed'],
  completed: [],
  cancelled: [],
  disputed: ['completed', 'cancelled']
};

class OrderService {
  static async getOrdersForUser(userId, role) {
    return Order.findByUser(userId, role);
  }

  static async getOrderDetail(orderId, userId, role) {
    const order = await Order.findById(orderId);
    if (!order) {
      const err = new Error('ऑर्डर नहीं मिला (Order not found)');
      err.statusCode = 404;
      throw err;
    }

    if (role !== 'admin' && order.farmer_id !== userId && order.buyer_id !== userId) {
      const err = new Error('इस ऑर्डर को देखने की अनुमति नहीं है (Unauthorized to view this order)');
      err.statusCode = 403;
      throw err;
    }

    return order;
  }

  static async updateOrderStatus(orderId, nextStatus, userId, role) {
    const order = await Order.findById(orderId);
    if (!order) {
      const err = new Error('ऑर्डर नहीं मिला (Order not found)');
      err.statusCode = 404;
      throw err;
    }

    // Authorization: involved parties or admin
    if (role !== 'admin' && order.farmer_id !== userId && order.buyer_id !== userId) {
      const err = new Error('इस ऑर्डर की स्थिति बदलने की अनुमति नहीं है (Unauthorized to update order status)');
      err.statusCode = 403;
      throw err;
    }

    // Role-specific constraints:
    // Farmer cannot arbitrarily mark order as delivered or completed without buyer
    if (role === 'farmer' && (nextStatus === 'delivered' || nextStatus === 'completed')) {
      const err = new Error('केवल खरीदार डिलीवरी या पूर्णता की पुष्टि कर सकता है (Only buyer can confirm delivery/completion)');
      err.statusCode = 403;
      throw err;
    }

    // Validate state machine transition
    const allowed = VALID_TRANSITIONS[order.status] || [];
    if (!allowed.includes(nextStatus)) {
      const err = new Error(`अमान्य स्थिति परिवर्तन: ${order.status} से ${nextStatus} नहीं किया जा सकता (Invalid transition from ${order.status} to ${nextStatus})`);
      err.statusCode = 400;
      throw err;
    }

    const actualDelivery = nextStatus === 'delivered' ? new Date() : null;
    const updatedOrder = await Order.updateStatus(orderId, nextStatus, actualDelivery);

    await AuditLog.create({
      userId,
      action: 'update_order_status',
      entityType: 'order',
      entityId: orderId,
      details: { previous_status: order.status, new_status: nextStatus }
    });

    return updatedOrder;
  }
}

module.exports = OrderService;
