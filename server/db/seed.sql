-- KrishiLink AI - Comprehensive Demo Seed Data
-- Clearly marked as demo data for SIH Prototype Demonstration

-- Clean existing data
TRUNCATE TABLE audit_logs, buyer_ratings, payments, orders, offers, buyer_requirements, lots, mandi_prices, mandis, commodities, storage_facilities, transport_rates, platform_config, users CASCADE;

-- 1. PLATFORM CONFIG (Including Configurable Buyer Matching Weights)
INSERT INTO platform_config (key, value, description) VALUES
('buyer_matching_weights', '{
    "price": 0.40,
    "distance": 0.20,
    "quantity_match": 0.15,
    "quality_match": 0.10,
    "payment_reliability": 0.10,
    "delivery_compatibility": 0.05
}', 'Configurable weights for the deterministic buyer matching algorithm'),
('mandi_commission_default', '2.5', 'Default mandi commission percentage'),
('platform_info', '{
    "name": "KrishiLink AI",
    "version": "1.0.0-sih-prototype",
    "is_demo_mode": true,
    "disclaimer_hi": "⚠️ प्रदर्शन डेटा — Demo Data: यह वास्तविक सरकारी डेटा नहीं है",
    "disclaimer_en": "⚠️ Demonstration Data: This is simulated data for prototype testing"
}', 'System metadata');

-- 2. USERS (Pass: Password@123 -> $2a$10$w8T0M4j2K1uL3w7nS9bKce0k/mH9uI0yZ1w3m5b7c9e1g3i5k7m9a)
-- Using fixed UUIDs for consistent references
INSERT INTO users (id, phone, name, role, password_hash, village, district, state, latitude, longitude, land_area_acres, business_name, buyer_type, is_verified, preferred_lang) VALUES
('a0000000-0000-0000-0000-000000000001', '9876543210', 'रामप्रसाद पटेल (Ramprasad Patel)', 'farmer', '$2a$10$7Z25Hk1o.M1c7yI0E3t.reFkmvA/nZg4n2yH8oM6pG0vM7uD2W5iq', 'बैरसिया (Berasia)', 'भोपाल (Bhopal)', 'Madhya Pradesh', 23.6341000, 77.4338000, 4.5, NULL, NULL, true, 'hi'),
('a0000000-0000-0000-0000-000000000002', '9876543211', 'शर्मा ट्रेडर्स (Sharma Traders)', 'buyer', '$2a$10$7Z25Hk1o.M1c7yI0E3t.reFkmvA/nZg4n2yH8oM6pG0vM7uD2W5iq', NULL, 'इंदौर (Indore)', 'Madhya Pradesh', 22.7196000, 75.8577000, NULL, 'शर्मा एग्रो ट्रेडर्स प्रा. लि.', 'trader', true, 'hi'),
('a0000000-0000-0000-0000-000000000003', '9876543212', 'किसान उत्पादक संघ (Kisan FPO)', 'fpo', '$2a$10$7Z25Hk1o.M1c7yI0E3t.reFkmvA/nZg4n2yH8oM6pG0vM7uD2W5iq', 'सीहोर (Sehore)', 'सीहोर (Sehore)', 'Madhya Pradesh', 23.2033000, 77.0844000, NULL, 'सीहोर किसान प्रोड्यूसर कंपनी', NULL, true, 'hi'),
('a0000000-0000-0000-0000-000000000000', '9876543200', 'सिस्टम एडमिन (Platform Admin)', 'admin', '$2a$10$7Z25Hk1o.M1c7yI0E3t.reFkmvA/nZg4n2yH8oM6pG0vM7uD2W5iq', NULL, 'नई दिल्ली (New Delhi)', 'Delhi', 28.6139000, 77.2090000, NULL, 'KrishiLink National Operations', NULL, true, 'hi'),
('a0000000-0000-0000-0000-000000000004', '9876543213', 'अग्रवाल फूड प्रोसेसर (Agrawal Processors)', 'buyer', '$2a$10$7Z25Hk1o.M1c7yI0E3t.reFkmvA/nZg4n2yH8oM6pG0vM7uD2W5iq', NULL, 'उज्जैन (Ujjain)', 'Madhya Pradesh', 23.1765000, 75.7885000, NULL, 'अग्रवाल फ्लोर मिल्स', 'processor', true, 'hi'),
('a0000000-0000-0000-0000-000000000005', '9876543214', 'सुखविंदर सिंह (Sukhwinder Singh)', 'farmer', '$2a$10$7Z25Hk1o.M1c7yI0E3t.reFkmvA/nZg4n2yH8oM6pG0vM7uD2W5iq', 'खन्ना (Khanna)', 'लुधियाना (Ludhiana)', 'Punjab', 30.7027000, 76.2205000, 12.0, NULL, NULL, true, 'hi');

