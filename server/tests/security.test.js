const request = require('supertest');

const mockState = {
  users: [
    { id: 'retailer-1', name: 'Retailer One', email: 'retailer@example.com', phone: '+254700000001', role: 'RETAILER_STAFF' },
    { id: 'retailer-2', name: 'Retailer Two', email: 'retailer2@example.com', phone: '+254700000002', role: 'RETAILER_STAFF' },
    { id: 'dispatcher-1', name: 'Dispatcher One', email: 'dispatcher@example.com', phone: '+254700000003', role: 'DISPATCHER' },
    { id: 'rider-1', name: 'Rider One', email: 'rider@example.com', phone: '+254700000004', role: 'RIDER' },
    { id: 'rider-2', name: 'Rider Two', email: 'rider2@example.com', phone: '+254700000005', role: 'RIDER' },
  ],
  deliveries: [],
  events: [],
  authUsers: {
    'retailer-token': 'retailer-1',
    'retailer-2-token': 'retailer-2',
    'dispatcher-token': 'dispatcher-1',
    'rider-token': 'rider-1',
    'rider-2-token': 'rider-2',
  },
  nextId: 1,
};

function clone(value) {
  return value === undefined ? value : JSON.parse(JSON.stringify(value));
}

function createQuery(table) {
  const rows = table === 'delivery_events' ? mockState.events : mockState[table];
  const query = {
    operation: 'select',
    values: null,
    filters: [],
    orderBy: null,
    singleResult: false,
    maybeResult: false,
    select() {
      return this;
    },
    insert(values) {
      this.operation = 'insert';
      this.values = Array.isArray(values) ? values : [values];
      return this;
    },
    update(values) {
      this.operation = 'update';
      this.values = values;
      return this;
    },
    eq(field, value) {
      this.filters.push({ field, value });
      return this;
    },
    order(field, options) {
      this.orderBy = { field, ascending: options?.ascending !== false };
      return this;
    },
    single() {
      this.singleResult = true;
      return this;
    },
    maybeSingle() {
      this.singleResult = true;
      this.maybeResult = true;
      return this;
    },
    then(resolve, reject) {
      return this.execute().then(resolve, reject);
    },
    async execute() {
      let result;

      if (this.operation === 'insert') {
        result = this.values.map((value) => ({
          ...value,
          id: value.id || `${table}-${mockState.nextId++}`,
          created_at: value.created_at || new Date().toISOString(),
        }));
        rows.push(...result);
      } else {
        result = rows.filter((row) =>
          this.filters.every(({ field, value }) => row[field] === value)
        );
        if (this.operation === 'update') {
          result.forEach((row) => Object.assign(row, this.values));
        }
      }

      if (this.orderBy) {
        result.sort((left, right) => {
          const leftValue = new Date(left[this.orderBy.field]).getTime();
          const rightValue = new Date(right[this.orderBy.field]).getTime();
          return this.orderBy.ascending ? leftValue - rightValue : rightValue - leftValue;
        });
      }

      if (this.singleResult) {
        if (result.length === 0) {
          return { data: null, error: this.maybeResult ? null : { message: 'Not found' } };
        }
        return { data: clone(result[0]), error: null };
      }

      return { data: clone(result), error: null };
    },
  };

  return query;
}

const mockSupabase = {
  auth: {
    async getUser(token) {
      const userId = mockState.authUsers[token];
      if (!userId) return { data: { user: null }, error: { message: 'Invalid token' } };
      return { data: { user: { id: userId } }, error: null };
    },
    async signInWithPassword({ email, password }) {
      const user = mockState.users.find((candidate) => candidate.email === email);
      if (!user || password !== 'correct-password') {
        return { data: { session: null }, error: { message: 'Invalid credentials' } };
      }
      return {
        data: {
          user: { id: user.id },
          session: { access_token: Object.entries(mockState.authUsers).find(([, id]) => id === user.id)[0] },
        },
        error: null,
      };
    },
  },
  from(table) {
    return createQuery(table);
  },
};

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase),
}));

process.env.SUPABASE_URL = 'https://test.supabase.co';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'test-service-role-key';

