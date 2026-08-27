const { describe, it, before, after } = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../../src/app');

describe('Auth API Tests', () => {
  it('GET /health returns 200 with demo mode metadata', async () => {
    const res = await request(app).get('/health');
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.strictEqual(res.body.is_demo_mode, true);
  });

  it('POST /api/v1/auth/login succeeds for demo farmer account', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '9876543210', password: 'Password@123' });
    
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.token);
    assert.strictEqual(res.body.data.user.role, 'farmer');
  });

  it('POST /api/v1/auth/login fails on wrong password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ phone: '9876543210', password: 'WrongPassword' });

    assert.strictEqual(res.statusCode, 401);
    assert.strictEqual(res.body.success, false);
  });

  it('POST /api/v1/auth/send-otp returns demo OTP', async () => {
    const res = await request(app)
      .post('/api/v1/auth/send-otp')
      .send({ phone: '9876543210' });

    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.body.data.otp, '123456');
  });

  it('POST /api/v1/auth/verify-otp allows login with demo OTP', async () => {
    const res = await request(app)
      .post('/api/v1/auth/verify-otp')
      .send({ phone: '9876543210', otp: '123456' });

    assert.strictEqual(res.statusCode, 200);
    assert.ok(res.body.data.token);
  });

  it('GET /api/v1/auth/me requires valid token', async () => {
    const res = await request(app).get('/api/v1/auth/me');
    assert.strictEqual(res.statusCode, 401);
  });
});
