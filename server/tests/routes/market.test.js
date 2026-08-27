const { describe, it } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../../src/app');

describe('Market API Tests', () => {
  it('GET /api/v1/market/commodities returns active commodities', async () => {
    const res = await request(app).get('/api/v1/market/commodities');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.commodities));
    assert.ok(res.body.data.commodities.length >= 10);
  });

  it('GET /api/v1/market/mandis returns active mandis', async () => {
    const res = await request(app).get('/api/v1/market/mandis');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.mandis));
    assert.ok(res.body.data.mandis.length >= 10);
  });

  it('GET /api/v1/market/prices returns price lists with demo data flag', async () => {
    const res = await request(app).get('/api/v1/market/prices');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.prices));
    assert.strictEqual(res.body.meta.is_demo_data, true);
  });

  it('GET /api/v1/market/prices/trends returns historical trends', async () => {
    const res = await request(app)
      .get('/api/v1/market/prices/trends')
      .query({ commodity_id: 'b0000000-0000-0000-0000-000000000001', days: 7 });

    assert.strictEqual(res.statusCode, 200);
    assert.ok(Array.isArray(res.body.data.trends));
    assert.strictEqual(res.body.data.trends.length, 7);
  });

  it('GET /api/v1/market/prices/compare returns mandi price differences', async () => {
    const res = await request(app)
      .get('/api/v1/market/prices/compare')
      .query({ commodity_id: 'b0000000-0000-0000-0000-000000000001' });

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.data.highest_mandi);
    assert.ok(res.body.data.lowest_mandi);
    assert.ok(typeof res.body.data.price_gap_per_quintal === 'number');
  });
});
