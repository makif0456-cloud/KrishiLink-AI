import axios from 'axios';
import { API_BASE_URL } from '../config/api';

export const TradingService = {
  // Lots
  async createLot(lotData) {
    const res = await axios.post(`${API_BASE_URL}/lots`, lotData);
    return res.data.data.lot;
  },

  async getMyLots() {
    const res = await axios.get(`${API_BASE_URL}/lots/my`);
    return res.data.data.lots || [];
  },

  async getLotDetail(id) {
    const res = await axios.get(`${API_BASE_URL}/lots/${id}`);
    return res.data.data.lot;
  },

  async getAllActiveLots(commodityId = null) {
    const res = await axios.get(`${API_BASE_URL}/lots`, {
      params: commodityId ? { commodity_id: commodityId } : {}
    });
    return res.data.data.lots || [];
  },

  async getMatchingBuyers(lotId) {
    const res = await axios.get(`${API_BASE_URL}/lots/${lotId}/matching-buyers`);
    return res.data.data.matching_buyers || [];
  },

  async deleteLot(id) {
    const res = await axios.delete(`${API_BASE_URL}/lots/${id}`);
    return res.data.data.lot;
  },

  // Buyer Requirements
  async createRequirement(reqData) {
    const res = await axios.post(`${API_BASE_URL}/buyers/requirements`, reqData);
    return res.data.data.requirement;
  },

  async getMyRequirements() {
    const res = await axios.get(`${API_BASE_URL}/buyers/requirements/my`);
    return res.data.data.requirements || [];
  },

  async deleteRequirement(id) {
    const res = await axios.delete(`${API_BASE_URL}/buyers/requirements/${id}`);
    return res.data.data.requirement;
  },

  // Offers
  async createOffer(offerData) {
    const res = await axios.post(`${API_BASE_URL}/offers`, offerData);
    return res.data.data.offer;
  },

  async getOffersForLot(lotId) {
    const res = await axios.get(`${API_BASE_URL}/offers/lot/${lotId}`);
    return res.data.data.offers || [];
  },

  async getMyOffers() {
    const res = await axios.get(`${API_BASE_URL}/offers/my`);
    return res.data.data.offers || [];
  },

  async acceptOffer(offerId) {
    const res = await axios.put(`${API_BASE_URL}/offers/${offerId}/accept`);
    return res.data.data;
  },

  async rejectOffer(offerId) {
    const res = await axios.put(`${API_BASE_URL}/offers/${offerId}/reject`);
    return res.data.data.offer;
  },

  async counterOffer(offerId, counterPrice) {
    const res = await axios.put(`${API_BASE_URL}/offers/${offerId}/counter`, {
      counter_price: Number(counterPrice)
    });
    return res.data.data.offer;
  },

  // Orders
  async getOrders() {
    const res = await axios.get(`${API_BASE_URL}/orders`);
    return res.data.data.orders || [];
  },

  async getOrderDetail(id) {
    const res = await axios.get(`${API_BASE_URL}/orders/${id}`);
    return res.data.data.order;
  },

  async updateOrderStatus(id, status) {
    const res = await axios.put(`${API_BASE_URL}/orders/${id}/status`, { status });
    return res.data.data.order;
  },

  // Payments
  async recordPayment(paymentData) {
    const res = await axios.post(`${API_BASE_URL}/payments`, paymentData);
    return res.data.data.payment;
  },

  async getOrderPayments(orderId) {
    const res = await axios.get(`${API_BASE_URL}/payments/order/${orderId}`);
    return res.data.data.payments || [];
  },

  async getMyPayments() {
    const res = await axios.get(`${API_BASE_URL}/payments/my`);
    return res.data.data.payments || [];
  }
};
