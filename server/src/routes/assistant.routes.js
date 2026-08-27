const express = require('express');
const router = express.Router();
const AssistantService = require('../services/assistantService');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');
const env = require('../config/env');
const User = require('../models/User');

// Optional Auth Middleware for Assistant
const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      const user = await User.findById(decoded.id);
      if (user) {
        req.user = user;
      }
    } catch (err) {
      // Ignore token verification errors for optional auth
    }
  }
  next();
};

/**
 * POST /api/v1/assistant/query
 * Processes typed Hindi/Hinglish/English assistant queries
 */
router.post('/query', optionalAuth, async (req, res, next) => {
  try {
    const text = req.body.text || req.body.query;
    const context = req.body.context || {};

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'कृपया अपना प्रश्न बोलें या टाइप करें (Query text is required)'
      });
    }

    const result = await AssistantService.processAssistantQuery(text.trim(), req.user || null, context);
    const dataObj = {
      transcript: text.trim(),
      answer: result.response_text || result.answer,
      response_text: result.response_text || result.answer,
      speech_text: result.speech_text || result.answer,
      language: 'hi-IN',
      intent: result.intent,
      entities: result.entities || {},
      confidence: result.confidence || 0.95,
      card_data: result.card_data || null,
      geminiConfigured: !!env.GEMINI_API_KEY,
      timestamp: new Date().toISOString()
    };

    return res.status(200).json({
      success: true,
      ...dataObj,
      data: dataObj
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
