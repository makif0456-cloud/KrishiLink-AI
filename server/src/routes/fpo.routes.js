const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { rbac } = require('../middleware/rbac');
const { successResponse } = require('../utils/responseHelper');
const FpoService = require('../services/fpoService');

// Require FPO or Admin role for FPO portal
router.use(authMiddleware, rbac('fpo', 'admin'));

/**
 * GET /api/v1/fpo/dashboard
 * Aggregated produce totals, members count, potential trading value, bulk buyer opportunities
 */
router.get('/dashboard', async (req, res, next) => {
  try {
    const data = await FpoService.getDashboard(req.user);
    return successResponse(res, data, 'एफपीओ डैशबोर्ड डेटा (FPO dashboard fetched)');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/fpo/members
 * Member farmers list
 */
router.get('/members', async (req, res, next) => {
  try {
    const members = await FpoService.getMembers(req.user);
    return successResponse(res, { members }, 'एफपीओ सदस्य किसान सूची (FPO members fetched)');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
