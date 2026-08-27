const BuyerRequirement = require('../models/BuyerRequirement');
const AuditLog = require('../models/AuditLog');

class BuyerRequirementService {
  static async createRequirement(buyerId, reqData) {
    if (!reqData.commodity_id) {
      const err = new Error('फसल का चयन करना आवश्यक है (Commodity is required)');
      err.statusCode = 400;
      throw err;
    }

    if (!reqData.price_max || Number(reqData.price_max) <= 0) {
      const err = new Error('अधिकतम खरीद मूल्य आवश्यक है (Maximum price is required)');
      err.statusCode = 400;
      throw err;
    }

    const requirement = await BuyerRequirement.create({
      ...reqData,
      buyer_id: buyerId
    });

    await AuditLog.create({
      userId: buyerId,
      action: 'create_buyer_requirement',
      entityType: 'buyer_requirement',
      entityId: requirement.id,
      details: { commodity_id: requirement.commodity_id, price_max: requirement.price_max }
    });

    return requirement;
  }

  static async getBuyerRequirements(buyerId) {
    return BuyerRequirement.findByBuyer(buyerId);
  }

  static async getAllActiveRequirements(filters = {}) {
    return BuyerRequirement.findAll(filters);
  }

  static async deleteRequirement(id, buyerId) {
    const req = await BuyerRequirement.findById(id);
    if (!req) {
      const err = new Error('आवश्यकता विवरण नहीं मिला (Requirement not found)');
      err.statusCode = 404;
      throw err;
    }

    if (req.buyer_id !== buyerId) {
      const err = new Error('आप केवल अपनी आवश्यकता हटा सकते हैं (You can only delete your own requirement)');
      err.statusCode = 403;
      throw err;
    }

    const updated = await BuyerRequirement.delete(id);

    await AuditLog.create({
      userId: buyerId,
      action: 'delete_buyer_requirement',
      entityType: 'buyer_requirement',
      entityId: id
    });

    return updated;
  }
}

module.exports = BuyerRequirementService;
