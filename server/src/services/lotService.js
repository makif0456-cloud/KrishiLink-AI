const Lot = require('../models/Lot');
const AuditLog = require('../models/AuditLog');

class LotService {
  static async createLot(farmerId, lotData) {
    if (!lotData.commodity_id) {
      const err = new Error('फसल का चयन करना आवश्यक है (Commodity is required)');
      err.statusCode = 400;
      throw err;
    }

    if (!lotData.quantity || Number(lotData.quantity) <= 0) {
      const err = new Error('मान्य मात्रा दर्ज करें (Valid positive quantity is required)');
      err.statusCode = 400;
      throw err;
    }

    const lot = await Lot.create({
      ...lotData,
      farmer_id: farmerId
    });

    await AuditLog.create({
      userId: farmerId,
      action: 'create_lot',
      entityType: 'lot',
      entityId: lot.id,
      details: { commodity_id: lot.commodity_id, quantity: lot.quantity, quality_grade: lot.quality_grade }
    });

    return lot;
  }

  static async getFarmerLots(farmerId) {
    return Lot.findByFarmer(farmerId);
  }

  static async getLotDetail(id, userId, role) {
    const lot = await Lot.findById(id);
    if (!lot) {
      const err = new Error('फसल विवरण नहीं मिला (Lot not found)');
      err.statusCode = 404;
      throw err;
    }
    return lot;
  }

  static async getAllActiveLots(filters = {}) {
    return Lot.findAll(filters);
  }

  static async deleteLot(id, farmerId) {
    const lot = await Lot.findById(id);
    if (!lot) {
      const err = new Error('फसल विवरण नहीं मिला (Lot not found)');
      err.statusCode = 404;
      throw err;
    }

    if (lot.farmer_id !== farmerId) {
      const err = new Error('आप केवल अपनी फसल हटा सकते हैं (You can only delete your own lot)');
      err.statusCode = 403;
      throw err;
    }

    if (lot.status === 'sold') {
      const err = new Error('बिक चुकी फसल को हटाया नहीं जा सकता (Cannot delete sold lot)');
      err.statusCode = 400;
      throw err;
    }

    const updated = await Lot.delete(id);

    await AuditLog.create({
      userId: farmerId,
      action: 'delete_lot',
      entityType: 'lot',
      entityId: id
    });

    return updated;
  }
}

module.exports = LotService;
