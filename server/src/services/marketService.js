const Commodity = require('../models/Commodity');
const Mandi = require('../models/Mandi');
const MandiPrice = require('../models/MandiPrice');

class MarketService {
  static async getCommodities() {
    return Commodity.findAll();
  }

  static async getMandis(filters) {
    return Mandi.findAll(filters);
  }

  static async getPrices(filters) {
    return MandiPrice.findLatestPrices(filters);
  }

  static async getPriceTrends(commodityId, mandiId, days = 30) {
    return MandiPrice.getTrends(commodityId, mandiId, Number(days));
  }

  static async compareMandiPrices(commodityId) {
    const prices = await MandiPrice.findLatestPrices({ commodityId });
    if (!prices || prices.length === 0) {
      return { commodity: null, highest: null, lowest: null, comparison: [] };
    }

    const sorted = [...prices].sort((a, b) => b.modal_price - a.modal_price);
    const highest = sorted[0];
    const lowest = sorted[sorted.length - 1];
    const diff = highest.modal_price - lowest.modal_price;

    return {
      commodity_id: commodityId,
      commodity_name_hi: highest.commodity_name_hi,
      commodity_name_en: highest.commodity_name_en,
      commodity_icon: highest.commodity_icon,
      highest_mandi: {
        name: highest.mandi_name_hi,
        price: highest.modal_price,
        state: highest.mandi_state
      },
      lowest_mandi: {
        name: lowest.mandi_name_hi,
        price: lowest.modal_price,
        state: lowest.mandi_state
      },
      price_gap_per_quintal: diff,
      comparison: sorted
    };
  }
}

module.exports = MarketService;
