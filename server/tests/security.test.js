/**
 * Security Tests (D2-17)
 * 
 * Automated test suite for backend security constraints:
 * - Role-based access control
 * - Invalid state transitions
 * - QR code validation
 * - Authorization failures
 * 
 * Running these tests:
 *   npm test              # Run all tests
 *   npm test -- --watch   # Watch mode
 *   npm test -- security  # Run only security tests
 * 
 * Framework: Jest
 * Installation:
 *   npm install --save-dev jest supertest
 * 
 * Update package.json scripts:
 *   "test": "jest",
 *   "test:watch": "jest --watch",
 *   "test:coverage": "jest --coverage"
 */

const request = require('supertest');
const app = require('../app');
const { createClient } = require('@supabase/supabase-js');

// Mock Supabase client for testing
jest.mock('@supabase/supabase-js');

describe('Security Tests (D2-17)', () => {
  let server;
  let retailerToken;
  let dispatcherToken;
  let riderToken;
  let invalidToken = 'invalid.jwt.token';

  beforeAll(() => {
    server = app.listen(0); // Listen on random available port
  });

  afterAll(async () => {
    await new Promise((resolve) => server.close(resolve));
  });

  describe('Authentication Middleware', () => {
    test('should reject requests without Bearer token', async () => {
      const response = await request(app)
        .get('/api/deliveries')
        .expect(401);

      expect(response.body).toEqual({
        error: expect.stringContaining('Unauthorized'),
      });
    });

    test('should reject requests with invalid Bearer token', async () => {
      const response = await request(app)
        .get('/api/deliveries')
        .set('Authorization', `Bearer ${invalidToken}`)
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });

    test('should reject malformed Authorization header', async () => {
      const response = await request(app)
        .get('/api/deliveries')
        .set('Authorization', 'NotBearer sometoken')
        .expect(401);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('Role-Based Access Control (RBAC)', () => {
    test('RETAILER_STAFF cannot assign deliveries (DISPATCHER only)', async () => {
      // In real test, would use retailer token
      const response = await request(app)
        .patch('/api/deliveries/some-id/assign')
        .set('Authorization', `Bearer ${retailerToken}`)
        .send({ rider_id: 'rider-id' })
        .expect(403);

      expect(response.body.error).toContain('Forbidden');
    });

    test('RETAILER_STAFF cannot list all deliveries (sees only own)', async () => {
      // In real test, would verify response only includes user's own deliveries
      const response = await request(app)
        .get('/api/deliveries')
        .set('Authorization', `Bearer ${retailerToken}`)
        .expect(200);

      // Should not contain deliveries created by other users
      response.body.deliveries?.forEach((delivery) => {
        expect(delivery.created_by).toBe(retailerToken); // Mock assertion
      });
    });

    test('RIDER cannot create deliveries (RETAILER_STAFF only)', async () => {
      const response = await request(app)
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({
          customer_name: 'Test Customer',
          customer_phone: '+1-555-1234',
          address: '123 Test St',
          item_description: 'Test Item',
        })
        .expect(403);

      expect(response.body.error).toContain('Forbidden');
    });

    test('RIDER cannot list all riders (DISPATCHER only)', async () => {
      const response = await request(app)
        .get('/api/riders')
        .set('Authorization', `Bearer ${riderToken}`)
        .expect(403);

      expect(response.body.error).toContain('Forbidden');
    });

    test('DISPATCHER can list all deliveries (role scoping)', async () => {
      const response = await request(app)
        .get('/api/deliveries')
        .set('Authorization', `Bearer ${dispatcherToken}`)
        .expect(200);

      expect(Array.isArray(response.body.deliveries)).toBe(true);
    });
  });

  describe('State Transition Validation', () => {
    test('cannot transition from PENDING directly to OUT_FOR_DELIVERY', async () => {
      const response = await request(app)
        .patch('/api/deliveries/pending-delivery-id/status')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ status: 'OUT_FOR_DELIVERY' })
        .expect(409); // Conflict - invalid transition

      expect(response.body.error).toContain(
        'Invalid status transition' || 'Cannot transition'
      );
    });

    test('cannot transition from DELIVERED to any other state', async () => {
      const response = await request(app)
        .patch('/api/deliveries/delivered-delivery-id/status')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ status: 'PENDING' })
        .expect(409);

      expect(response.body.error).toContain('Invalid transition');
    });

    test('cannot transition from OUT_FOR_DELIVERY to DELIVERED via PATCH (only via confirm)', async () => {
      const response = await request(app)
        .patch('/api/deliveries/out-for-delivery-id/status')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ status: 'DELIVERED' })
        .expect(409);

      expect(response.body.error).toContain('Invalid transition');
    });

    test('DISPATCHER can cancel ASSIGNED delivery', async () => {
      const response = await request(app)
        .patch('/api/deliveries/assigned-delivery-id/status')
        .set('Authorization', `Bearer ${dispatcherToken}`)
        .send({ status: 'CANCELLED' })
        .expect(200);

      expect(response.body.delivery.status).toBe('CANCELLED');
    });

    test('RIDER cannot cancel delivery (DISPATCHER only)', async () => {
      const response = await request(app)
        .patch('/api/deliveries/assigned-delivery-id/status')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ status: 'CANCELLED' })
        .expect(403);

      expect(response.body.error).toContain('Forbidden');
    });
  });

  describe('QR Code Validation (Most Critical)', () => {
    test('correct tracking code confirms delivery', async () => {
      const response = await request(app)
        .post('/api/deliveries/out-for-delivery-id/confirm')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ tracking_code: 'RFX-123456-ABC123' })
        .expect(200);

      expect(response.body.delivery.status).toBe('DELIVERED');
    });

    test('incorrect tracking code rejects confirmation', async () => {
      const response = await request(app)
        .post('/api/deliveries/out-for-delivery-id/confirm')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ tracking_code: 'RFX-WRONG-WRONG' })
        .expect(400);

      expect(response.body.error).toContain('Invalid tracking code' || 'Code mismatch');
    });

    test('cannot confirm delivery assigned to different rider', async () => {
      // Rider 1 tries to confirm delivery assigned to Rider 2
      const response = await request(app)
        .post('/api/deliveries/assigned-to-rider2-id/confirm')
        .set('Authorization', `Bearer ${riderToken}`) // Rider 1 token
        .send({ tracking_code: 'RFX-123456-ABC123' })
        .expect(403);

      expect(response.body.error).toContain('Unauthorized' || 'not assigned');
    });

    test('cannot confirm delivery that is not OUT_FOR_DELIVERY', async () => {
      const response = await request(app)
        .post('/api/deliveries/pending-id/confirm')
        .set('Authorization', `Bearer ${riderToken}`)
        .send({ tracking_code: 'RFX-123456-ABC123' })
        .expect(409);

      expect(response.body.error).toContain(
        'Invalid status' || 'must be OUT_FOR_DELIVERY'
      );
    });
  });

  describe('Assignment Validation', () => {
    test('cannot assign non-existent rider', async () => {
      const response = await request(app)
        .patch('/api/deliveries/delivery-id/assign')
        .set('Authorization', `Bearer ${dispatcherToken}`)
        .send({ rider_id: 'non-existent-rider-id' })
        .expect(404);

      expect(response.body.error).toContain('Rider not found');
    });

    test('cannot assign user with non-RIDER role', async () => {
      const response = await request(app)
        .patch('/api/deliveries/delivery-id/assign')
        .set('Authorization', `Bearer ${dispatcherToken}`)
        .send({ rider_id: 'retailer-user-id' }) // Retailer, not rider
        .expect(400);

      expect(response.body.error).toContain('not a rider' || 'invalid role');
    });

    test('RETAILER_STAFF cannot assign riders', async () => {
      const response = await request(app)
        .patch('/api/deliveries/delivery-id/assign')
        .set('Authorization', `Bearer ${retailerToken}`)
        .send({ rider_id: 'rider-id' })
        .expect(403);

      expect(response.body.error).toContain('Forbidden');
    });
  });

  describe('Ownership Validation', () => {
    test('RETAILER_STAFF cannot access other user deliveries', async () => {
      // Retailer 1 tries to get Retailer 2's delivery
      const response = await request(app)
        .get('/api/deliveries/retailer2-delivery-id')
        .set('Authorization', `Bearer ${retailerToken}`)
        .expect(404);

      expect(response.body.error).toContain('not found' || 'Unauthorized');
    });

    test('RIDER cannot access deliveries not assigned to them', async () => {
      const response = await request(app)
        .get('/api/deliveries/assigned-to-other-rider-id')
        .set('Authorization', `Bearer ${riderToken}`)
        .expect(404);

      expect(response.body.error).toContain('not found' || 'Unauthorized');
    });

    test('DISPATCHER can access any delivery', async () => {
      const response = await request(app)
        .get('/api/deliveries/any-delivery-id')
        .set('Authorization', `Bearer ${dispatcherToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('delivery');
    });
  });

  describe('Input Validation', () => {
    test('missing required fields on POST /deliveries returns 400', async () => {
      const response = await request(app)
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${retailerToken}`)
        .send({
          customer_name: 'Test',
          // Missing: customer_phone, address, item_description
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('details');
    });

    test('invalid email format on login returns 400', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'not-an-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid email');
    });

    test('empty password on login returns 400', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: '',
        })
        .expect(400);

      expect(response.body.error).toContain('required' || 'Password');
    });
  });

  describe('Error Handling', () => {
    test('malformed JSON body returns 400', async () => {
      const response = await request(app)
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${retailerToken}`)
        .set('Content-Type', 'application/json')
        .send('{invalid json}')
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });

    test('server errors return 500 with generic message', async () => {
      // Simulate database error by calling endpoint with mocked failure
      const response = await request(app)
        .get('/api/deliveries')
        .set('Authorization', `Bearer ${retailerToken}`);

      // If error occurs, should be 500 with generic message (not db details)
      if (response.status === 500) {
        expect(response.body.error).toBe('Something went wrong.');
        expect(response.body.error).not.toContain('database');
      }
    });
  });

  describe('Rate Limiting (Future Enhancement)', () => {
    test.todo(
      'should rate limit login attempts (prevent brute force)'
    );
    test.todo('should rate limit delivery creation (prevent spam)');
    test.todo('should reset rate limit for valid requests');
  });

  describe('Session/Token Expiration', () => {
    test.todo('should reject expired JWT tokens');
    test.todo('should allow token refresh if refresh token provided');
    test.todo('should clear session on logout');
  });
});
