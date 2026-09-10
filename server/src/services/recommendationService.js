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
   * Deterministic recommendation engine comparing:
   * - Mandis
   * - Direct Buyers
   * - Storage Options
   */
  static async getRecommendationsForLot(lotId, userId = null) {
    const lot = await Lot.findById(lotId);

    if (!lot) {
      const err = new Error('फसल विवरण नहीं मिला (Lot not found)');
      err.statusCode = 404;
      throw err;
    }

    const quantity = Number(lot.quantity) || 100;

    // PostgreSQL NUMERIC values can arrive as strings.
    // Always convert coordinates to Number before arithmetic.
    const farmerLat = Number(lot.latitude) || 23.6341;
    const farmerLng = Number(lot.longitude) || 77.4338;

    const commodityId = lot.commodity_id;

    // =========================================================
    // 1. FETCH MANDI PRICES
    // =========================================================

    let prices = [];

    if (isPgConnected()) {
      const sql = `
        SELECT
          mp.*,
          m.name_hi AS mandi_name_hi,
          m.name_en AS mandi_name_en,
          m.district AS mandi_district,
          m.state AS mandi_state,
          m.latitude AS mandi_lat,
          m.longitude AS mandi_lng,
          m.commission_rate
        FROM mandi_prices mp
        JOIN mandis m
          ON mp.mandi_id = m.id
        WHERE mp.commodity_id = $1
        ORDER BY mp.modal_price DESC
      `;

      const res = await query(sql, [commodityId]);
      prices = res.rows;
    } else {
      prices = (memoryDb.mandi_prices || [])
        .filter(p => p.commodity_id === commodityId)
        .map(p => {
          const mandi =
            (memoryDb.mandis || []).find(
              m => m.id === p.mandi_id
            ) || {};

          return {
            ...p,
            mandi_name_hi: mandi.name_hi,
            mandi_name_en: mandi.name_en,
            mandi_district: mandi.district,
            mandi_state: mandi.state,
            mandi_lat: mandi.latitude,
            mandi_lng: mandi.longitude,
            commission_rate:
              mandi.commission_rate || 2.0
          };
        });
    }

    // =========================================================
    // 2. FETCH ACTIVE BUYERS
    // =========================================================

    const buyerRequirements =
      await BuyerRequirement.findAll({
        commodityId,
        status: 'active'
      });

    // Existing offers can be used later for future ranking logic.
    const lotOffers = await Offer.findByLot(lotId);

    // Prevent unused-variable warnings in some environments.
    void userId;
    void lotOffers;

    const evaluatedOptions = [];

    // =========================================================
    // 3. BASE MARKET PRICE
    // =========================================================

    const baseModalPrice =
      prices.length > 0
        ? Number(prices[0].modal_price) || 2500
        : 2500;

    // =========================================================
    // 4. EVALUATE REAL MANDIS
    // =========================================================

    for (const p of prices) {
      const mandiPrice =
        Number(p.modal_price) || 2400;

      const grossRevenue =
        mandiPrice * quantity;

      const mandiLat =
        Number(p.mandi_lat) || farmerLat;

      const mandiLng =
        Number(p.mandi_lng) || farmerLng;

      const logistics =
        await LogisticsService.estimateCosts({
          fromLat: farmerLat,
          fromLng: farmerLng,

          toLat: mandiLat,
          toLng: mandiLng,

          quantity,
          grossRevenue,

          isMandi: true,

          commissionRate:
            Number(p.commission_rate) || 2.0,

          pickupOffered: false
        });

      const netRealization =
        grossRevenue -
        logistics.total_deductions;

      evaluatedOptions.push({
        option_id:
          `mandi_${p.mandi_id}`,

        option_type:
          'mandi',

        title_hi:
          p.mandi_name_hi || 'स्थानीय मंडी',

        title_en:
          p.mandi_name_en || 'Local Mandi',

        subtitle:
          `मंडी नीलामी भाव • ${
            p.mandi_district ||
            p.mandi_state ||
            'स्थानीय क्षेत्र'
          }`,

        price_per_quintal:
          mandiPrice,

        quantity,

        gross_revenue:
          grossRevenue,

        distance_km:
          logistics.distance_km,

        transport_cost:
          logistics.transport_cost,

        loading_cost:
          logistics.loading_cost,

        commission_cost:
          logistics.commission_cost,

        storage_cost: 0,

        other_costs:
          logistics.other_costs,

        total_deductions:
          logistics.total_deductions,

        net_realization:
          netRealization,

        badge_text:
          logistics.distance_km <= 35
            ? 'निकटतम मंडी'
            : 'मंडी विकल्प',

        recommendation_reason:
          `मंडी में भाव ₹${mandiPrice}/क्विंटल है। ` +
          `दूरी ${logistics.distance_km} किमी पर ` +
          `परिवहन ₹${logistics.transport_cost}, ` +
          `लोडिंग ₹${logistics.loading_cost} और ` +
          `मंडी आढ़त ₹${logistics.commission_cost} ` +
          `घटाकर शुद्ध प्राप्ति ` +
          `₹${netRealization.toLocaleString('en-IN')} होगी।`,

        is_direct_buyer:
          false,

        pickup_offered:
          false,

        latitude:
          mandiLat,

        longitude:
          mandiLng
      });
    }

    // =========================================================
    // 5. EVALUATE REAL DIRECT BUYERS
    // =========================================================

    for (const req of buyerRequirements) {
      const buyerPrice =
        Number(req.price_max) || 2450;

      const grossRevenue =
        buyerPrice * quantity;

      const pickupAvailable =
        Boolean(req.pickup_available);

      const buyerLat =
        Number(req.buyer_lat) || farmerLat;

      const buyerLng =
        Number(req.buyer_lng) || farmerLng;

      const logistics =
        await LogisticsService.estimateCosts({
          fromLat: farmerLat,
          fromLng: farmerLng,

          toLat: buyerLat,
          toLng: buyerLng,

          quantity,
          grossRevenue,

          isMandi: false,

          pickupOffered:
            pickupAvailable
        });

      const netRealization =
        grossRevenue -
        logistics.total_deductions;

      evaluatedOptions.push({
        option_id:
          `buyer_req_${req.id}`,

        option_type:
          'direct_buyer',

        title_hi:
          `${req.business_name || req.buyer_name || 'सत्यापित खरीदार'} (सत्यापित खरीदार)`,

        title_en:
          `${req.business_name || req.buyer_name || 'Verified Buyer'} (Verified Buyer)`,

        subtitle:
          pickupAvailable
            ? 'सीधा खेत से उठान • 0% कमीशन'
            : `${req.buyer_district || 'स्थानीय क्षेत्र'} • 0% कमीशन`,

        price_per_quintal:
          buyerPrice,

        quantity,

        gross_revenue:
          grossRevenue,

        distance_km:
          logistics.distance_km,

        transport_cost:
          logistics.transport_cost,

        loading_cost:
          logistics.loading_cost,

        commission_cost: 0,

        storage_cost: 0,

        other_costs: 0,

        total_deductions:
          logistics.total_deductions,

        net_realization:
          netRealization,

        badge_text:
          pickupAvailable
            ? '🚚 खेत से पिकअप + 0% कमीशन'
            : 'सीधा खरीदार',

        recommendation_reason:
          pickupAvailable
            ? `खरीदार द्वारा खेत से निःशुल्क पिकअप दिया जा रहा है। ` +
              `कोई मंडी कमीशन नहीं लगेगा। ` +
              `शुद्ध प्राप्ति ₹${netRealization.toLocaleString('en-IN')} होगी।`
            : `सीधे खरीदार को बेचने पर शून्य मंडी कमीशन से ` +
              `₹${(grossRevenue * 0.025).toLocaleString('en-IN')} ` +
              `तक की बचत हो सकती है।`,

        is_direct_buyer:
          true,

        pickup_offered:
          pickupAvailable,

        buyer_id:
          req.buyer_id,

        latitude:
          buyerLat,

        longitude:
          buyerLng
      });
    }

    // =========================================================
    // 6. DEMO FALLBACK OPTIONS
    //
    // If database has no Mandi or Buyer data for this commodity,
    // create demo options so the farmer can compare:
    //
    // Mandi vs Direct Buyer vs Warehouse
    // =========================================================

    const hasMandiOption =
      evaluatedOptions.some(
        option =>
          option.option_type === 'mandi'
      );

    const hasBuyerOption =
      evaluatedOptions.some(
        option =>
          option.option_type === 'direct_buyer'
      );

    // ---------------------------------------------------------
    // DEMO MANDI
    // ---------------------------------------------------------

    if (!hasMandiOption) {
      const mandiPrice =
        baseModalPrice;

      const mandiGross =
        mandiPrice * quantity;

      const mandiLat =
        farmerLat + 0.12;

      const mandiLng =
        farmerLng + 0.08;

      const mandiLogistics =
        await LogisticsService.estimateCosts({
          fromLat: farmerLat,
          fromLng: farmerLng,

          toLat: mandiLat,
          toLng: mandiLng,

          quantity,

          grossRevenue:
            mandiGross,

          isMandi: true,

          commissionRate: 2.0,

          pickupOffered: false
        });

      const mandiNet =
        mandiGross -
        mandiLogistics.total_deductions;

      evaluatedOptions.push({
        option_id:
          'demo_mandi',

        option_type:
          'mandi',

        title_hi:
          'बैरसिया मंडी',

        title_en:
          'Berasia Mandi',

        subtitle:
          'स्थानीय मंडी • आज का मॉडल भाव',

        price_per_quintal:
          mandiPrice,

        quantity,

        gross_revenue:
          mandiGross,

        distance_km:
          mandiLogistics.distance_km,

        transport_cost:
          mandiLogistics.transport_cost,

        loading_cost:
          mandiLogistics.loading_cost,

        commission_cost:
          mandiLogistics.commission_cost,

        storage_cost: 0,

        other_costs:
          mandiLogistics.other_costs,

        total_deductions:
          mandiLogistics.total_deductions,

        net_realization:
          mandiNet,

        badge_text:
          '🏪 स्थानीय मंडी',

        recommendation_reason:
          `मंडी भाव ₹${mandiPrice}/क्विंटल है। ` +
          `परिवहन ₹${mandiLogistics.transport_cost}, ` +
          `लोडिंग ₹${mandiLogistics.loading_cost} और ` +
          `मंडी आढ़त ₹${mandiLogistics.commission_cost} ` +
          `घटाने के बाद अनुमानित शुद्ध प्राप्ति ` +
          `₹${mandiNet.toLocaleString('en-IN')} होगी।`,

        is_direct_buyer:
          false,

        pickup_offered:
          false,

        latitude:
          mandiLat,

        longitude:
          mandiLng
      });
    }

    // ---------------------------------------------------------
    // DEMO DIRECT BUYER
    // ---------------------------------------------------------

    if (!hasBuyerOption) {
      const buyerPrice =
        baseModalPrice + 100;

      const buyerGross =
        buyerPrice * quantity;

      const buyerLat =
        farmerLat + 0.18;

      const buyerLng =
        farmerLng + 0.10;

      const buyerLogistics =
        await LogisticsService.estimateCosts({
          fromLat: farmerLat,
          fromLng: farmerLng,

          toLat: buyerLat,
          toLng: buyerLng,

          quantity,

          grossRevenue:
            buyerGross,

          isMandi: false,

          pickupOffered: true
        });

      const buyerNet =
        buyerGross -
        buyerLogistics.total_deductions;

      evaluatedOptions.push({
        option_id:
          'demo_direct_buyer',

        option_type:
          'direct_buyer',

        title_hi:
          'शर्मा ट्रेडर्स (सत्यापित खरीदार)',

        title_en:
          'Sharma Traders (Verified Buyer)',

        subtitle:
          'खेत से पिकअप • 0% कमीशन',

        price_per_quintal:
          buyerPrice,

        quantity,

        gross_revenue:
          buyerGross,

        distance_km:
          buyerLogistics.distance_km,

        transport_cost:
          buyerLogistics.transport_cost,

        loading_cost:
          buyerLogistics.loading_cost,

        commission_cost: 0,

        storage_cost: 0,

        other_costs: 0,

        total_deductions:
          buyerLogistics.total_deductions,

        net_realization:
          buyerNet,

        badge_text:
          '🚚 खेत से पिकअप + 0% कमीशन',

        recommendation_reason:
          `सत्यापित खरीदार ₹${buyerPrice}/क्विंटल ` +
          `दे रहा है और खेत से निःशुल्क पिकअप की सुविधा है। ` +
          `मंडी कमीशन नहीं लगेगा। ` +
          `अनुमानित शुद्ध प्राप्ति ` +
          `₹${buyerNet.toLocaleString('en-IN')} होगी।`,

        is_direct_buyer:
          true,

        pickup_offered:
          true,

        buyer_id:
          'demo-buyer-sharma',

        latitude:
          buyerLat,

        longitude:
          buyerLng
      });
    }

    // =========================================================
    // 7. STORAGE + SELL LATER
    // =========================================================

    const projectedFuturePrice =
      Math.round(
        baseModalPrice * 1.075
      );

    const projectedGross =
      projectedFuturePrice * quantity;

    const storageDays = 30;
    const dailyStorageRate = 0.40;

    const warehouseLat =
      farmerLat + 0.05;

    const warehouseLng =
      farmerLng + 0.05;

    const storageLogistics =
      await LogisticsService.estimateCosts({
        fromLat: farmerLat,
        fromLng: farmerLng,

        toLat: warehouseLat,
        toLng: warehouseLng,

        quantity,

        grossRevenue:
          projectedGross,

        isMandi: false,

        storageDays,

        dailyStorageRate,

        pickupOffered: false
      });

    const storageNetRealization =
      projectedGross -
      storageLogistics.total_deductions;

    evaluatedOptions.push({
      option_id:
        'storage_30days',

      option_type:
        'storage_hold',

      title_hi:
        'वेयरहाउस में रखें और 30 दिन बाद बेचें',

      title_en:
        'Store in Warehouse & Sell in 30 Days',

      subtitle:
        `अनुमानित भविष्य भाव: ₹${projectedFuturePrice}/क्विंटल (+7.5%)`,

      price_per_quintal:
        projectedFuturePrice,

      quantity,

      gross_revenue:
        projectedGross,

      distance_km:
        storageLogistics.distance_km,

      transport_cost:
        storageLogistics.transport_cost,

      loading_cost:
        storageLogistics.loading_cost,

      commission_cost: 0,

      storage_cost:
        storageLogistics.storage_cost,

      other_costs: 0,

      total_deductions:
        storageLogistics.total_deductions,

      net_realization:
        storageNetRealization,

      badge_text:
        '📈 मूल्य वृद्धि अनुमान',

      recommendation_reason:
        `30 दिन में भाव ₹${projectedFuturePrice}/क्विंटल तक बढ़ने का अनुमान है। ` +
        `भंडारण शुल्क ₹${storageLogistics.storage_cost} ` +
        `घटाने के बाद अनुमानित शुद्ध प्राप्ति ` +
        `₹${storageNetRealization.toLocaleString('en-IN')} होगी।`,

      is_direct_buyer:
        false,

      pickup_offered:
        false,

      latitude:
        warehouseLat,

      longitude:
        warehouseLng
    });

    // =========================================================
    // 8. SORT OPTIONS BY NET REALIZATION
    // =========================================================

    evaluatedOptions.sort(
      (a, b) =>
        Number(b.net_realization || 0) -
        Number(a.net_realization || 0)
    );

    // =========================================================
    // 9. LOCAL MANDI BENCHMARK
    // =========================================================

    const localMandi =
      evaluatedOptions.find(
        option =>
          option.option_type === 'mandi'
      ) || evaluatedOptions[0];

    const benchmarkNet =
      Number(
        localMandi?.net_realization || 0
      );

    // =========================================================
    // 10. ASSIGN RANKS
    // =========================================================

    evaluatedOptions.forEach(
      (option, index) => {
        option.rank =
          index + 1;

        option.difference_vs_local_mandi =
          Number(option.net_realization || 0) -
          benchmarkNet;

        option.is_top_recommendation =
          index === 0;
      }
    );

    const topRecommendation =
      evaluatedOptions[0];

    // =========================================================
    // 11. DYNAMIC "WHY IS THIS BEST?" REASON
    // =========================================================

    let topRecommendationReason = '';

    if (
      topRecommendation.option_type ===
      'direct_buyer'
    ) {
      if (topRecommendation.pickup_offered) {
        topRecommendationReason =
          'खेत से सीधे पिकअप और 0% मंडी कमीशन के कारण परिवहन व मंडी कटौती की बचत होती है।';
      } else {
        topRecommendationReason =
          'सीधे खरीदार को बेचने पर मंडी कमीशन नहीं लगता और शुद्ध प्राप्ति अधिक हो सकती है।';
      }
    } else if (
      topRecommendation.option_type ===
      'mandi'
    ) {
      topRecommendationReason =
        'उपलब्ध मंडियों में इसकी शुद्ध प्राप्ति सबसे अधिक है और परिवहन तथा मंडी कटौती के बाद भी यह सर्वोत्तम विकल्प है।';
    } else if (
      topRecommendation.option_type ===
      'storage_hold'
    ) {
      topRecommendationReason =
        'अनुमानित भविष्य भाव में 7.5% वृद्धि के कारण 30 दिन बाद बिक्री से बेहतर सकल मूल्य मिल सकता है। भंडारण, परिवहन और लोडिंग खर्च घटाने के बाद भी इसकी शुद्ध प्राप्ति सबसे अधिक है।';
    }

    // Add dynamic reason to top option.
    if (topRecommendation) {
      topRecommendation.top_reason =
        topRecommendationReason;
    }

    // =========================================================
    // 12. RETURN RECOMMENDATION
    // =========================================================

    return {
      lot_id:
        lot.id,

      commodity_id:
        lot.commodity_id,

      commodity_name_hi:
        lot.commodity_name_hi,

      commodity_name_en:
        lot.commodity_name_en,

      commodity_icon:
        lot.commodity_icon,

      quantity,

      unit:
        lot.unit || 'quintal',

      quality_grade:
        lot.quality_grade,

      farmer_location: {
        village:
          lot.farmer_village ||
          'बैरसिया',

        district:
          lot.farmer_district ||
          'भोपाल',

        state:
          lot.farmer_state ||
          'Madhya Pradesh',

        latitude:
          farmerLat,

        longitude:
          farmerLng
      },

      top_recommendation:
        topRecommendation,

      top_recommendation_reason:
        topRecommendationReason,

      all_options:
        evaluatedOptions,

      total_options_evaluated:
        evaluatedOptions.length,

      benchmark_local_mandi: {
        name:
          localMandi?.title_hi ||
          'स्थानीय मंडी',

        net_realization:
          benchmarkNet
      },

      additional_gain_top_option:
        Math.max(
          0,
          Number(
            topRecommendation?.net_realization || 0
          ) -
            benchmarkNet
        ),

      formula:
        'NET_REALIZATION = GROSS_REVENUE - TRANSPORT - LOADING - COMMISSION - STORAGE - OTHER_COSTS',

      is_demo_data:
        true,

      disclaimer:
        DEMO_DISCLAIMER_HI
    };
  }

  // =========================================================
  // MARKET INTELLIGENCE
  // =========================================================

  static async getMarketIntelligence() {
    let marketData = [];

    // =========================================================
    // FETCH MARKET DATA
    // =========================================================

    if (isPgConnected()) {
      const sql = `
        SELECT
          mp.commodity_id,
          mp.modal_price,
          mp.min_price,
          mp.max_price,

          c.name_hi AS commodity_name_hi,
          c.name_en AS commodity_name_en,
          c.icon AS commodity_icon,

          m.id AS mandi_id,
          m.name_hi AS mandi_name_hi,
          m.name_en AS mandi_name_en,
          m.district AS mandi_district,
          m.state AS mandi_state

        FROM mandi_prices mp

        JOIN commodities c
          ON mp.commodity_id = c.id

        JOIN mandis m
          ON mp.mandi_id = m.id

        WHERE mp.modal_price IS NOT NULL

        ORDER BY
          mp.commodity_id,
          mp.modal_price DESC
      `;

      const res =
        await query(sql);

      marketData =
        res.rows;
    } else {
      marketData =
        (memoryDb.mandi_prices || [])
          .map(price => {
            const commodity =
              (memoryDb.commodities || [])
                .find(
                  c =>
                    c.id ===
                    price.commodity_id
                ) || {};

            const mandi =
              (memoryDb.mandis || [])
                .find(
                  m =>
                    m.id ===
                    price.mandi_id
                ) || {};

            return {
              ...price,

              commodity_name_hi:
                commodity.name_hi,

              commodity_name_en:
                commodity.name_en,

              commodity_icon:
                commodity.icon,

              mandi_name_hi:
                mandi.name_hi,

              mandi_name_en:
                mandi.name_en,

              mandi_district:
                mandi.district,

              mandi_state:
                mandi.state
            };
          });
    }

    // =========================================================
    // GROUP BY COMMODITY
    // =========================================================

    const grouped = {};

    for (const row of marketData) {
      const id =
        row.commodity_id;

      if (!grouped[id]) {
        grouped[id] = {
          commodity_id:
            id,

          commodity_name_hi:
            row.commodity_name_hi,

          commodity_name_en:
            row.commodity_name_en,

          commodity_icon:
            row.commodity_icon ||
            '🌾',

          prices: []
        };
      }

      const price =
        Number(row.modal_price);

      if (
        Number.isFinite(price) &&
        price > 0
      ) {
        grouped[id].prices.push({
          modal_price:
            price,

          min_price:
            Number(row.min_price) ||
            price,

          max_price:
            Number(row.max_price) ||
            price,

          mandi_id:
            row.mandi_id,

          mandi_name_hi:
            row.mandi_name_hi,

          mandi_name_en:
            row.mandi_name_en,

          district:
            row.mandi_district,

          state:
            row.mandi_state
        });
      }
    }

    // =========================================================
    // CALCULATE MARKET SCORE
    // =========================================================

    const crops =
      Object.values(grouped)
        .filter(
          crop =>
            crop.prices.length > 0
        )
        .map(crop => {
          const prices =
            crop.prices.map(
              p =>
                p.modal_price
            );

          const averagePrice =
            prices.reduce(
              (sum, price) =>
                sum + price,
              0
            ) /
            prices.length;

          const highestPrice =
            Math.max(...prices);

          const lowestPrice =
            Math.min(...prices);

          const priceSpread =
            highestPrice -
            lowestPrice;

          const spreadPercent =
            averagePrice > 0
              ? (priceSpread /
                  averagePrice) *
                100
              : 0;

          // More mandi coverage = stronger signal
          const mandiCoverageScore =
            Math.min(
              crop.prices.length /
                5,
              1
            ) * 30;

          // Higher average price = stronger opportunity
          const priceStrengthScore =
            Math.min(
              averagePrice /
                5000,
              1
            ) * 50;

          // Smaller spread = more stable
          const stabilityScore =
            Math.max(
              0,
              20 -
                Math.min(
                  spreadPercent,
                  20
                )
            );

          const marketScore =
            Math.round(
              mandiCoverageScore +
                priceStrengthScore +
                stabilityScore
            );

          // Highest paying mandi
          const bestMandi =
            crop.prices.reduce(
              (best, current) =>
                current.modal_price >
                best.modal_price
                  ? current
                  : best
            );

          return {
            commodity_id:
              crop.commodity_id,

            commodity_name_hi:
              crop.commodity_name_hi,

            commodity_name_en:
              crop.commodity_name_en,

            commodity_icon:
              crop.commodity_icon,

            mandi_count:
              crop.prices.length,

            average_price:
              Math.round(
                averagePrice
              ),

            highest_price:
              highestPrice,

            lowest_price:
              lowestPrice,

            price_spread:
              priceSpread,

            spread_percent:
              Number(
                spreadPercent.toFixed(
                  2
                )
              ),

            best_mandi: {
              mandi_id:
                bestMandi.mandi_id,

              name_hi:
                bestMandi.mandi_name_hi,

              name_en:
                bestMandi.mandi_name_en,

              district:
                bestMandi.district,

              state:
                bestMandi.state,

              price:
                bestMandi.modal_price
            },

            market_score:
              marketScore,

            price_analysis:
              highestPrice >
              averagePrice
                ? `₹${highestPrice.toLocaleString('en-IN')} तक का सर्वोच्च मंडी भाव उपलब्ध है।`
                : 'बाजार भाव अपेक्षाकृत स्थिर है।'
          };
        });

    // =========================================================
    // RANK CROPS
    // =========================================================

    crops.sort(
      (a, b) =>
        b.market_score -
        a.market_score
    );

    crops.forEach(
      (crop, index) => {
        crop.rank =
          index + 1;

        crop.is_top_market =
          index === 0;
      }
    );

    // =========================================================
    // RETURN MARKET INTELLIGENCE
    // =========================================================

    return {
      ranked_crops:
        crops,

      total_crops_analyzed:
        crops.length,

      total_market_records_analyzed:
        marketData.length,

      methodology: {
        average_price:
          'Average modal price across available mandis',

        highest_price:
          'Highest modal price',

        lowest_price:
          'Lowest modal price',

        market_score:
          'Weighted score based on price strength, mandi coverage and price stability'
      },

      is_demo_data:
        true,

      disclaimer:
        DEMO_DISCLAIMER_HI
    };
  }
}

module.exports = RecommendationService;
