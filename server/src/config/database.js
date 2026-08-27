const { Pool } = require('pg');
const env = require('./env');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let pool = null;
let isPgConnected = false;

// Memory store fallback if PostgreSQL is unavailable locally
const memoryDb = {
  users: [],
  commodities: [],
  mandis: [],
  mandi_prices: [],
  lots: [],
  buyer_requirements: [],
  offers: [],
  orders: [],
  payments: [],
  storage_facilities: [],
  transport_rates: [],
  buyer_ratings: [],
  platform_config: {},
  audit_logs: []
};

// Seed in-memory database with standard demo records
function initMemorySeed() {
  const hashedPassword = bcrypt.hashSync('Password@123', 10);

  memoryDb.platform_config = {
    buyer_matching_weights: {
      price: 0.40,
      distance: 0.20,
      quantity_match: 0.15,
      quality_match: 0.10,
      payment_reliability: 0.10,
      delivery_compatibility: 0.05
    },
    mandi_commission_default: 2.5,
    platform_info: {
      name: "KrishiLink AI",
      version: "1.0.0-sih-prototype",
      is_demo_mode: true,
      disclaimer_hi: "⚠️ प्रदर्शन डेटा — Demo Data: यह वास्तविक सरकारी डेटा नहीं है",
      disclaimer_en: "⚠️ Demonstration Data: This is simulated data for prototype testing"
    }
  };

  memoryDb.users = [
    {
      id: 'a0000000-0000-0000-0000-000000000001',
      phone: '9876543210',
      name: 'रामप्रसाद पटेल (Ramprasad Patel)',
      role: 'farmer',
      password_hash: hashedPassword,
      village: 'बैरसिया (Berasia)',
      district: 'भोपाल (Bhopal)',
      state: 'Madhya Pradesh',
      latitude: 23.6341,
      longitude: 77.4338,
      land_area_acres: 4.5,
      preferred_lang: 'hi',
      is_active: true,
      created_at: new Date()
    },
    {
      id: 'a0000000-0000-0000-0000-000000000002',
      phone: '9876543211',
      name: 'शर्मा ट्रेडर्स (Sharma Traders)',
      role: 'buyer',
      password_hash: hashedPassword,
      business_name: 'शर्मा एग्रो ट्रेडर्स प्रा. लि.',
      buyer_type: 'trader',
      is_verified: true,
      district: 'इंदौर (Indore)',
      state: 'Madhya Pradesh',
      latitude: 22.7196,
      longitude: 75.8577,
      preferred_lang: 'hi',
      is_active: true,
      created_at: new Date()
    },
    {
      id: 'a0000000-0000-0000-0000-000000000003',
      phone: '9876543212',
      name: 'किसान उत्पादक संघ (Kisan FPO)',
      role: 'fpo',
      password_hash: hashedPassword,
      village: 'सीहोर (Sehore)',
      district: 'सीहोर (Sehore)',
      state: 'Madhya Pradesh',
      business_name: 'सीहोर किसान प्रोड्यूसर कंपनी',
      latitude: 23.2033,
      longitude: 77.0844,
      preferred_lang: 'hi',
      is_active: true,
      created_at: new Date()
    },
    {
      id: 'a0000000-0000-0000-0000-000000000000',
      phone: '9876543200',
      name: 'सिस्टम एडमिन (Platform Admin)',
      role: 'admin',
      password_hash: hashedPassword,
      district: 'नई दिल्ली (New Delhi)',
      state: 'Delhi',
      latitude: 28.6139,
      longitude: 77.2090,
      business_name: 'KrishiLink National Operations',
      preferred_lang: 'hi',
      is_active: true,
      created_at: new Date()
    },
    {
      id: 'a0000000-0000-0000-0000-000000000004',
      phone: '9876543213',
      name: 'अग्रवाल फूड प्रोसेसर (Agrawal Processors)',
      role: 'buyer',
      password_hash: hashedPassword,
      business_name: 'अग्रवाल फ्लोर मिल्स',
      buyer_type: 'processor',
      is_verified: true,
      district: 'उज्जैन (Ujjain)',
      state: 'Madhya Pradesh',
      latitude: 23.1765,
      longitude: 75.7885,
      preferred_lang: 'hi',
      is_active: true,
      created_at: new Date()
    }
  ];

  memoryDb.commodities = [
    { id: 'b0000000-0000-0000-0000-000000000001', name_hi: 'गेहूं', name_en: 'Wheat', category: 'grain', unit: 'quintal', icon: '🌾', is_active: true },
    { id: 'b0000000-0000-0000-0000-000000000002', name_hi: 'धान (चावल)', name_en: 'Paddy (Rice)', category: 'grain', unit: 'quintal', icon: '🌾', is_active: true },
    { id: 'b0000000-0000-0000-0000-000000000003', name_hi: 'मक्का', name_en: 'Maize', category: 'grain', unit: 'quintal', icon: '🌽', is_active: true },
    { id: 'b0000000-0000-0000-0000-000000000004', name_hi: 'सोयाबीन', name_en: 'Soybean', category: 'oilseed', unit: 'quintal', icon: '🌱', is_active: true },
    { id: 'b0000000-0000-0000-0000-000000000005', name_hi: 'सरसों', name_en: 'Mustard', category: 'oilseed', unit: 'quintal', icon: '🌼', is_active: true },
    { id: 'b0000000-0000-0000-0000-000000000006', name_hi: 'चना', name_en: 'Chickpea (Gram)', category: 'pulse', unit: 'quintal', icon: '🫘', is_active: true },
    { id: 'b0000000-0000-0000-0000-000000000007', name_hi: 'मूंग दाल', name_en: 'Moong Dal', category: 'pulse', unit: 'quintal', icon: '🫘', is_active: true },
    { id: 'b0000000-0000-0000-0000-000000000008', name_hi: 'अरहर (तुअर)', name_en: 'Tur (Pigeon Pea)', category: 'pulse', unit: 'quintal', icon: '🫘', is_active: true },
    { id: 'b0000000-0000-0000-0000-000000000009', name_hi: 'आलू', name_en: 'Potato', category: 'vegetable', unit: 'quintal', icon: '🥔', is_active: true },
    { id: 'b0000000-0000-0000-0000-000000000010', name_hi: 'प्याज', name_en: 'Onion', category: 'vegetable', unit: 'quintal', icon: '🧅', is_active: true },
    { id: 'b0000000-0000-0000-0000-000000000011', name_hi: 'टमाटर', name_en: 'Tomato', category: 'vegetable', unit: 'quintal', icon: '🍅', is_active: true },
    { id: 'b0000000-0000-0000-0000-000000000012', name_hi: 'लहसुन', name_en: 'Garlic', category: 'spice', unit: 'quintal', icon: '🧄', is_active: true },
    { id: 'b0000000-0000-0000-0000-000000000013', name_hi: 'कपास', name_en: 'Cotton', category: 'cash_crop', unit: 'quintal', icon: '☁️', is_active: true },
    { id: 'b0000000-0000-0000-0000-000000000014', name_hi: 'धनिया', name_en: 'Coriander', category: 'spice', unit: 'quintal', icon: '🌿', is_active: true },
    { id: 'b0000000-0000-0000-0000-000000000015', name_hi: 'गन्ना', name_en: 'Sugarcane', category: 'cash_crop', unit: 'quintal', icon: '🎋', is_active: true }
  ];

  memoryDb.mandis = [
    { id: 'c0000000-0000-0000-0000-000000000001', name_hi: 'भोपाल (करौंद) मंडी', name_en: 'Bhopal (Karond) APMC', district: 'भोपाल (Bhopal)', state: 'Madhya Pradesh', latitude: 23.2878, longitude: 77.4042, commission_rate: 2.0, is_active: true },
    { id: 'c0000000-0000-0000-0000-000000000002', name_hi: 'सीहोर कृषि उपज मंडी', name_en: 'Sehore APMC Mandi', district: 'सीहोर (Sehore)', state: 'Madhya Pradesh', latitude: 23.2033, longitude: 77.0844, commission_rate: 2.0, is_active: true },
    { id: 'c0000000-0000-0000-0000-000000000003', name_hi: 'इंदौर (चोइथराम) मंडी', name_en: 'Indore (Choithram) APMC', district: 'इंदौर (Indore)', state: 'Madhya Pradesh', latitude: 22.6841, longitude: 75.8396, commission_rate: 2.5, is_active: true },
    { id: 'c0000000-0000-0000-0000-000000000004', name_hi: 'उज्जैन मंडी', name_en: 'Ujjain APMC Mandi', district: 'उज्जैन (Ujjain)', state: 'Madhya Pradesh', latitude: 23.1765, longitude: 75.7885, commission_rate: 2.0, is_active: true },
    { id: 'c0000000-0000-0000-0000-000000000005', name_hi: 'जबलपुर (कृषि उपज) मंडी', name_en: 'Jabalpur APMC Mandi', district: 'जबलपुर (Jabalpur)', state: 'Madhya Pradesh', latitude: 23.1815, longitude: 79.9864, commission_rate: 2.0, is_active: true },
    { id: 'c0000000-0000-0000-0000-000000000006', name_hi: 'कोटा भामाशाह मंडी', name_en: 'Kota Bhamashah APMC', district: 'कोटा (Kota)', state: 'Rajasthan', latitude: 25.1481, longitude: 75.8752, commission_rate: 2.2, is_active: true },
    { id: 'c0000000-0000-0000-0000-000000000007', name_hi: 'जयपुर (मुहाना) मंडी', name_en: 'Jaipur (Muhana) APMC', district: 'जयपुर (Jaipur)', state: 'Rajasthan', latitude: 26.8123, longitude: 75.7314, commission_rate: 2.5, is_active: true },
    { id: 'c0000000-0000-0000-0000-000000000008', name_hi: 'जोधपुर मंडी', name_en: 'Jodhpur APMC Mandi', district: 'जोधपुर (Jodhpur)', state: 'Rajasthan', latitude: 26.2389, longitude: 73.0243, commission_rate: 2.0, is_active: true },
    { id: 'c0000000-0000-0000-0000-000000000009', name_hi: 'आगरा मंडी', name_en: 'Agra APMC Mandi', district: 'आगरा (Agra)', state: 'Uttar Pradesh', latitude: 27.1767, longitude: 78.0081, commission_rate: 2.5, is_active: true },
    { id: 'c0000000-0000-0000-0000-000000000010', name_hi: 'कानपुर मंडी', name_en: 'Kanpur APMC Mandi', district: 'कानपुर (Kanpur)', state: 'Uttar Pradesh', latitude: 26.4499, longitude: 80.3319, commission_rate: 2.5, is_active: true },
    { id: 'c0000000-0000-0000-0000-000000000011', name_hi: 'लखनऊ (नवीन) मंडी', name_en: 'Lucknow Naveen Mandi', district: 'लखनऊ (Lucknow)', state: 'Uttar Pradesh', latitude: 26.8467, longitude: 80.9462, commission_rate: 2.5, is_active: true },
    { id: 'c0000000-0000-0000-0000-000000000012', name_hi: 'खन्ना एशिया मंडी', name_en: 'Khanna Asia APMC', district: 'लुधियाना (Ludhiana)', state: 'Punjab', latitude: 30.7027, longitude: 76.2205, commission_rate: 2.0, is_active: true },
    { id: 'c0000000-0000-0000-0000-000000000013', name_hi: 'करनाल मंडी', name_en: 'Karnal APMC Mandi', district: 'करनाल (Karnal)', state: 'Haryana', latitude: 29.6857, longitude: 76.9905, commission_rate: 2.0, is_active: true },
    { id: 'c0000000-0000-0000-0000-000000000014', name_hi: 'नासिक (लासलगांव) मंडी', name_en: 'Lasalgaon Onion APMC', district: 'नासिक (Nashik)', state: 'Maharashtra', latitude: 20.1472, longitude: 74.2272, commission_rate: 3.0, is_active: true },
    { id: 'c0000000-0000-0000-0000-000000000015', name_hi: 'अहमदनगर मंडी', name_en: 'Ahmednagar APMC Mandi', district: 'अहमदनगर (Ahmednagar)', state: 'Maharashtra', latitude: 19.0952, longitude: 74.7480, commission_rate: 2.5, is_active: true }
  ];

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  memoryDb.mandi_prices = [
    // Wheat
    { id: 'mp-01', mandi_id: 'c0000000-0000-0000-0000-000000000001', commodity_id: 'b0000000-0000-0000-0000-000000000001', price_date: today, min_price: 2480, max_price: 2620, modal_price: 2550, previous_modal: 2510, arrivals_tonnes: 145.0, unit: 'quintal', is_demo_data: true },
    { id: 'mp-02', mandi_id: 'c0000000-0000-0000-0000-000000000002', commodity_id: 'b0000000-0000-0000-0000-000000000001', price_date: today, min_price: 2350, max_price: 2450, modal_price: 2400, previous_modal: 2410, arrivals_tonnes: 180.0, unit: 'quintal', is_demo_data: true },
    { id: 'mp-03', mandi_id: 'c0000000-0000-0000-0000-000000000003', commodity_id: 'b0000000-0000-0000-0000-000000000001', price_date: today, min_price: 2600, max_price: 2780, modal_price: 2700, previous_modal: 2650, arrivals_tonnes: 320.0, unit: 'quintal', is_demo_data: true },
    { id: 'mp-04', mandi_id: 'c0000000-0000-0000-0000-000000000004', commodity_id: 'b0000000-0000-0000-0000-000000000001', price_date: today, min_price: 2500, max_price: 2650, modal_price: 2580, previous_modal: 2560, arrivals_tonnes: 190.0, unit: 'quintal', is_demo_data: true },
    { id: 'mp-05', mandi_id: 'c0000000-0000-0000-0000-000000000005', commodity_id: 'b0000000-0000-0000-0000-000000000001', price_date: today, min_price: 2320, max_price: 2480, modal_price: 2420, previous_modal: 2420, arrivals_tonnes: 210.0, unit: 'quintal', is_demo_data: true },
    { id: 'mp-06', mandi_id: 'c0000000-0000-0000-0000-000000000006', commodity_id: 'b0000000-0000-0000-0000-000000000001', price_date: today, min_price: 2550, max_price: 2690, modal_price: 2620, previous_modal: 2590, arrivals_tonnes: 240.0, unit: 'quintal', is_demo_data: true },
    { id: 'mp-07', mandi_id: 'c0000000-0000-0000-0000-000000000012', commodity_id: 'b0000000-0000-0000-0000-000000000001', price_date: today, min_price: 2650, max_price: 2820, modal_price: 2750, previous_modal: 2720, arrivals_tonnes: 480.0, unit: 'quintal', is_demo_data: true },

    // Soybean
    { id: 'mp-08', mandi_id: 'c0000000-0000-0000-0000-000000000001', commodity_id: 'b0000000-0000-0000-0000-000000000004', price_date: today, min_price: 4450, max_price: 4750, modal_price: 4620, previous_modal: 4580, arrivals_tonnes: 120.0, unit: 'quintal', is_demo_data: true },
    { id: 'mp-09', mandi_id: 'c0000000-0000-0000-0000-000000000003', commodity_id: 'b0000000-0000-0000-0000-000000000004', price_date: today, min_price: 4600, max_price: 4900, modal_price: 4780, previous_modal: 4700, arrivals_tonnes: 290.0, unit: 'quintal', is_demo_data: true },
    
    // Mustard
    { id: 'mp-10', mandi_id: 'c0000000-0000-0000-0000-000000000006', commodity_id: 'b0000000-0000-0000-0000-000000000005', price_date: today, min_price: 5200, max_price: 5600, modal_price: 5450, previous_modal: 5400, arrivals_tonnes: 230.0, unit: 'quintal', is_demo_data: true },
    { id: 'mp-11', mandi_id: 'c0000000-0000-0000-0000-000000000007', commodity_id: 'b0000000-0000-0000-0000-000000000005', price_date: today, min_price: 5300, max_price: 5750, modal_price: 5580, previous_modal: 5520, arrivals_tonnes: 310.0, unit: 'quintal', is_demo_data: true },

    // Chana
    { id: 'mp-12', mandi_id: 'c0000000-0000-0000-0000-000000000002', commodity_id: 'b0000000-0000-0000-0000-000000000006', price_date: today, min_price: 5800, max_price: 6200, modal_price: 6050, previous_modal: 6000, arrivals_tonnes: 95.0, unit: 'quintal', is_demo_data: true },

    // Onion
    { id: 'mp-13', mandi_id: 'c0000000-0000-0000-0000-000000000014', commodity_id: 'b0000000-0000-0000-0000-000000000010', price_date: today, min_price: 1800, max_price: 2400, modal_price: 2150, previous_modal: 2200, arrivals_tonnes: 650.0, unit: 'quintal', is_demo_data: true },
    { id: 'mp-14', mandi_id: 'c0000000-0000-0000-0000-000000000001', commodity_id: 'b0000000-0000-0000-0000-000000000010', price_date: today, min_price: 2000, max_price: 2600, modal_price: 2350, previous_modal: 2300, arrivals_tonnes: 180.0, unit: 'quintal', is_demo_data: true },

    // Tomato
    { id: 'mp-15', mandi_id: 'c0000000-0000-0000-0000-000000000001', commodity_id: 'b0000000-0000-0000-0000-000000000011', price_date: today, min_price: 1400, max_price: 2100, modal_price: 1750, previous_modal: 1700, arrivals_tonnes: 220.0, unit: 'quintal', is_demo_data: true }
  ];

  memoryDb.storage_facilities = [
    {
      id: 's0000000-0000-0000-0000-000000000001',
      name_hi: 'बैरसिया केंद्रीय कृषि वेयरहाउस',
      name_en: 'Berasia Central Agri Warehouse',
      facility_type: 'warehouse',
      district: 'भोपाल (Bhopal)',
      state: 'Madhya Pradesh',
      latitude: 23.6341,
      longitude: 77.4338,
      capacity_quintal: 10000,
      daily_rate_per_quintal: 0.40,
      commodities_accepted: ['b0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004'],
      is_active: true,
      is_demo_data: true
    },
    {
      id: 's0000000-0000-0000-0000-000000000002',
      name_hi: 'भोपाल कोल्ड स्टोरेज व एग्रो लॉजिस्टिक्स',
      name_en: 'Bhopal Cold Storage & Logistics',
      facility_type: 'cold_storage',
      district: 'भोपाल (Bhopal)',
      state: 'Madhya Pradesh',
      latitude: 23.2878,
      longitude: 77.4042,
      capacity_quintal: 5000,
      daily_rate_per_quintal: 0.85,
      commodities_accepted: ['b0000000-0000-0000-0000-000000000009', 'b0000000-0000-0000-0000-000000000010', 'b0000000-0000-0000-0000-000000000011'],
      is_active: true,
      is_demo_data: true
    }
  ];

  memoryDb.transport_rates = [
    {
      id: 't0000000-0000-0000-0000-000000000001',
      vehicle_type: 'medium_truck',
      rate_per_km_per_quintal: 0.35,
      loading_rate_per_quintal: 8.0,
      unloading_rate_per_quintal: 8.0,
      max_capacity_quintal: 100,
      region: 'default',
      is_active: true
    }
  ];
}

initMemorySeed();

// Attempt PostgreSQL Connection
async function initDatabase() {
  try {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      connectionTimeoutMillis: 2000
    });

    const client = await pool.connect();
    isPgConnected = true;
    console.log('✅ Connected to PostgreSQL database successfully.');
    client.release();
  } catch (err) {
    isPgConnected = false;
    console.log('ℹ️  PostgreSQL not directly reachable on 5432. Active fallback: Embedded demo repository loaded.');
  }
}

// Universal Query Interface supporting both PG and Memory Store
async function query(text, params = []) {
  if (isPgConnected && pool) {
    return pool.query(text, params);
  }
  // Memory fallback query parser is handled at Model level
  return { rows: [] };
}

module.exports = {
  query,
  pool,
  isPgConnected: () => isPgConnected,
  initDatabase,
  memoryDb
};
