import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL, ENDPOINTS } from '../config/api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('krishi_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => {
    return localStorage.getItem('krishi_token') || null;
  });
  const [loading, setLoading] = useState(true);

  // Set default axios authorization header whenever token changes
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('krishi_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('krishi_token');
    }
  }, [token]);

  useEffect(() => {
    if (user) {
      localStorage.setItem('krishi_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('krishi_user');
    }
    setLoading(false);
  }, [user]);

  const login = async (phone, password) => {
    const res = await axios.post(`${API_BASE_URL}${ENDPOINTS.LOGIN}`, { phone, password });
    if (res.data.success) {
      const { user: loggedInUser, token: authToken } = res.data.data;
      setUser(loggedInUser);
      setToken(authToken);
      return loggedInUser;
    }
    throw new Error(res.data.message);
  };

  const verifyOtp = async (phone, otp) => {
    const res = await axios.post(`${API_BASE_URL}${ENDPOINTS.VERIFY_OTP}`, { phone, otp });
    if (res.data.success) {
      const { user: loggedInUser, token: authToken } = res.data.data;
      setUser(loggedInUser);
      setToken(authToken);
      return loggedInUser;
    }
    throw new Error(res.data.message);
  };

  const register = async (userData) => {
    const res = await axios.post(`${API_BASE_URL}${ENDPOINTS.REGISTER}`, userData);
    if (res.data.success) {
      const { user: registeredUser, token: authToken } = res.data.data;
      setUser(registeredUser);
      setToken(authToken);
      return registeredUser;
    }
    throw new Error(res.data.message);
  };

  // Quick switch for SIH presentation evaluators
  const demoLoginAs = async (role) => {
    const rolePhoneMap = {
      farmer: '9876543210',
      buyer: '9876543211',
      fpo: '9876543212',
      admin: '9876543200'
    };
    const phone = rolePhoneMap[role] || '9876543210';
    return login(phone, 'Password@123');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('krishi_user');
    localStorage.removeItem('krishi_token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, verifyOtp, register, logout, demoLoginAs, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
