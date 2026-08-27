const { query, isPgConnected, memoryDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Offer {
  static async create(offerData) {
    const id = offerData.id || uuidv4();
    const newOffer = {
      id,
      lot_id: offerData.lot_id,
      buyer_id: offerData.buyer_id,
      offered_price: Number(offerData.offered_price),
      total_amount: Number(offerData.total_amount),
      pickup_offered: offerData.pickup_offered || false,
      payment_terms: offerData.payment_terms || 'on_delivery',
      notes: offerData.notes || '',
      status: 'pending',
      counter_price: null,
      expires_at: offerData.expires_at || new Date(Date.now() + 7 * 86400000), // 7 days default
      created_at: new Date(),
      updated_at: new Date()
    };

    if (isPgConnected()) {
      const sql = `
        INSERT INTO offers (
          id, lot_id, buyer_id, offered_price, total_amount, pickup_offered,
          payment_terms, notes, status, counter_price, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      const values = [
        newOffer.id, newOffer.lot_id, newOffer.buyer_id, newOffer.offered_price,
        newOffer.total_amount, newOffer.pickup_offered, newOffer.payment_terms,
        newOffer.notes, newOffer.status, newOffer.counter_price, newOffer.expires_at
      ];
      const res = await query(sql, values);
      return res.rows[0];
    }

    if (!memoryDb.offers) memoryDb.offers = [];
    memoryDb.offers.push(newOffer);
    return newOffer;
  }

  static async findById(id) {
    if (isPgConnected()) {
      const sql = `
        SELECT o.*, 
               l.commodity_id, l.quantity AS lot_quantity, l.unit AS lot_unit, l.quality_grade AS lot_grade, l.farmer_id,
               c.name_hi AS commodity_name_hi, c.name_en AS commodity_name_en, c.icon AS commodity_icon,
               u_buyer.name AS buyer_name, u_buyer.business_name, u_buyer.phone AS buyer_phone, u_buyer.district AS buyer_district, u_buyer.is_verified AS buyer_verified,
               u_farmer.name AS farmer_name, u_farmer.phone AS farmer_phone, u_farmer.village AS farmer_village, u_farmer.district AS farmer_district
        FROM offers o
        JOIN lots l ON o.lot_id = l.id
        JOIN commodities c ON l.commodity_id = c.id
        JOIN users u_buyer ON o.buyer_id = u_buyer.id
        JOIN users u_farmer ON l.farmer_id = u_farmer.id
        WHERE o.id = $1
      `;
      const res = await query(sql, [id]);
      return res.rows[0] || null;
    }

    if (!memoryDb.offers) memoryDb.offers = [];
    const offer = memoryDb.offers.find(o => o.id === id);
    if (!offer) return null;
    const lot = memoryDb.lots.find(l => l.id === offer.lot_id) || {};
    const comm = memoryDb.commodities.find(c => c.id === lot.commodity_id) || {};
    const buyer = memoryDb.users.find(u => u.id === offer.buyer_id) || {};
    const farmer = memoryDb.users.find(u => u.id === lot.farmer_id) || {};

    return {
      ...offer,
      lot_quantity: lot.quantity,
      lot_unit: lot.unit,
      lot_grade: lot.quality_grade,
      farmer_id: lot.farmer_id,
      commodity_id: lot.commodity_id,
      commodity_name_hi: comm.name_hi,
      commodity_name_en: comm.name_en,
      commodity_icon: comm.icon,
      buyer_name: buyer.name,
      business_name: buyer.business_name,
      buyer_phone: buyer.phone,
      buyer_district: buyer.district,
      buyer_verified: buyer.is_verified,
      farmer_name: farmer.name,
      farmer_phone: farmer.phone,
      farmer_village: farmer.village,
      farmer_district: farmer.district
    };
  }

  static async findByLot(lotId) {
    if (isPgConnected()) {
      const sql = `
        SELECT o.*, 
               u_buyer.name AS buyer_name, u_buyer.business_name, u_buyer.phone AS buyer_phone,
               u_buyer.district AS buyer_district, u_buyer.state AS buyer_state, u_buyer.is_verified AS buyer_verified
        FROM offers o
        JOIN users u_buyer ON o.buyer_id = u_buyer.id
        WHERE o.lot_id = $1
        ORDER BY o.offered_price DESC, o.created_at DESC
      `;
      const res = await query(sql, [lotId]);
      return res.rows;
    }

    if (!memoryDb.offers) memoryDb.offers = [];
    return memoryDb.offers
      .filter(o => o.lot_id === lotId)
      .map(o => {
        const buyer = memoryDb.users.find(u => u.id === o.buyer_id) || {};
        return {
          ...o,
          buyer_name: buyer.name,
          business_name: buyer.business_name,
          buyer_phone: buyer.phone,
          buyer_district: buyer.district,
          buyer_state: buyer.state,
          buyer_verified: buyer.is_verified
        };
      })
      .sort((a, b) => b.offered_price - a.offered_price);
  }

  static async findByBuyer(buyerId) {
    if (isPgConnected()) {
      const sql = `
        SELECT o.*, 
               l.quantity AS lot_quantity, l.quality_grade AS lot_grade,
               c.name_hi AS commodity_name_hi, c.name_en AS commodity_name_en, c.icon AS commodity_icon,
               u_farmer.name AS farmer_name, u_farmer.district AS farmer_district, u_farmer.state AS farmer_state
        FROM offers o
        JOIN lots l ON o.lot_id = l.id
        JOIN commodities c ON l.commodity_id = c.id
        JOIN users u_farmer ON l.farmer_id = u_farmer.id
        WHERE o.buyer_id = $1
        ORDER BY o.created_at DESC
      `;
      const res = await query(sql, [buyerId]);
      return res.rows;
    }

    if (!memoryDb.offers) memoryDb.offers = [];
    return memoryDb.offers
      .filter(o => o.buyer_id === buyerId)
      .map(o => {
        const lot = memoryDb.lots.find(l => l.id === o.lot_id) || {};
        const comm = memoryDb.commodities.find(c => c.id === lot.commodity_id) || {};
        const farmer = memoryDb.users.find(u => u.id === lot.farmer_id) || {};
        return {
          ...o,
          lot_quantity: lot.quantity,
          lot_grade: lot.quality_grade,
          commodity_name_hi: comm.name_hi,
          commodity_name_en: comm.name_en,
          commodity_icon: comm.icon,
          farmer_name: farmer.name,
          farmer_district: farmer.district,
          farmer_state: farmer.state
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  static async updateStatus(id, status, counterPrice = null) {
    if (isPgConnected()) {
      let sql = 'UPDATE offers SET status = $1, updated_at = NOW()';
      const params = [status];
      if (counterPrice !== null) {
        params.push(Number(counterPrice));
        sql += `, counter_price = $${params.length}`;
      }
      params.push(id);
      sql += ` WHERE id = $${params.length} RETURNING *`;
      const res = await query(sql, params);
      return res.rows[0] || null;
    }

    if (!memoryDb.offers) memoryDb.offers = [];
    const offer = memoryDb.offers.find(o => o.id === id);
    if (offer) {
      offer.status = status;
      if (counterPrice !== null) {
        offer.counter_price = Number(counterPrice);
      }
      offer.updated_at = new Date();
      return offer;
    }
    return null;
  }
}

module.exports = Offer;
