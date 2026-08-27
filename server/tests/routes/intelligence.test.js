const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../../src/app');

describe('Phase 3: Intelligence, Recommendation & Forecasting Engine Tests', () => {
  let farmerToken = '';
  let buyerToken = '';
  let testLotId = '';

  before(async () => {
    // Login as Demo Farmer
    const farmerRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '9876543210', password: 'Password@123' });
    farmerToken = farmerRes.body.data.token;

    // Login as Demo Buyer
    const buyerRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '9876543211', password: 'Password@123' });
    buyerToken = buyerRes.body.data.token;

    // Create a demo buyer requirement for Wheat
    await request(app)
      .post('/api/v1/buyers/requirements')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        commodity_id: 'b0000000-0000-0000-0000-000000000001',
        quantity_min: 50,
        quantity_max: 200,
        price_max: 2480,
        quality_grade: 'A',
        pickup_available: true,
        delivery_radius_km: 150
      });

    // Create a demo lot (100 quintals Wheat Grade A at Berasia/Bhopal)
    const lotRes = await request(app)
      .post('/api/v1/lots')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        commodity_id: 'b0000000-0000-0000-0000-000000000001',
        quantity: 100,
        unit: 'quintal',
        quality_grade: 'A',
        latitude: 23.6341,
        longitude: 77.4338,
        expected_price: 2500,
        notes: 'उच्च गुणवत्ता वाला गेहूं (Phase 3 testing wheat lot)'
      });
    testLotId = lotRes.body.data.lot.id;
  });

  // 1. BUYER MATCHING ENGINE
  it('GET /api/v1/lots/:id/matching-buyers returns explainable scores with 6 factor breakdown', async () => {
    const res = await request(app)
      .get(`/api/v1/lots/${testLotId}/matching-buyers`)
      .set('Authorization', `Bearer ${farmerToken}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.matching_buyers));
    assert.ok(res.body.data.matching_buyers.length > 0);

    const buyerMatch = res.body.data.matching_buyers[0];
    assert.ok(typeof buyerMatch.match_score === 'number');
    assert.ok(buyerMatch.match_score >= 0 && buyerMatch.match_score <= 100);
    assert.ok(buyerMatch.score_breakdown);
    assert.ok(typeof buyerMatch.score_breakdown.price === 'number');
    assert.ok(typeof buyerMatch.score_breakdown.distance === 'number');
    assert.ok(typeof buyerMatch.score_breakdown.quantity === 'number');
    assert.ok(typeof buyerMatch.score_breakdown.quality === 'number');
    assert.ok(typeof buyerMatch.score_breakdown.payment === 'number');
    assert.ok(typeof buyerMatch.score_breakdown.delivery === 'number');
  });

  it('POST /api/v1/recommendations/buyers matches custom quantity and quality', async () => {
    const res = await request(app)
      .post('/api/v1/recommendations/buyers')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        commodity_id: 'b0000000-0000-0000-0000-000000000001',
        quantity: 150,
        quality_grade: 'A',
        latitude: 23.6341,
        longitude: 77.4338
      });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.matching_buyers));
  });

  // 2. DETERMINISTIC RECOMMENDATION ENGINE
  it('GET /api/v1/recommendations/lot/:lotId returns Net Realization formula breakdown', async () => {
    const res = await request(app)
      .get(`/api/v1/recommendations/lot/${testLotId}`)
      .set('Authorization', `Bearer ${farmerToken}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    const data = res.body.data;

    assert.ok(data.top_recommendation);
    assert.ok(Array.isArray(data.all_options));
    assert.ok(data.all_options.length >= 3); // Evaluates Mandis, Direct Buyers, and Storage

    const top = data.top_recommendation;
    // Verify Net Realization Formula: Gross - Deductions
    assert.strictEqual(
      top.net_realization,
      top.gross_revenue - top.total_deductions
    );
    assert.strictEqual(
      top.total_deductions,
      top.transport_cost + top.loading_cost + top.commission_cost + top.storage_cost + top.other_costs
    );
    assert.strictEqual(top.rank, 1);
    assert.ok(top.recommendation_reason);
    assert.ok(data.disclaimer);
  });

  it('GET /api/v1/recommendations/lot/:lotId/options compares all selling options', async () => {
    const res = await request(app)
      .get(`/api/v1/recommendations/lot/${testLotId}/options`)
      .set('Authorization', `Bearer ${farmerToken}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.all_options.length > 0);
    assert.ok(res.body.data.benchmark_local_mandi);
  });

  // 3. PRICE FORECASTING ENGINE
  it('GET /api/v1/forecast/prices returns 15-day projected price points and trend indicator', async () => {
    const res = await request(app)
      .get('/api/v1/forecast/prices?commodity_id=b0000000-0000-0000-0000-000000000001&horizon_days=15')
      .set('Authorization', `Bearer ${farmerToken}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    const data = res.body.data;

    assert.ok(Array.isArray(data.forecast));
    assert.strictEqual(data.forecast.length, 15);
    assert.ok(data.forecast[0].predicted_modal_price > 0);
    assert.ok(data.forecast[0].min_estimate <= data.forecast[0].predicted_modal_price);
    assert.ok(data.forecast[0].max_estimate >= data.forecast[0].predicted_modal_price);
    assert.ok(data.trend_direction);
    assert.ok(data.trend_label_hi);
    assert.ok(data.is_demo_data);
  });

  // 4. SECURITY & ERROR HANDLING
  it('Rejects recommendation request with invalid lot ID', async () => {
    const res = await request(app)
      .get('/api/v1/recommendations/lot/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${farmerToken}`);

    assert.strictEqual(res.statusCode, 404);
    assert.strictEqual(res.body.success, false);
  });

  it('Rejects unauthenticated recommendation request', async () => {
    const res = await request(app)
      .get(`/api/v1/recommendations/lot/${testLotId}`);

    assert.strictEqual(res.statusCode, 401);
  });
});
