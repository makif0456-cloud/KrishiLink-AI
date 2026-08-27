const { calculateDistanceKm } = require('../utils/distanceCalc');
const { query, isPgConnected, memoryDb } = require('../config/database');

class LogisticsService {
  /**
   * Get transport rate configuration
   */
  static async getTransportRate() {
    if (isPgConnected()) {
      const res = await query('SELECT * FROM transport_rates WHERE is_active = true LIMIT 1');
      if (res.rows.length > 0) return res.rows[0];
    }
    const defaultRate = (memoryDb.transport_rates && memoryDb.transport_rates[0]) || {
      rate_per_km_per_quintal: 0.35,
      loading_rate_per_quintal: 8.0,
      unloading_rate_per_quintal: 8.0
    };
    return defaultRate;
  }

  /**
   * Calculate deterministic logistics costs and deductions
   */
  static async estimateCosts({
    fromLat,
    fromLng,
    toLat,
    toLng,
    quantity = 100,
    grossRevenue = 0,
    isMandi = false,
    commissionRate = 2.5,
    pickupOffered = false,
    storageDays = 0,
    dailyStorageRate = 0.40
  }) {
    const qty = Number(quantity) || 1;
    const gross = Number(grossRevenue) || 0;
    const rateConfig = await this.getTransportRate();

    const distanceKm = calculateDistanceKm(fromLat, fromLng, toLat, toLng);

    // If buyer offers farm pickup, transport and loading are covered by buyer
    const transportCost = pickupOffered
      ? 0
      : Math.round(distanceKm * Number(rateConfig.rate_per_km_per_quintal || 0.35) * qty);

    const loadingCost = pickupOffered
      ? 0
      : Math.round(Number(rateConfig.loading_rate_per_quintal || 8.0) * qty);

    // Mandi commission (typically 2.0% - 2.5% in APMCs), Direct buyer sales have 0 commission
    const commissionCost = isMandi
      ? Math.round(gross * (Number(commissionRate) / 100))
      : 0;

    // Storage cost (if holding produce)
    const storageCost = storageDays > 0
      ? Math.round(storageDays * Number(dailyStorageRate) * qty)
      : 0;

    const otherCosts = isMandi ? Math.round(qty * 4.0) : 0; // Mandi weighing & gate entry cess (₹4/quintal)

    const totalDeductions = transportCost + loadingCost + commissionCost + storageCost + otherCosts;

    return {
      distance_km: distanceKm,
      transport_cost: transportCost,
      loading_cost: loadingCost,
      commission_cost: commissionCost,
      storage_cost: storageCost,
      other_costs: otherCosts,
      total_deductions: totalDeductions,
      rate_per_km_per_quintal: Number(rateConfig.rate_per_km_per_quintal || 0.35),
      pickup_offered: pickupOffered
    };
  }
}

module.exports = LogisticsService;
