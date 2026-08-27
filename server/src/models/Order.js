const { query, isPgConnected, memoryDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Order {
  static async create(orderData) {
    const id = orderData.id || uuidv4();
    const newOrder = {
      id,
      offer_id: orderData.offer_id,
      lot_id: orderData.lot_id,
      farmer_id: orderData.farmer_id,
      buyer_id: orderData.buyer_id,
      agreed_price: Number(orderData.agreed_price),
      quantity: Number(orderData.quantity),
      total_amount: Number(orderData.total_amount),
      status: 'confirmed',
      expected_delivery: orderData.expected_delivery || new Date(Date.now() + 3 * 86400000), // 3 days
      actual_delivery: null,
      transport_cost: Number(orderData.transport_cost || 0),
      loading_cost: Number(orderData.loading_cost || 0),
      created_at: new Date(),
      updated_at: new Date()
    };

    if (isPgConnected()) {
      const sql = `
        INSERT INTO orders (
          id, offer_id, lot_id, farmer_id, buyer_id, agreed_price, quantity,
          total_amount, status, expected_delivery, transport_cost, loading_cost
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      const values = [
        newOrder.id, newOrder.offer_id, newOrder.lot_id, newOrder.farmer_id,
        newOrder.buyer_id, newOrder.agreed_price, newOrder.quantity, newOrder.total_amount,
        newOrder.status, newOrder.expected_delivery, newOrder.transport_cost, newOrder.loading_cost
      ];
      const res = await query(sql, values);
      return res.rows[0];
    }

    if (!memoryDb.orders) memoryDb.orders = [];
    memoryDb.orders.push(newOrder);
    return newOrder;
  }

  static async findById(id) {
    if (isPgConnected()) {
      const sql = `
        SELECT o.*,
               l.quality_grade AS lot_grade, l.unit AS lot_unit,
               c.name_hi AS commodity_name_hi, c.name_en AS commodity_name_en, c.icon AS commodity_icon,
               u_farmer.name AS farmer_name, u_farmer.phone AS farmer_phone, u_farmer.village AS farmer_village, u_farmer.district AS farmer_district,
               u_buyer.name AS buyer_name, u_buyer.business_name, u_buyer.phone AS buyer_phone, u_buyer.district AS buyer_district
        FROM orders o
        JOIN lots l ON o.lot_id = l.id
        JOIN commodities c ON l.commodity_id = c.id
        JOIN users u_farmer ON o.farmer_id = u_farmer.id
        JOIN users u_buyer ON o.buyer_id = u_buyer.id
        WHERE o.id = $1
      `;
      const res = await query(sql, [id]);
      return res.rows[0] || null;
    }

    if (!memoryDb.orders) memoryDb.orders = [];
    const order = memoryDb.orders.find(o => o.id === id);
    if (!order) return null;
    const lot = memoryDb.lots.find(l => l.id === order.lot_id) || {};
    const comm = memoryDb.commodities.find(c => c.id === lot.commodity_id) || {};
    const farmer = memoryDb.users.find(u => u.id === order.farmer_id) || {};
    const buyer = memoryDb.users.find(u => u.id === order.buyer_id) || {};

    return {
      ...order,
      lot_grade: lot.quality_grade,
      lot_unit: lot.unit || 'quintal',
      commodity_name_hi: comm.name_hi,
      commodity_name_en: comm.name_en,
      commodity_icon: comm.icon,
      farmer_name: farmer.name,
      farmer_phone: farmer.phone,
      farmer_village: farmer.village,
      farmer_district: farmer.district,
      buyer_name: buyer.name,
      business_name: buyer.business_name,
      buyer_phone: buyer.phone,
      buyer_district: buyer.district
    };
  }

  static async findByUser(userId, role) {
    if (isPgConnected()) {
      const field = role === 'buyer' ? 'o.buyer_id' : 'o.farmer_id';
      const sql = `
        SELECT o.*,
               l.quality_grade AS lot_grade, l.unit AS lot_unit,
               c.name_hi AS commodity_name_hi, c.name_en AS commodity_name_en, c.icon AS commodity_icon,
               u_farmer.name AS farmer_name, u_buyer.name AS buyer_name, u_buyer.business_name
        FROM orders o
        JOIN lots l ON o.lot_id = l.id
        JOIN commodities c ON l.commodity_id = c.id
        JOIN users u_farmer ON o.farmer_id = u_farmer.id
        JOIN users u_buyer ON o.buyer_id = u_buyer.id
        WHERE ${field} = $1
        ORDER BY o.created_at DESC
      `;
      const res = await query(sql, [userId]);
      return res.rows;
    }

    if (!memoryDb.orders) memoryDb.orders = [];
    return memoryDb.orders
      .filter(o => (role === 'buyer' ? o.buyer_id === userId : o.farmer_id === userId))
      .map(o => {
        const lot = memoryDb.lots.find(l => l.id === o.lot_id) || {};
        const comm = memoryDb.commodities.find(c => c.id === lot.commodity_id) || {};
        const farmer = memoryDb.users.find(u => u.id === o.farmer_id) || {};
        const buyer = memoryDb.users.find(u => u.id === o.buyer_id) || {};
        return {
          ...o,
          lot_grade: lot.quality_grade,
          lot_unit: lot.unit || 'quintal',
          commodity_name_hi: comm.name_hi,
          commodity_name_en: comm.name_en,
          commodity_icon: comm.icon,
          farmer_name: farmer.name,
          buyer_name: buyer.name,
          business_name: buyer.business_name
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  static async updateStatus(id, status, actualDelivery = null) {
    if (isPgConnected()) {
      let sql = 'UPDATE orders SET status = $1, updated_at = NOW()';
      const params = [status];
      if (actualDelivery) {
        params.push(actualDelivery);
        sql += `, actual_delivery = $${params.length}`;
      }
      params.push(id);
      sql += ` WHERE id = $${params.length} RETURNING *`;
      const res = await query(sql, params);
      return res.rows[0] || null;
    }

    if (!memoryDb.orders) memoryDb.orders = [];
    const order = memoryDb.orders.find(o => o.id === id);
    if (order) {
      order.status = status;
      if (actualDelivery) order.actual_delivery = actualDelivery;
      order.updated_at = new Date();
      return order;
    }
    return null;
  }
}

module.exports = Order;
