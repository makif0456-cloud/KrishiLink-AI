const { query, isPgConnected, memoryDb } = require('../config/database');
const User = require('../models/User');
const PlatformConfig = require('../models/PlatformConfig');
const AuditLog = require('../models/AuditLog');

const DEFAULT_MATCHING_WEIGHTS = {
  price: 40,
  distance: 20,
  quantity_match: 15,
  quality_match: 10,
  payment_reliability: 10,
  delivery_compatibility: 5
};

class AdminService {
  /**
   * Aggregate platform-wide KPIs and analytics
   */
  static async getAnalytics() {
    let users = [];
    let lots = [];
    let offers = [];
    let orders = [];

    if (isPgConnected()) {
      const uRes = await query('SELECT * FROM users');
      users = uRes.rows;
      const lRes = await query('SELECT * FROM lots');
      lots = lRes.rows;
      const ofRes = await query('SELECT * FROM offers');
      offers = ofRes.rows;
      const orRes = await query('SELECT * FROM orders');
      orders = orRes.rows;
    } else {
      users = memoryDb.users || [];
      lots = memoryDb.lots || [];
      offers = memoryDb.offers || [];
      orders = memoryDb.orders || [];
    }

    const farmers = users.filter(u => u.role === 'farmer');
    const buyers = users.filter(u => u.role === 'buyer');
    const fpos = users.filter(u => u.role === 'fpo');
    const pendingBuyers = buyers.filter(u => !u.is_verified);

    const activeLots = lots.filter(l => l.status === 'active');
    const soldLots = lots.filter(l => l.status === 'sold');
    const totalProduceQuantity = lots.reduce((sum, l) => sum + Number(l.quantity || 0), 0);

    const completedOrders = orders.filter(o => o.status === 'completed');
    const totalTradingValue = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    const completedTradingValue = completedOrders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

    // Commodity breakdown
    const commodityMap = {
      'b0000000-0000-0000-0000-000000000001': 'गेहूं (Wheat)',
      'b0000000-0000-0000-0000-000000000002': 'सोयाबीन (Soybean)',
      'b0000000-0000-0000-0000-000000000003': 'सरसों (Mustard)',
      'b0000000-0000-0000-0000-000000000004': 'चना (Chana)',
      'b0000000-0000-0000-0000-000000000005': 'प्याज (Onion)'
    };

    const commodityStats = {};
    for (const lot of lots) {
      const name = commodityMap[lot.commodity_id] || 'अन्य (Other)';
      if (!commodityStats[name]) {
        commodityStats[name] = { count: 0, total_quantity: 0 };
      }
      commodityStats[name].count += 1;
      commodityStats[name].total_quantity += Number(lot.quantity || 0);
    }

    const orderStatusCounts = {
      confirmed: orders.filter(o => o.status === 'confirmed').length,
      dispatched: orders.filter(o => o.status === 'dispatched').length,
      delivered: orders.filter(o => o.status === 'delivered').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };

    return {
      kpis: {
        total_users: users.length,
        farmers_count: farmers.length,
        buyers_count: buyers.length,
        fpos_count: fpos.length,
        active_lots_count: activeLots.length,
        sold_lots_count: soldLots.length,
        total_produce_quintals: totalProduceQuantity,
        total_offers_count: offers.length,
        total_orders_count: orders.length,
        completed_orders_count: completedOrders.length,
        total_trading_value: totalTradingValue,
        completed_trading_value: completedTradingValue,
        pending_buyer_verifications: pendingBuyers.length
      },
      commodity_breakdown: commodityStats,
      order_status_distribution: orderStatusCounts,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get pending buyer verification queue
   */
  static async getPendingBuyers() {
    const allBuyers = await User.findAll({ role: 'buyer' });
    return allBuyers.filter(b => !b.is_verified);
  }

  /**
   * Verify buyer
   */
  static async verifyBuyer(buyerId, adminId) {
    const buyer = await User.findById(buyerId);
    if (!buyer) {
      const err = new Error('खरीदार नहीं मिला (Buyer not found)');
      err.statusCode = 404;
      throw err;
    }

    const updated = await User.updateProfile(buyerId, { is_verified: true, is_active: true });

    await AuditLog.create({
      userId: adminId,
      action: 'verify_buyer',
      entityType: 'user',
      entityId: buyerId
    });

    return updated;
  }

  /**
   * Reject buyer verification
   */
  static async rejectBuyer(buyerId, adminId, reason = null) {
    const buyer = await User.findById(buyerId);
    if (!buyer) {
      const err = new Error('खरीदार नहीं मिला (Buyer not found)');
      err.statusCode = 404;
      throw err;
    }

    const updated = await User.updateProfile(buyerId, { is_verified: false });

    await AuditLog.create({
      userId: adminId,
      action: 'reject_buyer',
      entityType: 'user',
      entityId: buyerId
    });

    return updated;
  }

  /**
   * Get current platform configuration
   */
  static async getPlatformConfig() {
    const weights = await PlatformConfig.get('buyer_matching_weights');
    return {
      buyer_matching_weights: weights || DEFAULT_MATCHING_WEIGHTS
    };
  }

  /**
   * Update buyer matching weights with strict 100% sum validation
   */
  static async updateMatchingWeights(weights, adminId) {
    if (!weights || typeof weights !== 'object') {
      const err = new Error('अमान्य कॉन्फ़िगरेशन डेटा (Invalid configuration payload)');
      err.statusCode = 400;
      throw err;
    }

    const price = Number(weights.price);
    const distance = Number(weights.distance);
    const qty = Number(weights.quantity_match);
    const quality = Number(weights.quality_match);
    const payment = Number(weights.payment_reliability);
    const delivery = Number(weights.delivery_compatibility);

    // Validate numbers
    const fields = [price, distance, qty, quality, payment, delivery];
    if (fields.some(f => isNaN(f) || f < 0)) {
      const err = new Error('सभी वजन सकारात्मक संख्याएं होने चाहिए (All weights must be non-negative numbers)');
      err.statusCode = 400;
      throw err;
    }

    const sum = Math.round(price + distance + qty + quality + payment + delivery);
    if (sum !== 100) {
      const err = new Error('कुल वजन 100% होना चाहिए (Total weights must sum to 100%)');
      err.statusCode = 400;
      throw err;
    }

    const sanitizedWeights = {
      price,
      distance,
      quantity_match: qty,
      quality_match: quality,
      payment_reliability: payment,
      delivery_compatibility: delivery
    };

    const saved = await PlatformConfig.set(
      'buyer_matching_weights',
      sanitizedWeights,
      'Configurable 6-factor buyer matching algorithm weights',
      adminId
    );

    await AuditLog.create({
      userId: adminId,
      action: 'update_matching_weights',
      entityType: 'platform_config',
      entityId: 'buyer_matching_weights'
    });

    return saved;
  }
}

module.exports = AdminService;
