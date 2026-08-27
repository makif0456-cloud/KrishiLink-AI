const { describe, it, before } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../../src/app');

describe('Phase 2: Core Trading & Transaction Lifecycle Tests', () => {
  let farmerToken = '';
  let buyerToken = '';
  let fpoToken = '';
  let testLotId = '';
  let testOfferId = '';
  let testOrderId = '';

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

    // Login as Demo FPO
    const fpoRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '9876543212', password: 'Password@123' });
    fpoToken = fpoRes.body.data.token;
  });

  // 1. LOT CREATION & VALIDATION
  it('Farmer creates lot with 100 quintals Wheat (Grade A)', async () => {
    const res = await request(app)
      .post('/api/v1/lots')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        commodity_id: 'b0000000-0000-0000-0000-000000000001',
        quantity: 100,
        unit: 'quintal',
        quality_grade: 'A',
        latitude: 26.8467,
        longitude: 80.9462, // Lucknow
        expected_price: 2500,
        notes: 'लखनऊ उच्च गुणवत्ता वाला गेहूं (Lucknow high quality wheat)'
      });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.lot.quantity, 100);
    assert.strictEqual(res.body.data.lot.quality_grade, 'A');
    assert.strictEqual(res.body.data.lot.status, 'active');
    testLotId = res.body.data.lot.id;
  });

  it('Rejects lot creation with negative or zero quantity', async () => {
    const res = await request(app)
      .post('/api/v1/lots')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        commodity_id: 'b0000000-0000-0000-0000-000000000001',
        quantity: -10
      });

    assert.strictEqual(res.statusCode, 400);
    assert.strictEqual(res.body.success, false);
  });

  it('Buyer cannot create farmer lot (RBAC enforcement)', async () => {
    const res = await request(app)
      .post('/api/v1/lots')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        commodity_id: 'b0000000-0000-0000-0000-000000000001',
        quantity: 50
      });

    assert.strictEqual(res.statusCode, 403);
  });

  it('Farmer fetches their own lots via GET /api/v1/lots/my', async () => {
    const res = await request(app)
      .get('/api/v1/lots/my')
      .set('Authorization', `Bearer ${farmerToken}`);

    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.data.lots));
    assert.ok(res.body.data.lots.some(l => l.id === testLotId));
  });

  // 2. BUYER REQUIREMENTS
  it('Buyer creates active buy requirement', async () => {
    const res = await request(app)
      .post('/api/v1/buyers/requirements')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        commodity_id: 'b0000000-0000-0000-0000-000000000001',
        quantity_min: 50,
        quantity_max: 150,
        price_max: 2450,
        quality_grade: 'A',
        pickup_available: true,
        delivery_radius_km: 150
      });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.data.requirement.price_max, 2450);
  });

  it('Farmer cannot create buyer requirement (RBAC)', async () => {
    const res = await request(app)
      .post('/api/v1/buyers/requirements')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        commodity_id: 'b0000000-0000-0000-0000-000000000001',
        price_max: 2500
      });

    assert.strictEqual(res.statusCode, 403);
  });

  // 3. DETERMINISTIC BUYER MATCHING
  it('GET /api/v1/lots/:id/matching-buyers returns ranked matched buyers with deterministic scores', async () => {
    const res = await request(app)
      .get(`/api/v1/lots/${testLotId}/matching-buyers`)
      .set('Authorization', `Bearer ${farmerToken}`);

    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.data.matching_buyers));
    assert.ok(res.body.data.matching_buyers.length > 0);
    const topMatch = res.body.data.matching_buyers[0];
    assert.ok(topMatch.match_score >= 0 && topMatch.match_score <= 100);
    assert.ok(topMatch.score_breakdown);
    assert.ok(typeof topMatch.distance_km === 'number');
  });

  // 4. DIGITAL OFFERS & NEGOTIATION
  it('Buyer creates offer on farmer lot for ₹2,450/quintal', async () => {
    const res = await request(app)
      .post('/api/v1/offers')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        lot_id: testLotId,
        offered_price: 2450,
        pickup_offered: true,
        payment_terms: 'on_delivery',
        notes: 'सीधा आपके खेत से उठाएंगे (Direct farm pickup)'
      });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.data.offer.offered_price, 2450);
    assert.strictEqual(res.body.data.offer.total_amount, 245000); // 2450 * 100 quintals
    assert.strictEqual(res.body.data.offer.status, 'pending');
    testOfferId = res.body.data.offer.id;
  });

  it('Farmer views offers for their lot', async () => {
    const res = await request(app)
      .get(`/api/v1/offers/lot/${testLotId}`)
      .set('Authorization', `Bearer ${farmerToken}`);

    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.data.offers));
    assert.strictEqual(res.body.data.offers[0].id, testOfferId);
  });

  it('Farmer submits counter offer of ₹2,480/quintal', async () => {
    const res = await request(app)
      .put(`/api/v1/offers/${testOfferId}/counter`)
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({ counter_price: 2480 });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.data.offer.status, 'countered');
    assert.strictEqual(res.body.data.offer.counter_price, 2480);
  });

  it('Buyer portal receives the farmer counter offer via GET /api/v1/offers/my', async () => {
    const res = await request(app)
      .get('/api/v1/offers/my')
      .set('Authorization', `Bearer ${buyerToken}`);

    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.data.offers));
    const buyerOffer = res.body.data.offers.find(o => o.id === testOfferId);
    assert.ok(buyerOffer, 'Offer must exist in buyer offers');
    assert.strictEqual(buyerOffer.status, 'countered');
    assert.strictEqual(buyerOffer.counter_price, 2480);
  });

  it('Buyer accepts the farmer counter offer, triggering automatic Order creation', async () => {
    const res = await request(app)
      .put(`/api/v1/offers/${testOfferId}/accept`)
      .set('Authorization', `Bearer ${buyerToken}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.data.offer.status, 'accepted');
    assert.ok(res.body.data.order);
    assert.strictEqual(res.body.data.order.status, 'confirmed');
    assert.strictEqual(res.body.data.order.agreed_price, 2480);
    assert.strictEqual(res.body.data.order.quantity, 100);
    assert.strictEqual(res.body.data.order.total_amount, 248000);
    testOrderId = res.body.data.order.id;
  });

  it('Cannot re-accept an already accepted offer (Invalid state transition)', async () => {
    const res = await request(app)
      .put(`/api/v1/offers/${testOfferId}/accept`)
      .set('Authorization', `Bearer ${farmerToken}`);

    assert.strictEqual(res.statusCode, 400);
  });

  // 5. ORDER LIFECYCLE & TRANSITIONS
  it('GET /api/v1/orders returns confirmed order for both parties', async () => {
    const farmerOrders = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${farmerToken}`);

    assert.strictEqual(farmerOrders.statusCode, 200);
    assert.ok(farmerOrders.body.data.orders.some(o => o.id === testOrderId));

    const buyerOrders = await request(app)
      .get('/api/v1/orders')
      .set('Authorization', `Bearer ${buyerToken}`);

    assert.strictEqual(buyerOrders.statusCode, 200);
    assert.ok(buyerOrders.body.data.orders.some(o => o.id === testOrderId));
  });

  it('Buyer advances order status: confirmed -> dispatched', async () => {
    const res = await request(app)
      .put(`/api/v1/orders/${testOrderId}/status`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ status: 'dispatched' });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.data.order.status, 'dispatched');
  });

  it('Buyer advances order status: dispatched -> delivered', async () => {
    const res = await request(app)
      .put(`/api/v1/orders/${testOrderId}/status`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ status: 'delivered' });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.data.order.status, 'delivered');
  });

  it('Rejects invalid status jump (e.g. delivered -> dispatched)', async () => {
    const res = await request(app)
      .put(`/api/v1/orders/${testOrderId}/status`)
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({ status: 'dispatched' });

    assert.strictEqual(res.statusCode, 400);
  });

  // 6. PAYMENT TRACKING
  it('Buyer records payment of ₹2,48,000 for delivered order', async () => {
    const res = await request(app)
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${buyerToken}`)
      .send({
        order_id: testOrderId,
        amount: 248000,
        payment_type: 'full',
        payment_method: 'upi'
      });

    assert.strictEqual(res.statusCode, 201);
    assert.strictEqual(res.body.data.payment.amount, 248000);
    assert.strictEqual(res.body.data.payment.status, 'completed');
  });

  it('Order status automatically advances to completed after full payment', async () => {
    const res = await request(app)
      .get(`/api/v1/orders/${testOrderId}`)
      .set('Authorization', `Bearer ${farmerToken}`);

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.data.order.status, 'completed');
  });

  it('Payment records fetched via GET /api/v1/payments/order/:orderId', async () => {
    const res = await request(app)
      .get(`/api/v1/payments/order/${testOrderId}`)
      .set('Authorization', `Bearer ${farmerToken}`);

    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.data.payments));
    assert.strictEqual(res.body.data.payments[0].amount, 248000);
  });
});
