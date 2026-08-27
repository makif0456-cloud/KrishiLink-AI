const express = require('express');
const router = express.Router();
const multer = require('multer');
const VoiceService = require('../services/voiceService');
const AssistantService = require('../services/assistantService');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');
const env = require('../config/env');
const User = require('../models/User');

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max
});

// Optional Auth Middleware for Voice
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
 * GET /api/v1/voice/health
 * Returns voice service & Gemini configuration status
 */
router.get('/health', (req, res) => {
  return res.status(200).json({
    success: true,
    voice: true,
    gemini_configured: !!env.GEMINI_API_KEY,
    geminiConfigured: !!env.GEMINI_API_KEY,
    supportedMimeTypes: ['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/wav', 'audio/ogg'],
    timestamp: new Date().toISOString()
  });
});

/**
 * POST /api/v1/voice/ask
 * Primary endpoint for voice assistant queries (accepts audio file or text)
 */
router.post('/ask', optionalAuth, upload.single('audio'), async (req, res, next) => {
  console.log("VOICE API: route reached (/api/v1/voice/ask)");
  console.log("VOICE API: authenticated user =", req.user?.id || 'guest');
  console.log("VOICE API: file received =", !!req.file);
  console.log("VOICE API: file size =", req.file?.size || 0, "bytes");
  console.log("VOICE API: MIME type =", req.file?.mimetype || 'none');

  try {
    let context = {};
    if (req.body.context) {
      try {
        context = typeof req.body.context === 'string' ? JSON.parse(req.body.context) : req.body.context;
      } catch (e) {}
    } else if (req.body.user_context) {
      try {
        context = typeof req.body.user_context === 'string' ? JSON.parse(req.body.user_context) : req.body.user_context;
      } catch (e) {}
    }

    // Case 1: Audio file was uploaded
    if (req.file && req.file.buffer && req.file.buffer.length > 0) {
      const result = await VoiceService.processVoiceAudio(
        req.file.buffer,
        req.file.mimetype || 'audio/webm;codecs=opus',
        req.user || null,
        context
      );
      
      const payload = {
        ...result,
        data: {
          ...result
        }
      };
      return res.status(200).json(payload);
    }

    // Case 2: Text query sent in body
    const textQuery = req.body.text || req.body.query;
    if (textQuery && typeof textQuery === 'string' && textQuery.trim() !== '') {
      const assistantResult = await AssistantService.processAssistantQuery(
        textQuery.trim(),
        req.user || null,
        context
      );

      const result = {
        success: true,
        transcript: textQuery.trim(),
        answer: assistantResult.response_text || assistantResult.answer,
        response_text: assistantResult.response_text || assistantResult.answer,
        speech_text: assistantResult.speech_text || assistantResult.answer,
        audio: null,
        mimeType: 'audio/wav',
        language: 'hi-IN',
        intent: assistantResult.intent,
        entities: assistantResult.entities || {},
        confidence: assistantResult.confidence || 0.95,
        card_data: assistantResult.card_data || null,
        geminiConfigured: !!env.GEMINI_API_KEY,
        timestamp: new Date().toISOString()
      };

      return res.status(200).json({
        ...result,
        data: { ...result }
      });
    }

    // Neither file nor text provided
    return res.status(400).json({
      success: false,
      message: 'आवाज़ रिकॉर्ड नहीं हो पाई। कृपया दोबारा प्रयास करें।'
    });

  } catch (err) {
    console.error("VOICE API Error:", err);
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'वॉइस सेवा में समस्या हुई। कृपया दोबारा प्रयास करें।'
    });
  }
});

/**
 * POST /api/v1/voice/query
 * Alias for text queries
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
      audio: null,
      mimeType: 'audio/wav',
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