-- 3. COMMODITIES
INSERT INTO commodities (id, name_hi, name_en, category, unit, icon, quality_params) VALUES
('b0000000-0000-0000-0000-000000000001', 'गेहूं', 'Wheat', 'grain', 'quintal', '🌾', '[{"key": "moisture", "name_hi": "नमी (%)", "ideal": 12, "max": 14}, {"key": "foreign_matter", "name_hi": "कचरा/मिट्टी (%)", "ideal": 0.5, "max": 2}]'),
('b0000000-0000-0000-0000-000000000002', 'धान (चावल)', 'Paddy (Rice)', 'grain', 'quintal', '🌾', '[{"key": "moisture", "name_hi": "नमी (%)", "ideal": 14, "max": 17}]'),
('b0000000-0000-0000-0000-000000000003', 'मक्का', 'Maize', 'grain', 'quintal', '🌽', '[{"key": "moisture", "name_hi": "नमी (%)", "ideal": 12, "max": 15}]'),
('b0000000-0000-0000-0000-000000000004', 'सोयाबीन', 'Soybean', 'oilseed', 'quintal', '🌱', '[{"key": "oil_content", "name_hi": "तेल की मात्रा (%)", "ideal": 18, "min": 16}]'),
('b0000000-0000-0000-0000-000000000005', 'सरसों', 'Mustard', 'oilseed', 'quintal', '🌼', '[{"key": "oil_content", "name_hi": "तेल की मात्रा (%)", "ideal": 40, "min": 38}]'),
('b0000000-0000-0000-0000-000000000006', 'चना', 'Chickpea (Gram)', 'pulse', 'quintal', '🫘', '[{"key": "moisture", "name_hi": "नमी (%)", "ideal": 10, "max": 12}]'),
('b0000000-0000-0000-0000-000000000007', 'मूंग दाल', 'Moong Dal', 'pulse', 'quintal', '🫘', '[{"key": "moisture", "name_hi": "नमी (%)", "ideal": 10, "max": 12}]'),
('b0000000-0000-0000-0000-000000000008', 'अरहर (तुअर)', 'Tur (Pigeon Pea)', 'pulse', 'quintal', '🫘', '[{"key": "moisture", "name_hi": "नमी (%)", "ideal": 11, "max": 13}]'),
('b0000000-0000-0000-0000-000000000009', 'आलू', 'Potato', 'vegetable', 'quintal', '🥔', '[{"key": "size", "name_hi": "आकार (मिमी)", "ideal": 45, "min": 35}]'),
('b0000000-0000-0000-0000-000000000010', 'प्याज', 'Onion', 'vegetable', 'quintal', '🧅', '[{"key": "size", "name_hi": "आकार (मिमी)", "ideal": 50, "min": 40}]'),
('b0000000-0000-0000-0000-000000000011', 'टमाटर', 'Tomato', 'vegetable', 'quintal', '🍅', '[{"key": "firmness", "name_hi": "मजबूती/रंग", "ideal": 90, "min": 80}]'),
('b0000000-0000-0000-0000-000000000012', 'लहसुन', 'Garlic', 'spice', 'quintal', '🧄', '[{"key": "clove_size", "name_hi": "कली का आकार", "ideal": 25, "min": 20}]'),
('b0000000-0000-0000-0000-000000000013', 'कपास (कपास)', 'Cotton', 'cash_crop', 'quintal', '☁️', '[{"key": "staple_length", "name_hi": "रेशा लंबाई (मिमी)", "ideal": 29, "min": 27}]'),
('b0000000-0000-0000-0000-000000000014', 'धनिया', 'Coriander', 'spice', 'quintal', '🌿', '[{"key": "aroma_index", "name_hi": "सुगंध सूचकांक", "ideal": 95, "min": 85}]'),
('b0000000-0000-0000-0000-000000000015', 'गन्ना', 'Sugarcane', 'cash_crop', 'quintal', '🎋', '[{"key": "sugar_recovery", "name_hi": "शर्करा रिकवरी (%)", "ideal": 11, "min": 9.5}]');

