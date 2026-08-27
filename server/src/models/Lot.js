const { query, isPgConnected, memoryDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class Lot {
  static async create(lotData) {
    const id = lotData.id || uuidv4();
    const newLot = {
      id,
      farmer_id: lotData.farmer_id,
      commodity_id: lotData.commodity_id,
      quantity: Number(lotData.quantity),
      unit: lotData.unit || 'quintal',
      quality_grade: lotData.quality_grade || 'A',
      quality_params: lotData.quality_params || {},
      latitude: lotData.latitude ? parseFloat(lotData.latitude) : null,
      longitude: lotData.longitude ? parseFloat(lotData.longitude) : null,
      expected_price: lotData.expected_price ? Number(lotData.expected_price) : null,
      photos: lotData.photos || [],
      status: 'active',
      notes: lotData.notes || '',
      expires_at: lotData.expires_at || new Date(Date.now() + 14 * 86400000), // 14 days default
      created_at: new Date(),
      updated_at: new Date()
    };

    if (isPgConnected()) {
      const sql = `
        INSERT INTO lots (
          id, farmer_id, commodity_id, quantity, unit, quality_grade, quality_params,
          latitude, longitude, expected_price, photos, status, notes, expires_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `;
      const values = [
        newLot.id, newLot.farmer_id, newLot.commodity_id, newLot.quantity, newLot.unit,
        newLot.quality_grade, JSON.stringify(newLot.quality_params), newLot.latitude,
        newLot.longitude, newLot.expected_price, JSON.stringify(newLot.photos),
        newLot.status, newLot.notes, newLot.expires_at
      ];
      const res = await query(sql, values);
      return res.rows[0];
    }

    memoryDb.lots.push(newLot);
    return newLot;
  }

  static async findById(id) {
    if (isPgConnected()) {
      const sql = `
        SELECT l.*, c.name_hi AS commodity_name_hi, c.name_en AS commodity_name_en, c.icon AS commodity_icon,
               u.name AS farmer_name, u.phone AS farmer_phone, u.village AS farmer_village, u.district AS farmer_district, u.state AS farmer_state
        FROM lots l
        JOIN commodities c ON l.commodity_id = c.id
        JOIN users u ON l.farmer_id = u.id
        WHERE l.id = $1
      `;
      const res = await query(sql, [id]);
      return res.rows[0] || null;
    }

    const lot = memoryDb.lots.find(l => l.id === id);
    if (!lot) return null;
    const comm = memoryDb.commodities.find(c => c.id === lot.commodity_id) || {};
    const farmer = memoryDb.users.find(u => u.id === lot.farmer_id) || {};

    return {
      ...lot,
      commodity_name_hi: comm.name_hi,
      commodity_name_en: comm.name_en,
      commodity_icon: comm.icon,
      farmer_name: farmer.name,
      farmer_phone: farmer.phone,
      farmer_village: farmer.village,
      farmer_district: farmer.district,
      farmer_state: farmer.state
    };
  }

  static async findByFarmer(farmerId) {
    if (isPgConnected()) {
      const sql = `
        SELECT l.*, c.name_hi AS commodity_name_hi, c.name_en AS commodity_name_en, c.icon AS commodity_icon,
               (SELECT COUNT(*) FROM offers o WHERE o.lot_id = l.id) AS offers_count
        FROM lots l
        JOIN commodities c ON l.commodity_id = c.id
        WHERE l.farmer_id = $1
        ORDER BY l.created_at DESC
      `;
      const res = await query(sql, [farmerId]);
      return res.rows;
    }

    return memoryDb.lots
      .filter(l => l.farmer_id === farmerId)
      .map(lot => {
        const comm = memoryDb.commodities.find(c => c.id === lot.commodity_id) || {};
        const offersCount = (memoryDb.offers || []).filter(o => o.lot_id === lot.id).length;
        return {
          ...lot,
          commodity_name_hi: comm.name_hi,
          commodity_name_en: comm.name_en,
          commodity_icon: comm.icon,
          offers_count: offersCount
        };
      })
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }

  static async findAll(filters = {}) {
    if (isPgConnected()) {
      let sql = `
        SELECT l.*, c.name_hi AS commodity_name_hi, c.name_en AS commodity_name_en, c.icon AS commodity_icon,
               u.name AS farmer_name, u.district AS farmer_district, u.state AS farmer_state
        FROM lots l
        JOIN commodities c ON l.commodity_id = c.id
        JOIN users u ON l.farmer_id = u.id
        WHERE 1=1
      `;
      const params = [];
      if (filters.commodityId) {
        params.push(filters.commodityId);
        sql += ` AND l.commodity_id = $${params.length}`;
      }
      if (filters.status) {
        params.push(filters.status);
        sql += ` AND l.status = $${params.length}`;
      } else {
        sql += ` AND l.status IN ('active', 'offer_received')`;
      }
      sql += ' ORDER BY l.created_at DESC';
      const res = await query(sql, params);
      return res.rows;
    }

    return memoryDb.lots
      .filter(l => {
        const matchComm = !filters.commodityId || l.commodity_id === filters.commodityId;
        const matchStatus = filters.status ? l.status === filters.status : (l.status === 'active' || l.status === 'offer_received');
        return matchComm && matchStatus;
      })
      .map(lot => {
        const comm = memoryDb.commodities.find(c => c.id === lot.commodity_id) || {};
        const farmer = memoryDb.users.find(u => u.id === lot.farmer_id) || {};
        return {
          ...lot,
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

  static async updateStatus(id, status) {
    if (isPgConnected()) {
      const sql = 'UPDATE lots SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *';
      const res = await query(sql, [status, id]);
      return res.rows[0] || null;
    }

    const lot = memoryDb.lots.find(l => l.id === id);
    if (lot) {
      lot.status = status;
      lot.updated_at = new Date();
      return lot;
    }
    return null;
  }

  static async delete(id) {
    if (isPgConnected()) {
      const sql = "UPDATE lots SET status = 'cancelled', updated_at = NOW() WHERE id = $1 RETURNING *";
      const res = await query(sql, [id]);
      return res.rows[0] || null;
    }

    const lot = memoryDb.lots.find(l => l.id === id);
    if (lot) {
      lot.status = 'cancelled';
      lot.updated_at = new Date();
      return lot;
    }
    return null;
  }
}

module.exports = Lot;
