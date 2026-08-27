const { query, isPgConnected, memoryDb } = require('../config/database');

class Commodity {
  static async findAll() {
    if (isPgConnected()) {
      const res = await query('SELECT * FROM commodities WHERE is_active = true ORDER BY name_hi ASC');
      return res.rows;
    }
    return memoryDb.commodities.filter(c => c.is_active);
  }

  static async findById(id) {
    if (isPgConnected()) {
      const res = await query('SELECT * FROM commodities WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    return memoryDb.commodities.find(c => c.id === id) || null;
  }
}

module.exports = Commodity;