-- 4. MANDIS (Realistic major Agricultural APMC Mandis)
INSERT INTO mandis (id, name_hi, name_en, district, state, latitude, longitude, commission_rate) VALUES
('c0000000-0000-0000-0000-000000000001', 'भोपाल (करौंद) मंडी', 'Bhopal (Karond) APMC', 'भोपाल (Bhopal)', 'Madhya Pradesh', 23.2878000, 77.4042000, 2.0),
('c0000000-0000-0000-0000-000000000002', 'सीहोर कृषि उपज मंडी', 'Sehore APMC Mandi', 'सीहोर (Sehore)', 'Madhya Pradesh', 23.2033000, 77.0844000, 2.0),
('c0000000-0000-0000-0000-000000000003', 'इंदौर (चोइथराम) मंडी', 'Indore (Choithram) APMC', 'इंदौर (Indore)', 'Madhya Pradesh', 22.6841000, 75.8396000, 2.5),
('c0000000-0000-0000-0000-000000000004', 'उज्जैन मंडी', 'Ujjain APMC Mandi', 'उज्जैन (Ujjain)', 'Madhya Pradesh', 23.1765000, 75.7885000, 2.0),
('c0000000-0000-0000-0000-000000000005', 'जबलपुर (कृषि उपज) मंडी', 'Jabalpur APMC Mandi', 'जबलपुर (Jabalpur)', 'Madhya Pradesh', 23.1815000, 79.9864000, 2.0),
('c0000000-0000-0000-0000-000000000006', 'कोटा भामाशाह मंडी', 'Kota Bhamashah APMC', 'कोटा (Kota)', 'Rajasthan', 25.1481000, 75.8752000, 2.2),
('c0000000-0000-0000-0000-000000000007', 'जयपुर (मुहाना) मंडी', 'Jaipur (Muhana) APMC', 'जयपुर (Jaipur)', 'Rajasthan', 26.8123000, 75.7314000, 2.5),
('c0000000-0000-0000-0000-000000000008', 'जोधपुर मंडी', 'Jodhpur APMC Mandi', 'जोधपुर (Jodhpur)', 'Rajasthan', 26.2389000, 73.0243000, 2.0),
('c0000000-0000-0000-0000-000000000009', 'आगरा मंडी', 'Agra APMC Mandi', 'आगरा (Agra)', 'Uttar Pradesh', 27.1767000, 78.0081000, 2.5),
('c0000000-0000-0000-0000-000000000010', 'कानपुर मंडी', 'Kanpur APMC Mandi', 'कानपुर (Kanpur)', 'Uttar Pradesh', 26.4499000, 80.3319000, 2.5),
('c0000000-0000-0000-0000-000000000011', 'लखनऊ (नवीन) मंडी', 'Lucknow Naveen Mandi', 'लखनऊ (Lucknow)', 'Uttar Pradesh', 26.8467000, 80.9462000, 2.5),
('c0000000-0000-0000-0000-000000000012', 'खन्ना एशिया मंडी', 'Khanna Asia APMC', 'लुधियाना (Ludhiana)', 'Punjab', 30.7027000, 76.2205000, 2.0),
('c0000000-0000-0000-0000-000000000013', 'करनाल मंडी', 'Karnal APMC Mandi', 'करनाल (Karnal)', 'Haryana', 29.6857000, 76.9905000, 2.0),
('c0000000-0000-0000-0000-000000000014', 'नासिक (लासलगांव) मंडी', 'Lasalgaon Onion APMC', 'नासिक (Nashik)', 'Maharashtra', 20.1472000, 74.2272000, 3.0),
('c0000000-0000-0000-0000-000000000015', 'अहमदनगर मंडी', 'Ahmednagar APMC Mandi', 'अहमदनगर (Ahmednagar)', 'Maharashtra', 19.0952000, 74.7480000, 2.5);

-- 5. MANDI PRICES (Demo historical and current prices)
-- Wheat Prices (b0000000-0000-0000-0000-000000000001)
INSERT INTO mandi_prices (mandi_id, commodity_id, price_date, min_price, max_price, modal_price, arrivals_tonnes, unit, is_demo_data) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', CURRENT_DATE, 2480.00, 2620.00, 2550.00, 145.0, 'quintal', true),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', CURRENT_DATE, 2350.00, 2450.00, 2400.00, 180.0, 'quintal', true),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', CURRENT_DATE, 2600.00, 2780.00, 2700.00, 320.0, 'quintal', true),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', CURRENT_DATE, 2500.00, 2650.00, 2580.00, 190.0, 'quintal', true),
('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', CURRENT_DATE, 2320.00, 2480.00, 2420.00, 210.0, 'quintal', true),
('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000001', CURRENT_DATE, 2550.00, 2690.00, 2620.00, 240.0, 'quintal', true),
('c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000001', CURRENT_DATE, 2650.00, 2820.00, 2750.00, 480.0, 'quintal', true);

-- Soybean Prices (b0000000-0000-0000-0000-000000000004)
INSERT INTO mandi_prices (mandi_id, commodity_id, price_date, min_price, max_price, modal_price, arrivals_tonnes, unit, is_demo_data) VALUES
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000004', CURRENT_DATE, 4450.00, 4750.00, 4620.00, 120.0, 'quintal', true),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004', CURRENT_DATE, 4600.00, 4900.00, 4780.00, 290.0, 'quintal', true),
('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000004', CURRENT_DATE, 4500.00, 4820.00, 4700.00, 200.0, 'quintal', true);

