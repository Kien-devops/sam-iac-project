const request = require('supertest');
const app = require('../src/app');

describe('E-Commerce Express App API Endpoints', () => {
  
  describe('GET /api/health', () => {
    it('should return 200 OK and health status parameters', async () => {
      const res = await request(app).get('/api/health');
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('status', 'healthy');
      expect(res.body).toHaveProperty('timestamp');
    });
  });

  describe('POST /api/auth/login', () => {
    it('should authenticate successfully with correct mock credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'admin' });
      expect(res.statusCode).toEqual(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('role', 'admin');
    });

    it('should reject invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ username: 'admin', password: 'wrongpassword' });
      expect(res.statusCode).toEqual(401);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('GET /api/products', () => {
    it('should return product listings array', async () => {
      const res = await request(app).get('/api/products');
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('name');
        expect(res.body[0]).toHaveProperty('price');
      }
    });
  });

  describe('POST /api/orders', () => {
    it('should accept valid order items and trigger order creation', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({
          items: [
            { productId: '1', name: 'MacBook Pro M3 Max', price: 3499, quantity: 1 }
          ]
        });
      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('total', 3499);
      expect(res.body).toHaveProperty('status', 'Processing');
    });

    it('should reject empty order payloads', async () => {
      const res = await request(app)
        .post('/api/orders')
        .send({});
      expect(res.statusCode).toEqual(400);
    });
  });
});
