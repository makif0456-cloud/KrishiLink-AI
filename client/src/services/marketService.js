import axios from 'axios';
import { API_BASE_URL, ENDPOINTS } from '../config/api';

export const MarketService = {
  async getCommodities() {
    const res = await axios.get(`${API_BASE_URL}${ENDPOINTS.COMMODITIES}`);
    return res.data.data.commodities || [];
  },

  async getMandis(state = null) {
    const res = await axios.get(`${API_BASE_URL}${ENDPOINTS.MANDIS}`, {
      params: state ? { state } : {}
    });
    return res.data.data.mandis || [];
  },

  async getPrices(commodityId = null, mandiId = null) {
    const res = await axios.get(`${API_BASE_URL}${ENDPOINTS.PRICES}`, {
      params: {
        commodity_id: commodityId || undefined,
        mandi_id: mandiId || undefined
      }
    });
    return res.data.data.prices || [];
  },

  async getPriceTrends(commodityId, mandiId = null, days = 30) {
    const res = await axios.get(`${API_BASE_URL}${ENDPOINTS.PRICE_TRENDS}`, {
      params: {
        commodity_id: commodityId,
        mandi_id: mandiId || undefined,
        days
      }
    });
    return res.data.data.trends || [];
  },

  async comparePrices(commodityId) {
    const res = await axios.get(`${API_BASE_URL}${ENDPOINTS.PRICE_COMPARE}`, {
      params: { commodity_id: commodityId }
    });
    return res.data.data || {};
  }
};
