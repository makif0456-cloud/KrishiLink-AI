const app = require('./app');
const env = require('./config/env');
const { initDatabase } = require('./config/database');

const { setupVoiceWebSocket } = require('./websocket/voiceSocket');

async function startServer() {
  await initDatabase();

  const server = app.listen(env.PORT, () => {
    console.log(`==================================================`);
    console.log(`🌾 KrishiLink AI - Backend Server Started`);
    console.log(`🚀 Port: ${env.PORT}`);
    console.log(`🌐 Environment: ${env.NODE_ENV}`);
    console.log(`📊 Health Check: http://localhost:${env.PORT}/health`);
    console.log(`🌾 Market API: http://localhost:${env.PORT}/api/v1/market/prices`);
    console.log(`🎙️ Voice Live WebSocket: ws://localhost:${env.PORT}/api/v1/voice/live`);
    console.log(`🎙️ VOICE: Gemini API configured = ${!!env.GEMINI_API_KEY}`);
    console.log(`==================================================`);
  });

  // Attach WebSocket server for Gemini Live Real-time Audio
  setupVoiceWebSocket(server);

  return server;
}

if (require.main === module) {
  startServer().catch(err => {
    console.error('Failed to start server:', err);
    process.exit(1);
  });
}

module.exports = { startServer };
