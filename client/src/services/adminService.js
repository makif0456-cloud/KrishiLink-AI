import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const getHeaders = () => {
  const token = localStorage.getItem('krishi_token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const AdminService = {
  async getAnalytics() {
    const res = await axios.get(`${API_BASE_URL}/admin/analytics`, getHeaders());
    return res.data?.data || null;
  },

  async getPendingBuyers() {
    const res = await axios.get(`${API_BASE_URL}/admin/buyers/pending`, getHeaders());
    return res.data?.data?.buyers || [];
  },

  async verifyBuyer(buyerId) {
    const res = await axios.put(`${API_BASE_URL}/admin/buyers/${buyerId}/verify`, {}, getHeaders());
    return res.data?.data?.buyer || null;
  },

  async rejectBuyer(buyerId, reason) {
    const res = await axios.put(`${API_BASE_URL}/admin/buyers/${buyerId}/reject`, { reason }, getHeaders());
    return res.data?.data?.buyer || null;
  },

  async getConfig() {
    const res = await axios.get(`${API_BASE_URL}/admin/config`, getHeaders());
    return res.data?.data?.buyer_matching_weights || null;
  },

  async updateConfig(weights) {
    const res = await axios.put(`${API_BASE_URL}/admin/config`, { buyer_matching_weights: weights }, getHeaders());
    return res.data?.data?.config || null;
  },

  async getUsers(role = null) {
    const config = getHeaders();
    if (role) config.params = { role };
    const res = await axios.get(`${API_BASE_URL}/admin/users`, config);
    return res.data?.data?.users || [];
  },

  async getAuditLogs(limit = 50) {
    const config = getHeaders();
    config.params = { limit };
    const res = await axios.get(`${API_BASE_URL}/admin/audit-logs`, config);
    return res.data?.data?.logs || [];
  }
};
