const { query, isPgConnected, memoryDb } = require('../config/database');
const { v4: uuidv4 } = require('uuid');

class AuditLog {
  static async create({ userId, action, entityType = null, entityId = null, details = {}, ipAddress = null }) {
    const id = uuidv4();
    const entry = {
      id,
      user_id: userId,
      action,
      entity_type: entityType,
      entity_id: entityId,
      details,
      ip_address: ipAddress,
      created_at: new Date()
    };

    if (isPgConnected()) {
      const sql = `
        INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, ip_address)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      const res = await query(sql, [id, userId, action, entityType, entityId, JSON.stringify(details), ipAddress]);
      return res.rows[0];
    }

    memoryDb.audit_logs.push(entry);
    return entry;
  }

  static async findAll(limit = 50) {
    if (isPgConnected()) {
      const res = await query('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1', [limit]);
      return res.rows;
    }
    return memoryDb.audit_logs.slice(-limit).reverse();
  }
}

module.exports = AuditLog;
