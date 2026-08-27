const { query, isPgConnected, memoryDb } = require('../config/database');

class PlatformConfig {
  static async get(key) {
    if (isPgConnected()) {
      const res = await query('SELECT value FROM platform_config WHERE key = $1', [key]);
      return res.rows[0]?.value || null;
    }
    return memoryDb.platform_config[key] || null;
  }

  static async set(key, value, description = null, updatedBy = null) {
    if (isPgConnected()) {
      const sql = `
        INSERT INTO platform_config (key, value, description, updated_by, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (key) DO UPDATE SET value = $2, description = COALESCE($3, platform_config.description), updated_by = $4, updated_at = NOW()
        RETURNING *
      `;
      const res = await query(sql, [key, JSON.stringify(value), description, updatedBy]);
      return res.rows[0];
    }
    memoryDb.platform_config[key] = value;
    return { key, value, description, updated_at: new Date() };
  }
}

module.exports = PlatformConfig;
