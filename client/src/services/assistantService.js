import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const getHeaders = () => {
  const token = localStorage.getItem('krishi_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const AssistantService = {
  /**
   * Send a recorded audio Blob to POST /api/v1/voice/ask
   * @param {Blob} audioBlob 
   * @param {object} context 
   * @returns {Promise<object>}
   */
  async uploadAudio(audioBlob, context = {}) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'voice.webm');
    if (context && Object.keys(context).length > 0) {
      formData.append('context', JSON.stringify(context));
    }

    const headers = {
      ...getHeaders(),
      'Content-Type': 'multipart/form-data'
    };

    const res = await axios.post(`${API_BASE_URL}/voice/ask`, formData, { 
      headers, 
      timeout: 35000 
    });
    return res.data?.data || res.data;
  },

  /**
   * Send a text query to the assistant
   * @param {string} text 
   * @param {object} context
   * @returns {Promise<object>}
   */
  async query(text, context = {}) {
    const headers = getHeaders();
    const res = await axios.post(`${API_BASE_URL}/assistant/query`, { text, context }, { 
      headers: { ...headers, 'Content-Type': 'application/json' },
      timeout: 35000 
    });
    return res.data?.data || res.data;
  }
};
