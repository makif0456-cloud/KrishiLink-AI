const { query, isPgConnected, memoryDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class User {
  static async findByPhone(phone) {
    if (isPgConnected()) {
      const res = await query('SELECT * FROM users WHERE phone = $1', [phone]);
      return res.rows[0] || null;
    }
    return memoryDb.users.find(u => u.phone === phone) || null;
  }

  static async findById(id) {
    if (isPgConnected()) {
      const res = await query('SELECT * FROM users WHERE id = $1', [id]);
      return res.rows[0] || null;
    }
    return memoryDb.users.find(u => u.id === id) || null;
  }

  static async create(userData) {
    const id = userData.id || uuidv4();
    const newUser = {
      id,
      phone: userData.phone,
      name: userData.name,
      role: userData.role || 'farmer',
      password_hash: userData.password_hash,
      village: userData.village || null,
      district: userData.district || null,
      state: userData.state || 'Madhya Pradesh',
      latitude: userData.latitude ? parseFloat(userData.latitude) : 23.6341,
      longitude: userData.longitude ? parseFloat(userData.longitude) : 77.4338,
      land_area_acres: userData.land_area_acres ? parseFloat(userData.land_area_acres) : null,
      business_name: userData.business_name || null,
      buyer_type: userData.buyer_type || null,
      is_verified: userData.role === 'admin' ? true : false,
      preferred_lang: userData.preferred_lang || 'hi',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    };

    if (isPgConnected()) {
      const sql = `
        INSERT INTO users (
          id, phone, name, role, password_hash, village, district, state,
          latitude, longitude, land_area_acres, business_name, buyer_type,
          is_verified, preferred_lang, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `;
      const values = [
        newUser.id, newUser.phone, newUser.name, newUser.role, newUser.password_hash,
        newUser.village, newUser.district, newUser.state, newUser.latitude, newUser.longitude,
        newUser.land_area_acres, newUser.business_name, newUser.buyer_type,
        newUser.is_verified, newUser.preferred_lang, newUser.is_active
      ];
      const res = await query(sql, values);
      return res.rows[0];
    }

    memoryDb.users.push(newUser);
    return newUser;
  }

  static async findAll(filters = {}) {
    if (isPgConnected()) {
      let sql = 'SELECT id, phone, name, role, village, district, state, business_name, buyer_type, is_verified, is_active, created_at FROM users WHERE 1=1';
      const params = [];
      if (filters.role) {
        params.push(filters.role);
        sql += ` AND role = $${params.length}`;
      }
      const res = await query(sql, params);
      return res.rows;
    }

    return memoryDb.users
      .filter(u => !filters.role || u.role === filters.role)
      .map(({ password_hash, ...rest }) => rest);
  }

  static async updateProfile(id, updates) {
    if (isPgConnected()) {
      const fields = [];
      const values = [];
      let idx = 1;
      for (const [key, val] of Object.entries(updates)) {
        if (key !== 'id' && key !== 'password_hash') {
          fields.push(`${key} = $${idx++}`);
          values.push(val);
        }
      }
      values.push(id);
      const sql = `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`;
      const res = await query(sql, values);
      return res.rows[0];
    }

    const user = memoryDb.users.find(u => u.id === id);
    if (user) {
      Object.assign(user, updates, { updated_at: new Date() });
      const { password_hash, ...safeUser } = user;
      return safeUser;
    }
    return null;
  }
}

module.exports = User;
