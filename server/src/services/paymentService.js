const Payment = require('../models/Payment');
const Order = require('../models/Order');
const AuditLog = require('../models/AuditLog');

class PaymentService {
  static async recordPayment(buyerId, paymentData) {
    const order = await Order.findById(paymentData.order_id);
    if (!order) {
      const err = new Error('ऑर्डर नहीं मिला (Order not found)');
      err.statusCode = 404;
      throw err;
    }

    if (order.buyer_id !== buyerId) {
      const err = new Error('केवल खरीदार भुगतान दर्ज कर सकता है (Only order buyer can record payment)');
      err.statusCode = 403;
      throw err;
    }

    const amount = Number(paymentData.amount || order.total_amount);
    if (amount <= 0) {
      const err = new Error('मान्य भुगतान राशि आवश्यक है (Valid payment amount is required)');
      err.statusCode = 400;
      throw err;
    }

    const payment = await Payment.create({
      order_id: order.id,
      amount,
      payment_type: paymentData.payment_type || 'full',
      payment_method: paymentData.payment_method || 'upi',
      status: 'completed',
      transaction_ref: paymentData.transaction_ref || `UPI-DEMO-${Date.now().toString().slice(-8)}`,
      paid_at: new Date()
    });

    // Automatically update order status to completed if full payment recorded
    if (order.status !== 'completed' && order.status !== 'cancelled') {
      await Order.updateStatus(order.id, 'completed');
    }

    await AuditLog.create({
      userId: buyerId,
      action: 'record_payment',
      entityType: 'payment',
      entityId: payment.id,
      details: { order_id: order.id, amount, status: 'completed' }
    });

    return payment;
  }

  static async getPaymentsForOrder(orderId, userId, role) {
    const order = await Order.findById(orderId);
    if (!order) {
      const err = new Error('ऑर्डर नहीं मिला (Order not found)');
      err.statusCode = 404;
      throw err;
    }

    if (role !== 'admin' && order.farmer_id !== userId && order.buyer_id !== userId) {
      const err = new Error('इस भुगतान विवरण को देखने की अनुमति नहीं है (Unauthorized)');
      err.statusCode = 403;
      throw err;
    }

    return Payment.findByOrder(orderId);
  }

  static async getPaymentsForUser(userId, role) {
    return Payment.findByUser(userId, role);
  }
}

module.exports = PaymentService;
