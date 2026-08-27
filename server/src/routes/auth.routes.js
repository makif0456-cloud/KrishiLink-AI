const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const AuthService = require('../services/authService');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { successResponse, errorResponse } = require('../utils/responseHelper');
const User = require('../models/User');

// POST /api/v1/auth/register
router.post(
  '/register',
  [
    body('phone').trim().isLength({ min: 10, max: 15 }).withMessage('मान्य फोन नंबर दर्ज करें (Enter valid 10-digit phone)'),
    body('name').trim().notEmpty().withMessage('नाम दर्ज करना आवश्यक है (Name is required)'),
    body('password').isLength({ min: 6 }).withMessage('पासवर्ड कम से कम 6 अक्षरों का होना चाहिए (Password min 6 chars)'),
    body('role').optional().isIn(['farmer', 'buyer', 'fpo', 'admin']).withMessage('अमान्य भूमिका (Invalid role)'),
    validate
  ],
  async (req, res, next) => {
    try {
      const result = await AuthService.register(req.body);
      return successResponse(res, result, 'पंजीकरण सफल रहा (Registration successful)', 201);
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/auth/login
router.post(
  '/login',
  [
    body('phone').trim().notEmpty().withMessage('फोन नंबर आवश्यक है (Phone is required)'),
    body('password').notEmpty().withMessage('पासवर्ड आवश्यक है (Password is required)'),
    validate
  ],
  async (req, res, next) => {
    try {
      const { phone, password } = req.body;
      const result = await AuthService.login(phone, password);
      return successResponse(res, result, 'लॉगिन सफल रहा (Login successful)');
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/auth/send-otp
router.post(
  '/send-otp',
  [
    body('phone').trim().isLength({ min: 10, max: 15 }).withMessage('मान्य फोन नंबर दर्ज करें (Enter valid 10-digit phone)'),
    validate
  ],
  async (req, res, next) => {
    try {
      const result = await AuthService.sendOtp(req.body.phone);
      return successResponse(res, result, 'ओटीपी भेजा गया (OTP sent successfully)');
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/v1/auth/verify-otp
router.post(
  '/verify-otp',
  [
    body('phone').trim().notEmpty().withMessage('फोन नंबर आवश्यक है (Phone is required)'),
    body('otp').trim().notEmpty().withMessage('ओटीपी आवश्यक है (OTP is required)'),
    validate
  ],
  async (req, res, next) => {
    try {
      const { phone, otp } = req.body;
      const result = await AuthService.verifyOtp(phone, otp);
      return successResponse(res, result, 'ओटीपी सत्यापन सफल (OTP verification successful)');
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/v1/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  const { password_hash, ...safeUser } = req.user;
  return successResponse(res, { user: safeUser }, 'उपयोगकर्ता प्रोफ़ाइल (User profile)');
});

// PUT /api/v1/auth/profile
router.put('/profile', authMiddleware, async (req, res, next) => {
  try {
    const updated = await User.updateProfile(req.user.id, req.body);
    return successResponse(res, { user: updated }, 'प्रोफ़ाइल अपडेट हो गई (Profile updated)');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
