import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export const IntelligenceService = {
  // Get full selling recommendations and Net Realization analysis for a farmer lot
  async getSellingRecommendations(lotId) {
    const res = await axios.get(`${API_BASE_URL}/recommendations/lot/${lotId}`);
    return res.data.data;
  },

  // Get options comparison for a lot
  async getRecommendationOptions(lotId) {
    const res = await axios.get(`${API_BASE_URL}/recommendations/lot/${lotId}/options`);
    return res.data.data;
  },

  // Get price forecast for a commodity
  async getPriceForecast(commodityId, horizonDays = 15) {
    const res = await axios.get(`${API_BASE_URL}/forecast/prices`, {
      params: { commodity_id: commodityId, horizon_days: horizonDays }
    });
    return res.data.data;
  },

  // Match buyers for custom criteria
  async matchBuyers(params) {
    const res = await axios.post(`${API_BASE_URL}/recommendations/buyers`, params);
    return res.data.data;
  }
};
