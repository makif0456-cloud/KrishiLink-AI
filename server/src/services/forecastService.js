const env = require('../config/env');
const { DEMO_DISCLAIMER_HI } = require('../config/constants');
const { memoryDb } = require('../config/database');

class ForecastService {
  /**
   * Get price forecast for a commodity with resilient fallback
   */
  static async getForecast(commodityId, horizonDays = 15) {
    const horizon = Math.min(90, Math.max(1, Number(horizonDays) || 15));
    const aiServiceUrl = env.AI_SERVICE_URL || 'http://localhost:8000';

    // 1. Find commodity details
    const comm = (memoryDb.commodities || []).find(c => c.id === commodityId) || {
      id: commodityId,
      name_hi: 'गेहूं',
      name_en: 'Wheat'
    };

    // 2. Fetch baseline modal price from mandi prices
    const relevantPrices = (memoryDb.mandi_prices || []).filter(p => p.commodity_id === commodityId);
    const basePrice = relevantPrices.length > 0 ? Number(relevantPrices[0].modal_price) : 2550;

    // 3. Attempt FastAPI service request
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const response = await fetch(`${aiServiceUrl}/api/v1/forecast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          commodity_id: commodityId,
          commodity_name: comm.name_en,
          horizon_days: horizon
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (err) {
      // FastAPI service offline or timed out; execute deterministic Express fallback
    }

    // 4. Deterministic fallback calculation
    const forecastPoints = [];
    const now = new Date();
    const slope = basePrice * 0.0025; // mild positive drift for demo seasonality

    for (let day = 1; day <= horizon; day++) {
      const targetDate = new Date(now.getTime() + day * 86400000).toISOString().split('T')[0];
      const seasonal = Math.sin(day / 3.5) * (basePrice * 0.005);
      const predictedModal = Math.round((basePrice + (slope * day) + seasonal) * 10) / 10;
      const uncertainty = Math.round(((basePrice * 0.015) + (day * 3.5)) * 10) / 10;

      forecastPoints.push({
        date: targetDate,
        day_offset: day,
        predicted_modal_price: predictedModal,
        min_estimate: Math.round((predictedModal - uncertainty) * 10) / 10,
        max_estimate: Math.round((predictedModal + uncertainty) * 10) / 10,
        confidence_pct: Math.max(60, Math.round(95 - (day * 0.45)))
      });
    }

    const endPrice = forecastPoints[forecastPoints.length - 1].predicted_modal_price;
    const changePct = Math.round(((endPrice - basePrice) / basePrice) * 10000) / 100;

    return {
      commodity_id: commodityId,
      commodity_name: comm.name_en,
      commodity_name_hi: comm.name_hi,
      current_modal_price: basePrice,
      forecast_horizon_days: horizon,
      projected_end_price: endPrice,
      trend_direction: changePct > 1.0 ? 'rising' : (changePct < -1.0 ? 'falling' : 'stable'),
      trend_label_hi: changePct > 1.0 ? 'बढ़त का रुझान (Rising)' : (changePct < -1.0 ? 'गिरावट का रुझान (Falling)' : 'स्थिर (Stable)'),
      change_pct: changePct,
      model: 'Agri-Trend-Fallback-v1',
      forecast: forecastPoints,
      is_demo_data: true,
      disclaimer: DEMO_DISCLAIMER_HI
    };
  }
}

module.exports = ForecastService;
