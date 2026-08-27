const { test, describe, before } = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const app = require('../../src/app');

describe('Phase 4: Hindi Voice Assistant, Admin Analytics, Buyer Verification & FPO Tests', () => {
  let farmerToken = '';
  let buyerToken = '';
  let fpoToken = '';
  let adminToken = '';
  let pendingBuyerId = '';

  before(async () => {
    // 1. Farmer Login
    const farmerRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '9876543210', password: 'Password@123' });
    farmerToken = farmerRes.body.data.token;

    // 2. Buyer Login
    const buyerRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '9876543211', password: 'Password@123' });
    buyerToken = buyerRes.body.data.token;

    // 3. FPO Login
    const fpoRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '9876543212', password: 'Password@123' });
    fpoToken = fpoRes.body.data.token;

    // 4. Admin Login
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '9876543200', password: 'Password@123' });
    adminToken = adminRes.body.data.token;

    // 5. Register a temporary unverified buyer for verification queue testing
    const newBuyerRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'पटेल एग्रो मिल्स',
        phone: '9876500099',
        password: 'Password@123',
        role: 'buyer',
        business_name: 'पटेल एग्रो मिल्स प्रा. लि.',
        district: 'Indore',
        buyer_type: 'processor'
      });
    if (newBuyerRes.body.data?.user) {
      pendingBuyerId = newBuyerRes.body.data.user.id;
    }
  });

  // -------------------------------------------------------------
  // Part 1: Voice & Natural Language Understanding Gateway
  // -------------------------------------------------------------
  test('Assistant: POST /api/v1/assistant/query for Market Price ("गेहूं का आज का भाव क्या है?")', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ text: 'गेहूं का आज का भाव क्या है?' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.intent, 'market_price');
    assert.ok(res.body.data.response_text.includes('भाव'));
    assert.ok(res.body.data.speech_text.length > 0);
    assert.ok(res.body.data.card_data.action_url === '/market');
  });

  test('Assistant: POST /api/v1/assistant/query for Price Forecast ("15 दिन का मूल्य पूर्वानुमान बताओ")', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ text: '15 दिन का मूल्य पूर्वानुमान बताओ' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.intent, 'price_forecast');
    assert.ok(res.body.data.response_text.includes('पूर्वानुमान'));
  });

  test('Assistant: POST /api/v1/assistant/query for Selling Recommendation ("मेरी फसल के लिए सबसे अच्छा विकल्प क्या है?")', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ text: 'मेरी फसल के लिए सबसे अच्छा विकल्प क्या है?' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.intent, 'selling_recommendation');
    assert.ok(res.body.data.card_data !== null);
  });

  test('Assistant: POST /api/v1/assistant/query for Greeting ("नमस्ते")', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .send({ text: 'नमस्ते' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.intent, 'greeting');
    assert.ok(res.body.data.speech_text.includes('KrishiLink AI'));
  });

  test('Assistant: POST /api/v1/voice/query alias with context memory ("अगले 15 दिन में भाव क्या रहेगा?")', async () => {
    const res = await request(app)
      .post('/api/v1/voice/query')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ 
        text: 'अगले 15 दिन में भाव क्या रहेगा?',
        context: { commodity: 'soybean', commodity_name_hi: 'सोयाबीन (Soybean)' }
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.intent, 'price_forecast');
    assert.equal(res.body.data.entities.commodity, 'soybean');
  });

  test('Assistant: POST /api/v1/assistant/query for My Offers ("मेरे कितने ऑफर आए हैं?")', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ text: 'मेरे कितने ऑफर आए हैं?' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.intent, 'my_offers');
  });

  test('Assistant: POST /api/v1/assistant/query for Order Status ("मेरे ऑर्डर का क्या स्टेटस है?")', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ text: 'मेरे ऑर्डर का क्या स्टेटस है?' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.intent, 'order_status');
  });

  test('Assistant: Rejects empty query with 400 Bad Request', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .send({ text: '   ' });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
  });

  test('Voice: GET /api/v1/voice/health returns service status', async () => {
    const res = await request(app).get('/api/v1/voice/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.voice, true);
    assert.ok(Array.isArray(res.body.supportedMimeTypes));
  });

  test('Voice: POST /api/v1/voice/ask handles multipart audio buffer upload', async () => {
    const dummyAudioBuffer = Buffer.alloc(2048, 0x55);
    const res = await request(app)
      .post('/api/v1/voice/ask')
      .set('Authorization', `Bearer ${farmerToken}`)
      .attach('audio', dummyAudioBuffer, 'test_voice.webm');

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.transcript.length > 0);
    assert.ok(res.body.answer.length > 0);
    assert.equal(res.body.language, 'hi-IN');
  });

  test('Voice: POST /api/v1/voice/ask rejects tiny/empty audio (< 500 bytes)', async () => {
    const tinyBuffer = Buffer.alloc(100, 0x11);
    const res = await request(app)
      .post('/api/v1/voice/ask')
      .attach('audio', tinyBuffer, 'tiny.webm');

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('आवाज़'));
  });

  test('Voice: POST /api/v1/voice/ask handles text JSON fallback', async () => {
    const res = await request(app)
      .post('/api/v1/voice/ask')
      .send({ text: 'गेहूं का आज का भाव क्या है?' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.intent, 'market_price');
    assert.ok(res.body.answer.length > 0);
  });

  test('Assistant: Calculation intent ("अगर 100 क्विंटल गेहूं ₹2480 में बेचूं तो कितना मिलेगा?")', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ text: 'अगर 100 क्विंटल गेहूं ₹2480 में बेचूं तो कितना मिलेगा?' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.intent, 'calculation');
    assert.ok(res.body.data.response_text.includes('2,48,000'));
    assert.ok(res.body.data.speech_text.includes('दो लाख') || res.body.data.speech_text.includes('2,48,000'));
  });

  test('Assistant: Natural variation ("गेहूं का आज का रेट क्या चल रहा है?")', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .send({ text: 'गेहूं का आज का रेट क्या चल रहा है?' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.intent, 'market_price');
  });

  test('Assistant: Natural variation ("मेरी गेहूं की फसल कहाँ बेचूं?")', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ text: 'मेरी गेहूं की फसल कहाँ बेचूं?' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.intent, 'selling_recommendation');
  });

  test('Assistant: Natural variation ("अगले पंद्रह दिन में रेट ऊपर जाएगा?")', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .send({ text: 'अगले पंद्रह दिन में रेट ऊपर जाएगा?' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.intent, 'price_forecast');
  });

  test('Assistant: Natural variation ("मुझे कितने ऑफर मिले हैं?")', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ text: 'मुझे कितने ऑफर मिले हैं?' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.intent, 'my_offers');
  });

  test('Assistant: Natural variation ("मेरा ऑर्डर कहाँ तक पहुंचा?")', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ text: 'मेरा ऑर्डर कहाँ तक पहुंचा?' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.intent, 'order_status');
  });

  test('Assistant: Natural variation ("100 क्विंटल को 2480 रुपये में बेचने पर कितने पैसे मिलेंगे?")', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .send({ text: '100 क्विंटल को 2480 रुपये में बेचने पर कितने पैसे मिलेंगे?' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.intent, 'calculation');
    assert.ok(res.body.data.response_text.includes('2,48,000'));
  });

  test('Assistant: Natural variation ("आज प्याज का भाव क्या है?")', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .send({ text: 'आज प्याज का भाव क्या है?' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.intent, 'market_price');
    assert.equal(res.body.data.entities.commodity, 'onion');
    assert.ok(res.body.data.speech_text.includes('प्याज'));
    assert.ok(res.body.data.speech_text.includes('रुपये प्रति क्विंटल'));
  });

  test('Assistant: Natural variation ("सोयाबीन का रेट बताओ")', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .send({ text: 'सोयाबीन का रेट बताओ' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.intent, 'market_price');
    assert.equal(res.body.data.entities.commodity, 'soybean');
  });

  test('Assistant: Spoken number words conversion in speech_text', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .send({ text: '100 क्विंटल गेहूं 2480 रुपये में बेचने पर कितना मिलेगा?' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.intent, 'calculation');
    assert.ok(res.body.data.speech_text.includes('दो लाख अड़तालीस हजार रुपये'));
    assert.ok(res.body.data.speech_text.includes('दो हजार चार सौ अस्सी रुपये'));
  });

  test('Assistant: Natural variation ("हैलो KrishiLink")', async () => {
    const res = await request(app)
      .post('/api/v1/assistant/query')
      .send({ text: 'हैलो KrishiLink' });

    assert.equal(res.status, 200);
    assert.equal(res.body.data.intent, 'greeting');
  });

  // -------------------------------------------------------------
  // Part 2: Admin Analytics & RBAC Security
  // -------------------------------------------------------------
  test('Admin: GET /api/v1/admin/analytics requires admin role (403 for farmer)', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Authorization', `Bearer ${farmerToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('Admin: GET /api/v1/admin/analytics returns comprehensive KPIs for admin', async () => {
    const res = await request(app)
      .get('/api/v1/admin/analytics')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.kpis);
    assert.ok(res.body.data.kpis.farmers_count >= 1);
    assert.ok(res.body.data.kpis.buyers_count >= 1);
    assert.ok(typeof res.body.data.kpis.total_trading_value === 'number');
    assert.ok(res.body.data.commodity_breakdown);
  });

  // -------------------------------------------------------------
  // Part 3: Buyer Verification Queue
  // -------------------------------------------------------------
  test('Admin: GET /api/v1/admin/buyers/pending lists unverified buyers', async () => {
    const res = await request(app)
      .get('/api/v1/admin/buyers/pending')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.buyers));
  });

  test('Admin: PUT /api/v1/admin/buyers/:id/verify updates is_verified to true', async () => {
    if (!pendingBuyerId) return;

    const res = await request(app)
      .put(`/api/v1/admin/buyers/${pendingBuyerId}/verify`)
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.buyer.is_verified, true);
  });

  // -------------------------------------------------------------
  // Part 4: Matching Weights Configuration Editor
  // -------------------------------------------------------------
  test('Admin: GET /api/v1/admin/config returns 6-factor weights', async () => {
    const res = await request(app)
      .get('/api/v1/admin/config')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.buyer_matching_weights);
  });

  test('Admin: PUT /api/v1/admin/config successfully saves weights summing to 100%', async () => {
    const validWeights = {
      price: 45,
      distance: 20,
      quantity_match: 15,
      quality_match: 10,
      payment_reliability: 5,
      delivery_compatibility: 5
    };

    const res = await request(app)
      .put('/api/v1/admin/config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ buyer_matching_weights: validWeights });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  test('Admin: PUT /api/v1/admin/config rejects weights when sum != 100% (400 Bad Request)', async () => {
    const invalidWeights = {
      price: 50,
      distance: 20,
      quantity_match: 15,
      quality_match: 10,
      payment_reliability: 10,
      delivery_compatibility: 5 // Sum = 110%
    };

    const res = await request(app)
      .put('/api/v1/admin/config')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ buyer_matching_weights: invalidWeights });

    assert.equal(res.status, 400);
    assert.equal(res.body.success, false);
    assert.ok(res.body.message.includes('100%'));
  });

  // -------------------------------------------------------------
  // Part 5: FPO Produce Aggregation & Dashboard
  // -------------------------------------------------------------
  test('FPO: GET /api/v1/fpo/dashboard requires fpo or admin role (403 for farmer)', async () => {
    const res = await request(app)
      .get('/api/v1/fpo/dashboard')
      .set('Authorization', `Bearer ${farmerToken}`);

    assert.equal(res.status, 403);
    assert.equal(res.body.success, false);
  });

  test('FPO: GET /api/v1/fpo/dashboard returns aggregated produce and member metrics for FPO', async () => {
    const res = await request(app)
      .get('/api/v1/fpo/dashboard')
      .set('Authorization', `Bearer ${fpoToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.summary.total_members >= 40);
    assert.ok(res.body.data.summary.total_produce_quintals > 0);
    assert.ok(Array.isArray(res.body.data.aggregated_produce));
    assert.ok(Array.isArray(res.body.data.bulk_buyer_matches));
  });

  test('FPO: GET /api/v1/fpo/members returns member farmer directory', async () => {
    const res = await request(app)
      .get('/api/v1/fpo/members')
      .set('Authorization', `Bearer ${fpoToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.members));
    assert.ok(res.body.data.members.length > 0);
  });
});
