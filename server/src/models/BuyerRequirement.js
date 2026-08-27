const { query, isPgConnected, memoryDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class BuyerRequirement {
  static async create(reqData) {
    const id = reqData.id || uuidv4();
    const newReq = {
      id,
      buyer_id: reqData.buyer_id,
      commodity_id: reqData.commodity_id,
      quantity_min: reqData.quantity_min ? Number(reqData.quantity_min) : null,
      quantity_max: reqData.quantity_max ? Number(reqData.quantity_max) : null,
      price_min: reqData.price_min ? Number(reqData.price_min) : null,
      price_max: Number(reqData.price_max),
      quality_grade: reqData.quality_grade || 'any',
      quality_params: reqData.quality_params || {},
      pickup_available: reqData.pickup_available || false,
      delivery_radius_km: reqData.delivery_radius_km ? Number(reqData.delivery_radius_km) : 100,
      status: 'active',
      expires_at: reqData.expires_at || new Date(Date.now() + 30 * 86400000),
      created_at: new Date(),
      updated_at: new Date()
    };

    if (isPgConnected()) {
      const sql = `
        INSERT INTO buyer_requirements (
          id, buyer_id, commodity_id, quantity_min, quantity_max, price_min, price_max,
          quality_grade, quality_params, pickup_available, delivery_radius_km, status, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      const values = [
        newReq.id, newReq.buyer_id, newReq.commodity_id, newReq.quantity_min, newReq.quantity_max,
        newReq.price_min, newReq.price_max, newReq.quality_grade, JSON.stringify(newReq.quality_params),
        newReq.pickup_available, newReq.delivery_radius_km, newReq.status, newReq.expires_at
      ];
      const res = await query(sql, values);
      return res.rows[0];
    }

    memoryDb.buyer_requirements.push(newReq);
    return newReq;
  }

  static async findById(id) {
    if (isPgConnected()) {
      const sql = `
        SELECT br.*, c.name_hi AS commodity_name_hi, c.name_en AS commodity_name_en, c.icon AS commodity_icon,
               u.name AS buyer_name, u.business_name, u.buyer_type, u.district AS buyer_district, u.state AS buyer_state,
               u.latitude AS buyer_lat, u.longitude AS buyer_lng, u.is_verified AS buyer_verified
        FROM buyer_requirements br
        JOIN commodities c ON br.commodity_id = c.id
        JOIN users u ON br.buyer_id = u.id
        WHERE br.id = $1
      `;
      const res = await query(sql, [id]);
      return res.rows[0] || null;
    }

    const req = memoryDb.buyer_requirements.find(r => r.id === id);
    if (!req) return null;
    const comm = memoryDb.commodities.find(c => c.id === req.commodity_id) || {};
    const buyer = memoryDb.users.find(u => u.id === req.buyer_id) || {};

    return {
      ...req,
      commodity_name_hi: comm.name_hi,
      commodity_name_en: comm.name_en,
      commodity_icon: comm.icon,
      buyer_name: buyer.name,
      business_name: buyer.business_name,
      buyer_type: buyer.buyer_type,
      buyer_district: buyer.district,
      buyer_state: buyer.state,
      buyer_lat: buyer.latitude,
      buyer_lng: buyer.longitude,
      buyer_verified: buyer.is_verified
    };
  }

  static async findByBuyer(buyerId) {
    if (isPgConnected()) {
      const sql = `
        SELECT br.*, c.name_hi AS commodity_name_hi, c.name_en AS commodity_name_en, c.icon AS commodity_icon
        FROM buyer_requirements br
        JOIN commodities c ON br.commodity_id = c.id
        WHERE br.buyer_id = $1
        ORDER BY br.created_at DESC
      `;
      const res = await query(sql, [buyerId]);
      return res.rows;
    }

    return memoryDb.buyer_requirements
      .filter(r => r.buyer_id === buyerId)
      .map(r => {
        const comm = memoryDb.commodities.find(c => c.id === r.commodity_id) || {};
        return {
          ...r,
          commodity_name_hi: comm.name_hi,
          commodity_name_en: comm.name_en,
          commodity_icon: comm.icon
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  static async findAll(filters = {}) {
    if (isPgConnected()) {
      let sql = `
        SELECT br.*, c.name_hi AS commodity_name_hi, c.name_en AS commodity_name_en, c.icon AS commodity_icon,
               u.name AS buyer_name, u.business_name, u.buyer_type, u.district AS buyer_district, u.state AS buyer_state,
               u.latitude AS buyer_lat, u.longitude AS buyer_lng, u.is_verified AS buyer_verified
        FROM buyer_requirements br
        JOIN commodities c ON br.commodity_id = c.id
        JOIN users u ON br.buyer_id = u.id
        WHERE 1=1
      `;
      const params = [];
      if (filters.commodityId) {
        params.push(filters.commodityId);
        sql += ` AND br.commodity_id = $${params.length}`;
      }
      if (filters.status) {
        params.push(filters.status);
        sql += ` AND br.status = $${params.length}`;
      } else {
        sql += ` AND br.status = 'active'`;
      }
      sql += ' ORDER BY br.created_at DESC';
      const res = await query(sql, params);
      return res.rows;
    }

    return memoryDb.buyer_requirements
      .filter(r => {
        const matchComm = !filters.commodityId || r.commodity_id === filters.commodityId;
        const matchStatus = filters.status ? r.status === filters.status : r.status === 'active';
        return matchComm && matchStatus;
      })
      .map(r => {
        const comm = memoryDb.commodities.find(c => c.id === r.commodity_id) || {};
        const buyer = memoryDb.users.find(u => u.id === r.buyer_id) || {};
        return {
          ...r,
          commodity_name_hi: comm.name_hi,
          commodity_name_en: comm.name_en,
          commodity_icon: comm.icon,
          buyer_name: buyer.name,
          business_name: buyer.business_name,
          buyer_type: buyer.buyer_type,
          buyer_district: buyer.district,
          buyer_state: buyer.state,
          buyer_lat: buyer.latitude,
          buyer_lng: buyer.longitude,
          buyer_verified: buyer.is_verified
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  static async delete(id) {
    if (isPgConnected()) {
      const sql = "UPDATE buyer_requirements SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *";
      const res = await query(sql, [id]);
      return res.rows[0] || null;
    }

    const req = memoryDb.buyer_requirements.find(r => r.id === id);
    if (req) {
      req.status = 'cancelled';
      req.updated_at = new Date();
      return req;
    }
    return null;
  }
}

module.exports = BuyerRequirement;
