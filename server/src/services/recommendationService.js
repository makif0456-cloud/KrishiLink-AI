const Lot = require('../models/Lot');
const Mandi = require('../models/Mandi');
const MandiPrice = require('../models/MandiPrice');
const BuyerRequirement = require('../models/BuyerRequirement');
const Offer = require('../models/Offer');
const LogisticsService = require('./logisticsService');
const { DEMO_DISCLAIMER_HI } = require('../config/constants');
const { query, isPgConnected, memoryDb } = require('../config/database');

class RecommendationService {
  /**
   * Deterministic recommendation engine comparing Mandis, Direct Buyers, and Storage Options
   */
  static async getRecommendationsForLot(lotId, userId = null) {
    const lot = await Lot.findById(lotId);
    if (!lot) {
      const err = new Error('फसल विवरण नहीं मिला (Lot not found)');
      err.statusCode = 404;
      throw err;
    }

    const quantity = Number(lot.quantity) || 100;
    const farmerLat = lot.latitude || 23.6341;
    const farmerLng = lot.longitude || 77.4338;
    const commodityId = lot.commodity_id;

    // 1. Fetch Today's Mandi Prices for this commodity
    let prices = [];
    if (isPgConnected()) {
      const sql = `
        SELECT mp.*, m.name_hi AS mandi_name_hi, m.name_en AS mandi_name_en,
               m.district AS mandi_district, m.state AS mandi_state,
               m.latitude AS mandi_lat, m.longitude AS mandi_lng, m.commission_rate
        FROM mandi_prices mp
        JOIN mandis m ON mp.mandi_id = m.id
        WHERE mp.commodity_id = $1
        ORDER BY mp.modal_price DESC
      `;
      const res = await query(sql, [commodityId]);
      prices = res.rows;
    } else {
      prices = (memoryDb.mandi_prices || [])
        .filter(p => p.commodity_id === commodityId)
        .map(p => {
          const mandi = (memoryDb.mandis || []).find(m => m.id === p.mandi_id) || {};
          return {
            ...p,
            mandi_name_hi: mandi.name_hi,
            mandi_name_en: mandi.name_en,
            mandi_district: mandi.district,
            mandi_state: mandi.state,
            mandi_lat: mandi.latitude,
            mandi_lng: mandi.longitude,
            commission_rate: mandi.commission_rate || 2.0
          };
        });
    }

    // 2. Fetch Active Buyer Requirements / Offers for this commodity
    const buyerRequirements = await BuyerRequirement.findAll({
      commodityId,
      status: 'active'
    });

    const lotOffers = await Offer.findByLot(lotId);

    const evaluatedOptions = [];

    // --- EVALUATE MANDIS ---
    for (const p of prices) {
      const mandiPrice = Number(p.modal_price) || 2400;
      const grossRevenue = mandiPrice * quantity;

      const logistics = await LogisticsService.estimateCosts({
        fromLat: farmerLat,
        fromLng: farmerLng,
        toLat: p.mandi_lat,
        toLng: p.mandi_lng,
        quantity,
        grossRevenue,
        isMandi: true,
        commissionRate: p.commission_rate || 2.0,
        pickupOffered: false
      });

      const netRealization = grossRevenue - logistics.total_deductions;

      evaluatedOptions.push({
        option_id: `mandi_${p.mandi_id}`,
        option_type: 'mandi',
        title_hi: `${p.mandi_name_hi}`,
        title_en: `${p.mandi_name_en}`,
        subtitle: `मंडी नीलामी भाव • ${p.mandi_district || p.mandi_state}`,
        price_per_quintal: mandiPrice,
        quantity,
        gross_revenue: grossRevenue,
        distance_km: logistics.distance_km,
        transport_cost: logistics.transport_cost,
        loading_cost: logistics.loading_cost,
        commission_cost: logistics.commission_cost,
        storage_cost: 0,
        other_costs: logistics.other_costs,
        total_deductions: logistics.total_deductions,
        net_realization: netRealization,
        badge_text: logistics.distance_km <= 35 ? 'निकटतम मंडी' : 'मंडी विकल्प',
        recommendation_reason: `मंडी में भाव ₹${mandiPrice}/क्विंटल है। दूरी ${logistics.distance_km} किमी पर परिवहन ₹${logistics.transport_cost} और मंडी आढ़त ₹${logistics.commission_cost} काटकर शुद्ध प्राप्ति ₹${netRealization.toLocaleString('en-IN')} होगी।`,
        is_direct_buyer: false,
        pickup_offered: false,
        latitude: p.mandi_lat,
        longitude: p.mandi_lng
      });
    }

    // --- EVALUATE DIRECT BUYERS ---
    for (const req of buyerRequirements) {
      const buyerPrice = Number(req.price_max) || 2450;
      const grossRevenue = buyerPrice * quantity;
      const pickupAvailable = Boolean(req.pickup_available);

      const logistics = await LogisticsService.estimateCosts({
        fromLat: farmerLat,
        fromLng: farmerLng,
        toLat: req.buyer_lat,
        toLng: req.buyer_lng,
        quantity,
        grossRevenue,
        isMandi: false,
        pickupOffered: pickupAvailable
      });

      const netRealization = grossRevenue - logistics.total_deductions;

      evaluatedOptions.push({
        option_id: `buyer_req_${req.id}`,
        option_type: 'direct_buyer',
        title_hi: `${req.business_name || req.buyer_name} (सत्यापित खरीदार)`,
        title_en: `${req.business_name || req.buyer_name} (Verified Buyer)`,
        subtitle: pickupAvailable ? 'सीधा खेत से उठान • 0% कमीशन' : `${req.buyer_district || 'इंदौर'} • 0% कमीशन`,
        price_per_quintal: buyerPrice,
        quantity,
        gross_revenue: grossRevenue,
        distance_km: logistics.distance_km,
        transport_cost: logistics.transport_cost,
        loading_cost: logistics.loading_cost,
        commission_cost: 0, // Zero APMC commission on direct trade
        storage_cost: 0,
        other_costs: 0,
        total_deductions: logistics.total_deductions,
        net_realization: netRealization,
        badge_text: pickupAvailable ? '🚚 खेत से पिकअप + 0% कमीशन' : 'सीधा खरीदार',
        recommendation_reason: pickupAvailable
          ? `खरीदार द्वारा खेत से निःशुल्क पिकअप दिया जा रहा है। कोई मंडी कमीशन नहीं लगेगा। शुद्ध प्राप्ति ₹${netRealization.toLocaleString('en-IN')} पूरी प्राप्त होगी।`
          : `सीधे खरीदार को बेचने पर शून्य मंडी कमीशन से ₹${(grossRevenue * 0.025).toLocaleString('en-IN')} की बचत होगी।`,
        is_direct_buyer: true,
        pickup_offered: pickupAvailable,
        buyer_id: req.buyer_id,
        latitude: req.buyer_lat,
        longitude: req.buyer_lng
      });
    }

    // --- EVALUATE STORAGE + SELL LATER OPTION (FUTURE PROJECTION) ---
    // If commodity has positive seasonal outlook (e.g. Wheat projected +8% over 30 days)
    const baseModalPrice = prices[0] ? Number(prices[0].modal_price) : 2500;
    const projectedFuturePrice = Math.round(baseModalPrice * 1.075); // ~7.5% expected seasonal rise in 30 days
    const projectedGross = projectedFuturePrice * quantity;
    const storageDays = 30;
    const dailyStorageRate = 0.40; // ₹0.40 per quintal per day in local warehouse

    const storageLogistics = await LogisticsService.estimateCosts({
      fromLat: farmerLat,
      fromLng: farmerLng,
      toLat: farmerLat + 0.05,
      toLng: farmerLng + 0.05,
      quantity,
      grossRevenue: projectedGross,
      isMandi: false,
      storageDays,
      dailyStorageRate,
      pickupOffered: false
    });

    const storageNetRealization = projectedGross - storageLogistics.total_deductions;

    evaluatedOptions.push({
      option_id: 'storage_30days',
      option_type: 'storage_hold',
      title_hi: 'वेयरहाउस में रखें और 30 दिन बाद बेचें',
      title_en: 'Store in Warehouse & Sell in 30 Days',
      subtitle: `अनुमानित भविष्य भाव: ₹${projectedFuturePrice}/क्विंटल (+7.5%)`,
      price_per_quintal: projectedFuturePrice,
      quantity,
      gross_revenue: projectedGross,
      distance_km: storageLogistics.distance_km,
      transport_cost: storageLogistics.transport_cost,
      loading_cost: storageLogistics.loading_cost,
      commission_cost: 0,
      storage_cost: storageLogistics.storage_cost,
      other_costs: 0,
      total_deductions: storageLogistics.total_deductions,
      net_realization: storageNetRealization,
      badge_text: '📈 मूल्य वृद्धि अनुमान',
      recommendation_reason: `30 दिन में भाव ₹${projectedFuturePrice}/क्विंटल तक बढ़ने का अनुमान है। भंडारण शुल्क (₹${storageLogistics.storage_cost}) घटाने के बाद भी अतिरिक्त लाभ मिलने की संभावना है।`,
      is_direct_buyer: false,
      pickup_offered: false,
      latitude: farmerLat + 0.05,
      longitude: farmerLng + 0.05
    });

    // 3. Deterministic Sorting & Ranking (Highest Net Realization First)
    evaluatedOptions.sort((a, b) => b.net_realization - a.net_realization);

    // Find closest local mandi for benchmark baseline
    const localMandi = evaluatedOptions.find(o => o.option_type === 'mandi') || evaluatedOptions[0];
    const benchmarkNet = localMandi.net_realization;

    evaluatedOptions.forEach((opt, idx) => {
      opt.rank = idx + 1;
      opt.difference_vs_local_mandi = opt.net_realization - benchmarkNet;
      opt.is_top_recommendation = idx === 0;
    });

    const topRecommendation = evaluatedOptions[0];

    return {
      lot_id: lot.id,
      commodity_id: lot.commodity_id,
      commodity_name_hi: lot.commodity_name_hi,
      commodity_name_en: lot.commodity_name_en,
      commodity_icon: lot.commodity_icon,
      quantity,
      unit: lot.unit || 'quintal',
      quality_grade: lot.quality_grade,
      farmer_location: {
        village: lot.farmer_village || 'बैरसिया',
        district: lot.farmer_district || 'भोपाल',
        state: lot.farmer_state || 'Madhya Pradesh',
        latitude: farmerLat,
        longitude: farmerLng
      },
      top_recommendation: topRecommendation,
      all_options: evaluatedOptions,
      total_options_evaluated: evaluatedOptions.length,
      benchmark_local_mandi: {
        name: localMandi.title_hi,
        net_realization: localMandi.net_realization
      },
      additional_gain_top_option: Math.max(0, topRecommendation.net_realization - benchmarkNet),
      formula: "NET_REALIZATION = GROSS_REVENUE - TRANSPORT - LOADING - COMMISSION - STORAGE - OTHER_COSTS",
      is_demo_data: true,
      disclaimer: DEMO_DISCLAIMER_HI
    };
  }
}

module.exports = RecommendationService;
