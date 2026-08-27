const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/auth.routes');
const marketRoutes = require('./routes/market.routes');
const lotRoutes = require('./routes/lot.routes');
const buyerRoutes = require('./routes/buyer.routes');
const offerRoutes = require('./routes/offer.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const recommendationRoutes = require('./routes/recommendation.routes');
const forecastRoutes = require('./routes/forecast.routes');
const assistantRoutes = require('./routes/assistant.routes');
const voiceRoutes = require('./routes/voice.routes');
const adminRoutes = require('./routes/admin.routes');
const fpoRoutes = require('./routes/fpo.routes');
const { DEMO_DISCLAIMER_HI } = require('./config/constants');

const app = express();

// Security & Parsing Middlewares
app.use(helmet());
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'KrishiLink AI Backend',
    version: '1.0.0-phase4',
    is_demo_mode: true,
    disclaimer: DEMO_DISCLAIMER_HI,
    timestamp: new Date().toISOString()
  });
});

// API Routes (v1)
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/market', marketRoutes);
app.use('/api/v1/lots', lotRoutes);
app.use('/api/v1/buyers', buyerRoutes);
app.use('/api/v1/offers', offerRoutes);
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/payments', paymentRoutes);
app.use('/api/v1/recommendations', recommendationRoutes);
app.use('/api/v1/forecast', forecastRoutes);
app.use('/api/v1/assistant', assistantRoutes);
app.use('/api/v1/voice', voiceRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/fpo', fpoRoutes);

// 404 Handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'अनुरोधित एंडपॉइंट नहीं मिला (Endpoint not found)',
    path: req.originalUrl
  });
});

// Global Error Handler
app.use(errorHandler);

module.exports = app;
