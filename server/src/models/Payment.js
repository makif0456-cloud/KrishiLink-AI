const { query, isPgConnected, memoryDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Payment {
  static async create(paymentData) {
    const id = paymentData.id || uuidv4();
    const newPayment = {
      id,
      order_id: paymentData.order_id,
      amount: Number(paymentData.amount),
      payment_type: paymentData.payment_type || 'full',
      status: paymentData.status || 'completed',
      payment_method: paymentData.payment_method || 'upi',
      transaction_ref: paymentData.transaction_ref || `TXN-DEMO-${Date.now()}`,
      paid_at: paymentData.paid_at || new Date(),
      created_at: new Date()
    };

    if (isPgConnected()) {
      const sql = `
        INSERT INTO payments (
          id, order_id, amount, payment_type, status, payment_method, transaction_ref, paid_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      const values = [
        newPayment.id, newPayment.order_id, newPayment.amount, newPayment.payment_type,
        newPayment.status, newPayment.payment_method, newPayment.transaction_ref, newPayment.paid_at
      ];
      const res = await query(sql, values);
      return res.rows[0];
    }

    if (!memoryDb.payments) memoryDb.payments = [];
    memoryDb.payments.push(newPayment);
    return newPayment;
  }

  static async findByOrder(orderId) {
    if (isPgConnected()) {
      const sql = 'SELECT * FROM payments WHERE order_id = $1 ORDER BY created_at DESC';
      const res = await query(sql, [orderId]);
      return res.rows;
    }

    if (!memoryDb.payments) memoryDb.payments = [];
    return memoryDb.payments.filter(p => p.order_id === orderId);
  }

  static async findByUser(userId, role) {
    if (isPgConnected()) {
      const field = role === 'buyer' ? 'o.buyer_id' : 'o.farmer_id';
      const sql = `
        SELECT p.*, o.agreed_price, o.quantity, o.status AS order_status,
               c.name_hi AS commodity_name_hi, c.name_en AS commodity_name_en, c.icon AS commodity_icon,
               u_farmer.name AS farmer_name, u_buyer.name AS buyer_name, u_buyer.business_name
        FROM payments p
        JOIN orders o ON p.order_id = o.id
        JOIN lots l ON o.lot_id = l.id
        JOIN commodities c ON l.commodity_id = c.id
        JOIN users u_farmer ON o.farmer_id = u_farmer.id
        JOIN users u_buyer ON o.buyer_id = u_buyer.id
        WHERE ${field} = $1
        ORDER BY p.created_at DESC
      `;
      const res = await query(sql, [userId]);
      return res.rows;
    }

    if (!memoryDb.payments) memoryDb.payments = [];
    return memoryDb.payments
      .map(p => {
        const order = (memoryDb.orders || []).find(o => o.id === p.order_id) || {};
        if (role === 'buyer' ? order.buyer_id !== userId : order.farmer_id !== userId) {
          return null;
        }
        const lot = (memoryDb.lots || []).find(l => l.id === order.lot_id) || {};
        const comm = (memoryDb.commodities || []).find(c => c.id === lot.commodity_id) || {};
        const farmer = (memoryDb.users || []).find(u => u.id === order.farmer_id) || {};
        const buyer = (memoryDb.users || []).find(u => u.id === order.buyer_id) || {};
        return {
          ...p,
          agreed_price: order.agreed_price,
          quantity: order.quantity,
          order_status: order.status,
          commodity_name_hi: comm.name_hi,
          commodity_name_en: comm.name_en,
          commodity_icon: comm.icon,
          farmer_name: farmer.name,
          buyer_name: buyer.name,
          business_name: buyer.business_name
        };
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }
}

module.exports = Payment;
