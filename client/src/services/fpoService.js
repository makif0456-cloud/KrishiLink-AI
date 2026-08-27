import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const getHeaders = () => {
  const token = localStorage.getItem('krishi_token');
  return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
};

export const FpoService = {
  async getDashboard() {
    const res = await axios.get(`${API_BASE_URL}/fpo/dashboard`, getHeaders());
    return res.data?.data || null;
  },

  async getMembers() {
    const res = await axios.get(`${API_BASE_URL}/fpo/members`, getHeaders());
    return res.data?.data?.members || [];
  }
};
