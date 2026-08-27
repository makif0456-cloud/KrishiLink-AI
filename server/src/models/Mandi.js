const { query, isPgConnected, memoryDb } = require('../config/database');

class Mandi {
  static async findAll(filters = {}) {
    if (isPgConnected()) {
      let sql = 'SELECT * FROM mandis WHERE is_active = true';
      const params = [];
      if (filters.state) {
        params.push(filters.state);
        sql += ` AND state = $${params.length}`;
      }
      sql += ' ORDER BY name_hi ASC';
      const res = await query(sql, params);
      return res.rows;
    }
    return memoryDb.mandis
      .filter(m => m.is_active && (!filters.state || m.state === filters.state));
  }

  static async findById(id) {
    if (isPgConnected()) {
      const res = await query('SELECT * FROM mandis WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    return memoryDb.mandis.find(m => m.id === id) || null;
  }
}

module.exports = Mandi;
