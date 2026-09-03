/**
 * Database Seed Script (D2-13)
 * 
 * Creates demo data for testing and QA:
 * - 1 Retailer Staff user (creates deliveries)
 * - 1 Dispatcher user (assigns riders, manages statuses)
 * - 2 Rider users (deliver packages, scan QR codes)
 * - 5 Sample deliveries in various states
 * 
 * Usage:
 *   node db/seed.js
 * 
 * Requirements:
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env
 *   - Database tables must already exist (001, 002, 003 migrations applied)
 * 
 * Note:
 *   - This script creates real Supabase auth users via signUp
 *   - Demo passwords are in console output only (save them locally if needed)
 *   - For production, use Supabase auth management UI or invite links
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    'Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env'
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Demo data
const DEMO_USERS = [
  {
    email: 'retailer@demo.com',
    password: 'RetailerDemo123!',
    name: 'Alice Retailer',
    phone: '+1-555-1001',
    role: 'RETAILER_STAFF',
  },
  {
    email: 'dispatcher@demo.com',
    password: 'DispatcherDemo123!',
    name: 'Bob Dispatcher',
    phone: '+1-555-2001',
    role: 'DISPATCHER',
  },
  {
    email: 'rider1@demo.com',
    password: 'Rider1Demo123!',
    name: 'Charlie Rider',
    phone: '+1-555-3001',
    role: 'RIDER',
  },
  {
    email: 'rider2@demo.com',
    password: 'Rider2Demo123!',
    name: 'Diana Rider',
    phone: '+1-555-3002',
    role: 'RIDER',
  },
];

async function createAuthUser(email, password) {
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (error) {
    throw new Error(`Failed to create auth user ${email}: ${error.message}`);
  }

  return data.user.id;
}

async function createUserProfile(userId, name, email, phone, role) {
  const { data, error } = await supabase.from('users').insert([
    {
      id: userId,
      name,
      email,
      phone,
      role,
    },
  ]);

  if (error) {
    throw new Error(
      `Failed to create user profile for ${email}: ${error.message}`
    );
  }

  return data;
}

function generateTrackingCode() {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `RFX-${timestamp}-${random}`;
}

async function createDeliveries(retailerId, riderId1, riderId2) {
  const deliveries = [
    {
      tracking_code: generateTrackingCode(),
      customer_name: 'John Smith',
      customer_phone: '+1-555-5001',
      address: '123 Main St, Apt 4B, New York, NY 10001',
      item_description: 'Electronics - iPhone 15 Case',
      status: 'DELIVERED',
      created_by: retailerId,
      assigned_rider_id: riderId1,
      delivered_at: new Date().toISOString(),
    },
    {
      tracking_code: generateTrackingCode(),
      customer_name: 'Jane Doe',
      customer_phone: '+1-555-5002',
      address: '456 Oak Ave, Brooklyn, NY 11201',
      item_description: 'Books - Programming Fundamentals',
      status: 'OUT_FOR_DELIVERY',
      created_by: retailerId,
      assigned_rider_id: riderId1,
    },
    {
      tracking_code: generateTrackingCode(),
      customer_name: 'Bob Johnson',
      customer_phone: '+1-555-5003',
      address: '789 Pine Rd, Queens, NY 11354',
      item_description: 'Clothing - Winter Jacket',
      status: 'PICKED_UP',
      created_by: retailerId,
      assigned_rider_id: riderId2,
    },
    {
      tracking_code: generateTrackingCode(),
      customer_name: 'Carol White',
      customer_phone: '+1-555-5004',
      address: '321 Elm St, Bronx, NY 10451',
      item_description: 'Home - Smart Speaker',
      status: 'ASSIGNED',
      created_by: retailerId,
      assigned_rider_id: riderId2,
    },
    {
      tracking_code: generateTrackingCode(),
      customer_name: 'David Brown',
      customer_phone: '+1-555-5005',
      address: '654 Maple Dr, Staten Island, NY 10301',
      item_description: 'Sports - Running Shoes',
      status: 'PENDING',
      created_by: retailerId,
      assigned_rider_id: null,
    },
  ];

  const { data, error } = await supabase
    .from('deliveries')
    .insert(deliveries);

  if (error) {
    throw new Error(`Failed to create deliveries: ${error.message}`);
  }

  return data;
}

async function recordEvents(deliveries, users) {
  const retailerId = users.find((u) => u.role === 'RETAILER_STAFF').id;
  const dispatcherId = users.find((u) => u.role === 'DISPATCHER').id;

  // For each delivery, create the standard event trail
  const allEvents = [];

  for (const delivery of deliveries) {
    // CREATED event (by retailer)
    allEvents.push({
      delivery_id: delivery.id,
      event_type: 'CREATED',
      performed_by: retailerId,
      metadata: { tracking_code: delivery.tracking_code },
    });

    // Status-specific events based on current status
    if (
      delivery.status === 'ASSIGNED' ||
      delivery.status === 'PICKED_UP' ||
      delivery.status === 'OUT_FOR_DELIVERY' ||
      delivery.status === 'DELIVERED'
    ) {
      allEvents.push({
        delivery_id: delivery.id,
        event_type: 'ASSIGNED',
        performed_by: dispatcherId,
        metadata: { assigned_rider_id: delivery.assigned_rider_id },
      });
    }

    if (
      delivery.status === 'PICKED_UP' ||
      delivery.status === 'OUT_FOR_DELIVERY' ||
      delivery.status === 'DELIVERED'
    ) {
      allEvents.push({
        delivery_id: delivery.id,
        event_type: 'PICKED_UP',
        performed_by: delivery.assigned_rider_id,
        metadata: {},
      });
    }

    if (delivery.status === 'OUT_FOR_DELIVERY' || delivery.status === 'DELIVERED') {
      allEvents.push({
        delivery_id: delivery.id,
        event_type: 'OUT_FOR_DELIVERY',
        performed_by: delivery.assigned_rider_id,
        metadata: {},
      });
    }

    if (delivery.status === 'DELIVERED') {
      allEvents.push({
        delivery_id: delivery.id,
        event_type: 'DELIVERED',
        performed_by: delivery.assigned_rider_id,
        metadata: { scanned_code: delivery.tracking_code },
      });
    }
  }

  if (allEvents.length > 0) {
    const { error } = await supabase.from('delivery_events').insert(allEvents);

    if (error) {
      throw new Error(`Failed to create events: ${error.message}`);
    }
  }
}

async function main() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Step 1: Create auth users and profiles
    console.log('📝 Creating users...');
    const createdUsers = [];

    for (const user of DEMO_USERS) {
      const userId = await createAuthUser(user.email, user.password);
      await createUserProfile(userId, user.name, user.email, user.phone, user.role);
      createdUsers.push({ id: userId, ...user });
      console.log(`   ✅ ${user.role}: ${user.email}`);
    }

    // Step 2: Create demo deliveries
    console.log('\n📦 Creating sample deliveries...');
    const retailerId = createdUsers.find((u) => u.role === 'RETAILER_STAFF').id;
    const riderId1 = createdUsers.find((u) => u.role === 'RIDER' && u.email === 'rider1@demo.com').id;
    const riderId2 = createdUsers.find((u) => u.role === 'RIDER' && u.email === 'rider2@demo.com').id;

    const deliveries = await createDeliveries(retailerId, riderId1, riderId2);
    console.log(`   ✅ Created ${deliveries.length} sample deliveries`);

    // Step 3: Record event trail for deliveries
    console.log('\n📋 Recording event history...');
    await recordEvents(deliveries, createdUsers);
    console.log(`   ✅ Event trail created for all deliveries`);

    // Step 4: Print summary
    console.log('\n✨ Seed complete!\n');
    console.log('📌 Demo Credentials:');
    createdUsers.forEach((user) => {
      console.log(`   ${user.role.padEnd(15)} | ${user.email} | ${user.password}`);
    });
    console.log('\n💡 Tip: Save these credentials locally. You can also reset via Supabase auth dashboard.');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    process.exit(1);
  }
}

main();
