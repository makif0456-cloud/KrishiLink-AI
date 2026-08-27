export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api/v1';
export const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000/api/v1';

export const ENDPOINTS = {
  // Auth
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  SEND_OTP: '/auth/send-otp',
  VERIFY_OTP: '/auth/verify-otp',
  ME: '/auth/me',
  PROFILE: '/auth/profile',

  // Market
  COMMODITIES: '/market/commodities',
  MANDIS: '/market/mandis',
  PRICES: '/market/prices',
  PRICE_TRENDS: '/market/prices/trends',
  PRICE_COMPARE: '/market/prices/compare',

  // Admin
  ADMIN_USERS: '/admin/users',
  ADMIN_CONFIG: '/admin/config',
  ADMIN_AUDIT: '/admin/audit-logs'
};
