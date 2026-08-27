const { query, isPgConnected, memoryDb } = require('../config/database');

class MandiPrice {
  static async findLatestPrices(filters = {}) {
    if (isPgConnected()) {
      let sql = `
        SELECT 
          mp.id, mp.price_date, mp.min_price, mp.max_price, mp.modal_price, mp.arrivals_tonnes, mp.unit, mp.is_demo_data,
          m.id AS mandi_id, m.name_hi AS mandi_name_hi, m.name_en AS mandi_name_en, m.district AS mandi_district, m.state AS mandi_state, m.latitude AS mandi_latitude, m.longitude AS mandi_longitude,
          c.id AS commodity_id, c.name_hi AS commodity_name_hi, c.name_en AS commodity_name_en, c.icon AS commodity_icon, c.category AS commodity_category
        FROM mandi_prices mp
        JOIN mandis m ON mp.mandi_id = m.id
        JOIN commodities c ON mp.commodity_id = c.id
        WHERE 1=1
      `;
      const params = [];
      if (filters.commodityId) {
        params.push(filters.commodityId);
        sql += ` AND mp.commodity_id = $${params.length}`;
      }
      if (filters.mandiId) {
        params.push(filters.mandiId);
        sql += ` AND mp.mandi_id = $${params.length}`;
      }
      sql += ` ORDER BY mp.price_date DESC, mp.modal_price DESC`;
      const res = await query(sql, params);
      return res.rows;
    }

    // Memory Store lookup
    return memoryDb.mandi_prices
      .filter(p => (!filters.commodityId || p.commodity_id === filters.commodityId) &&
                   (!filters.mandiId || p.mandi_id === filters.mandiId))
      .map(p => {
        const mandi = memoryDb.mandis.find(m => m.id === p.mandi_id) || {};
        const comm = memoryDb.commodities.find(c => c.id === p.commodity_id) || {};
        const prevModal = p.previous_modal || (p.modal_price * 0.98);
        const change = p.modal_price - prevModal;
        const trend = change > 0 ? 'rising' : change < 0 ? 'falling' : 'stable';

        return {
          id: p.id,
          price_date: p.price_date,
          min_price: Number(p.min_price),
          max_price: Number(p.max_price),
          modal_price: Number(p.modal_price),
          previous_modal: Number(prevModal),
          price_change: Number(change.toFixed(2)),
          trend,
          arrivals_tonnes: Number(p.arrivals_tonnes || 0),
          unit: p.unit || 'quintal',
          is_demo_data: true,
          mandi_id: mandi.id,
          mandi_name_hi: mandi.name_hi,
          mandi_name_en: mandi.name_en,
          mandi_district: mandi.district,
          mandi_state: mandi.state,
          mandi_latitude: mandi.latitude,
          mandi_longitude: mandi.longitude,
          commodity_id: comm.id,
          commodity_name_hi: comm.name_hi,
          commodity_name_en: comm.name_en,
          commodity_icon: comm.icon,
          commodity_category: comm.category
        };
      });
  }

  static async getTrends(commodityId, mandiId = null, days = 30) {
    const prices = await this.findLatestPrices({ commodityId, mandiId });
    // Generate historical trend curve for demo
    const baseModal = prices.length > 0 ? prices[0].modal_price : 2500;
    const history = [];

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      // realistic variance around baseModal
      const variance = Math.sin(i / 3) * 60 + ((days - i) * 3.5);
      const price = Math.round(baseModal - 80 + variance);
      history.push({
        date: dateStr,
        price,
        min: price - 80,
        max: price + 100
      });
    }

    return history;
  }
}

module.exports = MandiPrice;
