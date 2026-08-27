const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { successResponse } = require('../utils/responseHelper');
const AdminService = require('../services/adminService');
const User = require('../models/User');
const AuditLog = require('../models/AuditLog');

// Require Admin role for all routes in this file
router.use(authMiddleware, rbac('admin'));

// -------------------------------------------------------------
// 1. Platform Analytics
// -------------------------------------------------------------
router.get('/analytics', async (req, res, next) => {
  try {
    const analytics = await AdminService.getAnalytics();
    return successResponse(res, analytics, 'एडमिन एनालिटिक्स (Admin analytics fetched)');
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// 2. Buyer Verification Queue
// -------------------------------------------------------------
router.get('/buyers/pending', async (req, res, next) => {
  try {
    const pendingBuyers = await AdminService.getPendingBuyers();
    return successResponse(res, { buyers: pendingBuyers }, 'लंबित खरीदार सत्यापन सूची (Pending buyers fetched)');
  } catch (err) {
    next(err);
  }
});

router.put('/buyers/:id/verify', async (req, res, next) => {
  try {
    const verifiedBuyer = await AdminService.verifyBuyer(req.params.id, req.user.id);
    return successResponse(res, { buyer: verifiedBuyer }, 'खरीदार सफलतापूर्वक सत्यापित हुआ (Buyer verified successfully)');
  } catch (err) {
    next(err);
  }
});

router.put('/buyers/:id/reject', async (req, res, next) => {
  try {
    const rejectedBuyer = await AdminService.rejectBuyer(req.params.id, req.user.id, req.body.reason);
    return successResponse(res, { buyer: rejectedBuyer }, 'खरीदार सत्यापन अस्वीकार किया गया (Buyer verification rejected)');
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// 3. Platform Configuration & Matching Weights
// -------------------------------------------------------------
router.get('/config', async (req, res, next) => {
  try {
    const config = await AdminService.getPlatformConfig();
    return successResponse(res, config, 'प्लेटफॉर्म कॉन्फ़िगरेशन (Platform config fetched)');
  } catch (err) {
    next(err);
  }
});

router.put('/config', async (req, res, next) => {
  try {
    const updated = await AdminService.updateMatchingWeights(req.body.buyer_matching_weights || req.body, req.user.id);
    return successResponse(res, { config: updated }, 'मैचिंग भार कॉन्फ़िगरेशन अपडेट (Matching weights updated successfully)');
  } catch (err) {
    next(err);
  }
});

// -------------------------------------------------------------
// 4. Users Directory & Audit Logs
// -------------------------------------------------------------
router.get('/users', async (req, res, next) => {
  try {
    const users = await User.findAll({ role: req.query.role });
    return successResponse(res, { users }, 'उपयोगकर्ता सूची (User list fetched)');
  } catch (err) {
    next(err);
  }
});

router.get('/audit-logs', async (req, res, next) => {
  try {
    const logs = await AuditLog.findAll(Number(req.query.limit || 50));
    return successResponse(res, { logs }, 'ऑडिट लॉग (Audit logs fetched)');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
