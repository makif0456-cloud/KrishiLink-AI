const BuyerRequirement = require('../models/BuyerRequirement');
const PlatformConfig = require('../models/PlatformConfig');
const User = require('../models/User');
const { calculateDistanceKm } = require('../utils/distanceCalc');
const { DEFAULT_WEIGHTS } = require('../config/constants');

class BuyerMatchingService {
  /**
   * Deterministic matching algorithm for a farmer lot
   */
  static async matchBuyersForLot(lot) {
    if (!lot) return [];

    // 1. Fetch configurable weights from platform_config or fallback to default
    const configWeights = await PlatformConfig.get('buyer_matching_weights');
    const weights = configWeights || DEFAULT_WEIGHTS;

    // 2. Fetch all active buyer requirements for this commodity
    const requirements = await BuyerRequirement.findAll({
      commodityId: lot.commodity_id,
      status: 'active'
    });

    if (!requirements || requirements.length === 0) {
      return [];
    }

    const maxPriceSeen = Math.max(...requirements.map(r => Number(r.price_max)), Number(lot.expected_price || 2500));
    const minPriceSeen = Math.min(...requirements.map(r => Number(r.price_max)), 2000);

    const scoredMatches = requirements.map(req => {
      // Distance calculation
      const distanceKm = calculateDistanceKm(
        lot.latitude,
        lot.longitude,
        req.buyer_lat,
        req.buyer_lng
      );

      // Factor 1: Price Score (40%)
      const priceVal = Number(req.price_max);
      const priceScore = maxPriceSeen === minPriceSeen
        ? 0.9
        : Math.min(1, Math.max(0, (priceVal - minPriceSeen) / (maxPriceSeen - minPriceSeen || 1)));

      // Factor 2: Distance Score (20%) - Closer is better
      const distanceScore = Math.max(0, 1 - (distanceKm / 250));

      // Factor 3: Quantity Match (15%)
      let quantityScore = 0.8;
      const lotQty = Number(lot.quantity);
      if (req.quantity_min && req.quantity_max) {
        if (lotQty >= req.quantity_min && lotQty <= req.quantity_max) {
          quantityScore = 1.0;
        } else if (lotQty < req.quantity_min) {
          quantityScore = Math.max(0.3, lotQty / req.quantity_min);
        } else {
          quantityScore = Math.max(0.5, req.quantity_max / lotQty);
        }
      }

      // Factor 4: Quality Match (10%)
      let qualityScore = 0.7;
      if (req.quality_grade === 'any' || req.quality_grade === lot.quality_grade) {
        qualityScore = 1.0;
      } else if (lot.quality_grade === 'A' && req.quality_grade === 'B') {
        qualityScore = 0.9;
      } else if (lot.quality_grade === 'B' && req.quality_grade === 'A') {
        qualityScore = 0.5;
      }

      // Factor 5: Payment Reliability (10%)
      const paymentScore = req.buyer_verified ? 0.95 : 0.75;

      // Factor 6: Delivery Compatibility (5%)
      const deliveryScore = req.pickup_available ? 1.0 : (distanceKm <= (req.delivery_radius_km || 100) ? 0.8 : 0.4);

      // Weighted Total Score (0 - 100)
      const totalScore = (
        weights.price * priceScore +
        weights.distance * distanceScore +
        weights.quantity_match * quantityScore +
        weights.quality_match * qualityScore +
        weights.payment_reliability * paymentScore +
        weights.delivery_compatibility * deliveryScore
      ) * 100;

      return {
        buyer_id: req.buyer_id,
        requirement_id: req.id,
        buyer_name: req.buyer_name,
        business_name: req.business_name || req.buyer_name,
        buyer_type: req.buyer_type || 'trader',
        is_verified: req.buyer_verified || true,
        offered_price: Number(req.price_max),
        distance_km: distanceKm,
        pickup_available: req.pickup_available,
        payment_reliability_pct: Math.round(paymentScore * 100),
        quality_grade_required: req.quality_grade,
        quantity_max: req.quantity_max,
        match_score: Math.round(totalScore),
        score_breakdown: {
          price: Math.round(priceScore * weights.price * 100),
          distance: Math.round(distanceScore * weights.distance * 100),
          quantity: Math.round(quantityScore * weights.quantity_match * 100),
          quality: Math.round(qualityScore * weights.quality_match * 100),
          payment: Math.round(paymentScore * weights.payment_reliability * 100),
          delivery: Math.round(deliveryScore * weights.delivery_compatibility * 100)
        }
      };
    });

    // Sort descending by match score
    return scoredMatches.sort((a, b) => b.match_score - a.match_score);
  }
}

module.exports = BuyerMatchingService;
