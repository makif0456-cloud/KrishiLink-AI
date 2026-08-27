const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/constants');
const User = require('../models/User');
const GeminiLiveService = require('../services/geminiLiveService');
const AssistantService = require('../services/assistantService');

function setupVoiceWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/api/v1/voice/live' });

  console.log('🎙️ KrishiLink Voice WebSocket Server initialized on /api/v1/voice/live');

  wss.on('connection', async (ws, req) => {
    console.log('[VOICE WS] Client connected to Voice WebSocket');
    let user = null;

    // Optional JWT authentication from URL query string
    try {
      const url = new URL(req.url, 'http://localhost');
      const token = url.searchParams.get('token');
      if (token) {
        const decoded = jwt.verify(token, JWT_SECRET);
        user = await User.findById(decoded.id);
        if (user) {
          console.log(`[VOICE WS] Authenticated farmer: ${user.name_hi || user.name || user.id}`);
        }
      }
    } catch (e) {
      // Allow guest voice queries
    }

    // Initialize Gemini Live Session for this connection
    const liveSession = GeminiLiveService.createLiveSession(ws, user);

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());

        // 1. Audio stream chunks (16kHz PCM Base64) from client microphone
        if (message.type === 'audio' && message.pcm) {
          if (liveSession) {
            liveSession.sendAudioChunk(message.pcm);
          }
        }

        // 2. Text query message (for Gemini Live or Fallback)
        else if (message.type === 'text' || message.type === 'query') {
          const queryText = message.text || message.query;
          if (liveSession) {
            liveSession.sendTextMessage(queryText);
          } else {
            // Local Deterministic NLU Fallback
            const result = await AssistantService.processAssistantQuery(queryText, user, message.context || {});
            ws.send(JSON.stringify({
              type: 'response',
              text: result.response_text || result.answer,
              speech_text: result.speech_text || result.answer,
              card: result.card_data,
              intent: result.intent
            }));
            ws.send(JSON.stringify({ type: 'turn_complete' }));
          }
        }

        // 3. User Interrupt / Stop Request
        else if (message.type === 'interrupt' || message.type === 'stop') {
          console.log('[VOICE WS] User interrupted conversation');
          ws.send(JSON.stringify({ type: 'interrupted' }));
        }

      } catch (err) {
        console.error('[VOICE WS] Error handling message:', err);
      }
    });

    ws.on('close', () => {
      console.log('[VOICE WS] Client disconnected');
      if (liveSession) {
        liveSession.close();
      }
    });

    ws.on('error', (err) => {
      console.error('[VOICE WS] Client socket error:', err.message);
      if (liveSession) {
        liveSession.close();
      }
    });
  });

  return wss;
}

module.exports = { setupVoiceWebSocket };