const app = require('../app');

function auth(token) {
  return { Authorization: `Bearer ${token}` };
}

function seedDelivery(overrides = {}) {
  const delivery = {
    id: overrides.id || `delivery-${mockState.nextId++}`,
    tracking_code: overrides.tracking_code || `RFX-TEST-${mockState.nextId++}`,
    customer_name: 'Test Customer',
    customer_phone: '+254700000100',
    address: '1 Test Street, Nairobi',
    item_description: 'Test item',
    status: 'PENDING',
    created_by: 'retailer-1',
    assigned_rider_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    delivered_at: null,
    ...overrides,
  };
  mockState.deliveries.push(delivery);
  return delivery;
}

beforeEach(() => {
  mockState.deliveries.length = 0;
  mockState.events.length = 0;
  mockState.nextId = 1;
});

describe('Reflex backend security contract', () => {
  describe('authentication', () => {
    test('missing Authorization header returns 401 JSON', async () => {
      const response = await request(app).get('/api/deliveries');
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Missing or malformed Authorization header.' });
    });

    test('malformed Authorization header returns 401 JSON', async () => {
      const response = await request(app).get('/api/deliveries').set('Authorization', 'Token value');
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Missing or malformed Authorization header.' });
    });

    test('invalid token returns 401 JSON', async () => {
      const response = await request(app).get('/api/deliveries').set(auth('invalid-token'));
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'Invalid or expired token.' });
    });

    test('valid token without a profile returns 401 JSON', async () => {
      mockState.authUsers['orphan-token'] = 'missing-profile';
      const response = await request(app).get('/api/deliveries').set(auth('orphan-token'));
      expect(response.status).toBe(401);
      expect(response.body).toEqual({ error: 'No profile found for this user.' });
      delete mockState.authUsers['orphan-token'];
    });

    test('login accepts valid credentials and rejects invalid credentials', async () => {
      const success = await request(app).post('/api/auth/login').send({ email: 'rider@example.com', password: 'correct-password' });
      expect(success.status).toBe(200);
      expect(success.body).toEqual({ access_token: 'rider-token', user: expect.objectContaining({ id: 'rider-1', role: 'RIDER' }) });

      const failure = await request(app).post('/api/auth/login').send({ email: 'rider@example.com', password: 'wrong-password' });
      expect(failure.status).toBe(401);
      expect(failure.body).toEqual({ error: 'Invalid email or password.' });
    });
  });

  describe('authorization and validation', () => {
    test.each([
      ['retailer-token', 'RETAILER_STAFF'],
      ['rider-token', 'RIDER'],
    ])('%s cannot assign a delivery', async (token) => {
      const response = await request(app).patch('/api/deliveries/delivery-id/assign').set(auth(token)).send({ rider_id: 'rider-1' });
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'You do not have permission to perform this action.' });
    });

    test('dispatcher cannot perform Rider-only pickup transition', async () => {
      const delivery = seedDelivery({ status: 'ASSIGNED', assigned_rider_id: 'rider-1' });
      const response = await request(app).patch(`/api/deliveries/${delivery.id}/status`).set(auth('dispatcher-token')).send({ status: 'PICKED_UP' });
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'Only the assigned Rider can perform this transition.' });
    });

    test('non-Rider cannot confirm a delivery', async () => {
      const response = await request(app).post('/api/deliveries/any/confirm').set(auth('dispatcher-token')).send({ tracking_code: 'RFX-ANY' });
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'You do not have permission to perform this action.' });
    });

    test.each([
      [{}, ['customer_name is required', 'customer_phone is required', 'address is required', 'item_description is required']],
      [{ customer_name: '', customer_phone: '', address: '', item_description: '' }, ['customer_name is required', 'customer_phone is required', 'address is required', 'item_description is required']],
      [{ customer_name: 123, customer_phone: true, address: [], item_description: {} }, ['customer_name must be of type string', 'customer_phone must be of type string', 'address must be of type string', 'item_description must be of type string']],
    ])('rejects invalid delivery payloads with 400', async (payload, details) => {
      const response = await request(app).post('/api/deliveries').set(auth('retailer-token')).send(payload);
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Validation failed.', details });
    });

    test.each([
      ['assign', 'dispatcher-token', 'patch', '/api/deliveries/delivery-id/assign'],
      ['status', 'rider-token', 'patch', '/api/deliveries/delivery-id/status'],
      ['confirm', 'rider-token', 'post', '/api/deliveries/delivery-id/confirm'],
    ])('rejects missing %s with 400', async (_field, token, method, path) => {
      const response = await request(app)[method](path).set(auth(token)).send({});
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Validation failed.');
    });

    test('empty and whitespace-only delivery fields return 400', async () => {
      const response = await request(app).post('/api/deliveries').set(auth('retailer-token')).send({ customer_name: '  ', customer_phone: '  ', address: '  ', item_description: '  ' });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Validation failed.', details: ['customer_name is required', 'customer_phone is required', 'address is required', 'item_description is required'] });
    });
  });

  describe('creation and assignment', () => {
    test('retailer creates a pending delivery and CREATED event', async () => {
      const response = await request(app).post('/api/deliveries').set(auth('retailer-token')).send({ customer_name: 'Amina', customer_phone: '+254700000101', address: 'Moi Avenue', item_description: 'Phone' });
      expect(response.status).toBe(201);
      expect(response.body.delivery).toEqual(expect.objectContaining({ status: 'PENDING', created_by: 'retailer-1' }));
      expect(response.body.delivery.tracking_code).toMatch(/^RFX-/);
      expect(mockState.events).toEqual([expect.objectContaining({ event_type: 'CREATED', performed_by: 'retailer-1' })]);
    });

    test('dispatcher assigns a Rider and records ASSIGNED event', async () => {
      const delivery = seedDelivery();
      const response = await request(app).patch(`/api/deliveries/${delivery.id}/assign`).set(auth('dispatcher-token')).send({ rider_id: 'rider-1' });
      expect(response.status).toBe(200);
      expect(response.body.delivery).toEqual(expect.objectContaining({ status: 'ASSIGNED', assigned_rider_id: 'rider-1' }));
      expect(mockState.events).toEqual([expect.objectContaining({ event_type: 'ASSIGNED', performed_by: 'dispatcher-1' })]);
    });
  });

  describe('state machine', () => {
    test('assigned Rider can move ASSIGNED to PICKED_UP and PICKED_UP to OUT_FOR_DELIVERY', async () => {
      const delivery = seedDelivery({ status: 'ASSIGNED', assigned_rider_id: 'rider-1' });
      const pickedUp = await request(app).patch(`/api/deliveries/${delivery.id}/status`).set(auth('rider-token')).send({ status: 'PICKED_UP' });
      expect(pickedUp.status).toBe(200);
      expect(pickedUp.body.delivery.status).toBe('PICKED_UP');

      const outForDelivery = await request(app).patch(`/api/deliveries/${delivery.id}/status`).set(auth('rider-token')).send({ status: 'OUT_FOR_DELIVERY' });
      expect(outForDelivery.status).toBe(200);
      expect(outForDelivery.body.delivery.status).toBe('OUT_FOR_DELIVERY');
    });

    test('dispatcher can move ASSIGNED to CANCELLED and ASSIGNED to PENDING', async () => {
      const cancelled = seedDelivery({ id: 'cancelled', status: 'ASSIGNED', assigned_rider_id: 'rider-1' });
      const cancelResponse = await request(app).patch(`/api/deliveries/${cancelled.id}/status`).set(auth('dispatcher-token')).send({ status: 'CANCELLED' });
      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.body.delivery.status).toBe('CANCELLED');

      const pending = seedDelivery({ id: 'pending', status: 'ASSIGNED', assigned_rider_id: 'rider-1' });
      const pendingResponse = await request(app).patch(`/api/deliveries/${pending.id}/status`).set(auth('dispatcher-token')).send({ status: 'PENDING' });
      expect(pendingResponse.status).toBe(200);
      expect(pendingResponse.body.delivery.status).toBe('PENDING');
      expect(mockState.events.at(-1)).toEqual(expect.objectContaining({ event_type: 'CANCELLED' }));
    });

    test.each([
      ['PENDING', 'OUT_FOR_DELIVERY'],
      ['ASSIGNED', 'OUT_FOR_DELIVERY'],
      ['OUT_FOR_DELIVERY', 'DELIVERED'],
      ['DELIVERED', 'PENDING'],
    ])('rejects invalid transition %s to %s with 409', async (current, next) => {
      const delivery = seedDelivery({ status: current, assigned_rider_id: 'rider-1' });
      const response = await request(app).patch(`/api/deliveries/${delivery.id}/status`).set(auth('rider-token')).send({ status: next });
      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: `Cannot transition delivery from ${current} to ${next}.` });
    });
  });

  describe('confirmation and scoping', () => {
    test('nonexistent delivery returns 404', async () => {
      const response = await request(app).post('/api/deliveries/missing/confirm').set(auth('rider-token')).send({ tracking_code: 'RFX-MISSING' });
      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Delivery not found.' });
    });

    test('incorrect tracking code returns 400', async () => {
      const delivery = seedDelivery({ status: 'OUT_FOR_DELIVERY', assigned_rider_id: 'rider-1' });
      const response = await request(app).post(`/api/deliveries/${delivery.id}/confirm`).set(auth('rider-token')).send({ tracking_code: 'RFX-WRONG' });
      expect(response.status).toBe(400);
      expect(response.body).toEqual({ error: 'Scanned code does not match this delivery.' });
    });

    test('correct code with wrong Rider returns 403', async () => {
      const delivery = seedDelivery({ status: 'OUT_FOR_DELIVERY', assigned_rider_id: 'rider-2' });
      const response = await request(app).post(`/api/deliveries/${delivery.id}/confirm`).set(auth('rider-token')).send({ tracking_code: delivery.tracking_code });
      expect(response.status).toBe(403);
      expect(response.body).toEqual({ error: 'This delivery is not assigned to you.' });
    });

    test('correct code and Rider with wrong status returns 409', async () => {
      const delivery = seedDelivery({ status: 'ASSIGNED', assigned_rider_id: 'rider-1' });
      const response = await request(app).post(`/api/deliveries/${delivery.id}/confirm`).set(auth('rider-token')).send({ tracking_code: delivery.tracking_code });
      expect(response.status).toBe(409);
      expect(response.body).toEqual({ error: 'Cannot confirm a delivery with status ASSIGNED. Delivery must be OUT_FOR_DELIVERY.' });
    });

    test('assigned Rider confirms OUT_FOR_DELIVERY and records DELIVERED event', async () => {
      const delivery = seedDelivery({ status: 'OUT_FOR_DELIVERY', assigned_rider_id: 'rider-1' });
      const response = await request(app).post(`/api/deliveries/${delivery.id}/confirm`).set(auth('rider-token')).send({ tracking_code: delivery.tracking_code });
      expect(response.status).toBe(200);
      expect(response.body.delivery.status).toBe('DELIVERED');
      expect(mockState.events).toEqual([expect.objectContaining({ event_type: 'DELIVERED', performed_by: 'rider-1' })]);
    });

    test('retailer and Rider cannot access out-of-scope deliveries or events', async () => {
      const delivery = seedDelivery({ created_by: 'retailer-2', assigned_rider_id: 'rider-2' });
      const retailer = await request(app).get(`/api/deliveries/${delivery.id}`).set(auth('retailer-token'));
      const rider = await request(app).get(`/api/deliveries/${delivery.id}`).set(auth('rider-token'));
      const events = await request(app).get(`/api/deliveries/${delivery.id}/events`).set(auth('retailer-token'));
      expect(retailer.status).toBe(404);
      expect(rider.status).toBe(404);
      expect(events.status).toBe(404);
    });
  });

  test('malformed JSON returns the standard JSON error response', async () => {
    const response = await request(app).post('/api/deliveries').set(auth('retailer-token')).set('Content-Type', 'application/json').send('{invalid json}');
    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(response.body).toHaveProperty('error');
  });
});