-- Mustard & Chana Prices
INSERT INTO mandi_prices (mandi_id, commodity_id, price_date, min_price, max_price, modal_price, arrivals_tonnes, unit, is_demo_data) VALUES
('c0000000-0000-0000-0000-000000000006', 'b0000000-0000-0000-0000-000000000005', CURRENT_DATE, 5200.00, 5600.00, 5450.00, 230.0, 'quintal', true),
('c0000000-0000-0000-0000-000000000007', 'b0000000-0000-0000-0000-000000000005', CURRENT_DATE, 5300.00, 5750.00, 5580.00, 310.0, 'quintal', true),
('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000006', CURRENT_DATE, 5800.00, 6200.00, 6050.00, 95.0, 'quintal', true),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000006', CURRENT_DATE, 5900.00, 6300.00, 6120.00, 110.0, 'quintal', true);

-- Onion & Tomato Prices
INSERT INTO mandi_prices (mandi_id, commodity_id, price_date, min_price, max_price, modal_price, arrivals_tonnes, unit, is_demo_data) VALUES
('c0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000010', CURRENT_DATE, 1800.00, 2400.00, 2150.00, 650.0, 'quintal', true),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000010', CURRENT_DATE, 2000.00, 2600.00, 2350.00, 180.0, 'quintal', true),
('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000011', CURRENT_DATE, 1400.00, 2100.00, 1750.00, 220.0, 'quintal', true),
('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000011', CURRENT_DATE, 1500.00, 2250.00, 1850.00, 310.0, 'quintal', true);

-- 6. STORAGE FACILITIES
INSERT INTO storage_facilities (id, name_hi, name_en, facility_type, district, state, latitude, longitude, capacity_quintal, daily_rate_per_quintal, is_active, is_demo_data) VALUES
('d0000000-0000-0000-0000-000000000001', 'भोपाल सेंट्रल वेयरहाउस (CWC)', 'Bhopal Central Warehouse', 'warehouse', 'भोपाल (Bhopal)', 'Madhya Pradesh', 23.2599000, 77.4126000, 50000, 0.40, true, true),
('d0000000-0000-0000-0000-000000000002', 'सीहोर एग्री कोल्ड स्टोरेज', 'Sehore Agri Cold Storage', 'cold_storage', 'सीहोर (Sehore)', 'Madhya Pradesh', 23.2033000, 77.0844000, 15000, 1.20, true, true),
('d0000000-0000-0000-0000-000000000003', 'इंदौर मालवा एग्रो वेयरहाउसिंग', 'Indore Malwa Agro Warehousing', 'warehouse', 'इंदौर (Indore)', 'Madhya Pradesh', 22.7196000, 75.8577000, 80000, 0.35, true, true);

-- 7. TRANSPORT RATES
INSERT INTO transport_rates (vehicle_type, rate_per_km_per_quintal, loading_rate_per_quintal, unloading_rate_per_quintal, max_capacity_quintal, region) VALUES
('tractor_trolley', 1.80, 15.00, 15.00, 60.0, 'default'),
('pickup_van', 2.50, 12.00, 12.00, 30.0, 'default'),
('mini_truck', 1.50, 10.00, 10.00, 100.0, 'default'),
('large_truck', 1.10, 8.00, 8.00, 250.0, 'default');

-- 8. BUYER REQUIREMENTS (Active demand for Wheat and Soybean)
INSERT INTO buyer_requirements (id, buyer_id, commodity_id, quantity_min, quantity_max, price_min, price_max, quality_grade, pickup_available, delivery_radius_km, status) VALUES
('e0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 30.0, 150.0, 2650.00, 2720.00, 'A', true, 120, 'active'),
('e0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 50.0, 500.0, 2680.00, 2750.00, 'A', false, 80, 'active'),
('e0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000004', 20.0, 200.0, 4700.00, 4850.00, 'any', true, 100, 'active');

-- 9. BUYER RATINGS
INSERT INTO buyer_ratings (buyer_id, farmer_id, rating, payment_on_time, comment) VALUES
('a0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 5, true, 'समय पर पूरा भुगतान और सही तौल (On-time payment & accurate weighing)'),
('a0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 4, true, 'अच्छी कीमत और पारदर्शी जांच (Good pricing and transparent grading)');

-- 10. AUDIT LOGS (Initial Platform Setup)
INSERT INTO audit_logs (user_id, action, entity_type, details) VALUES
('a0000000-0000-0000-0000-000000000000', 'system_init', 'platform', '{"status": "initialized", "version": "1.0.0-phase1"}'),
('a0000000-0000-0000-0000-000000000002', 'buyer_verified', 'user', '{"buyer": "Sharma Traders", "verified_by": "admin"}');
