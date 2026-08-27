-- KrishiLink AI - Complete Database Schema (PostgreSQL)
-- Matches ARCHITECTURE.md 13-Table Specification

-- Enable pgcrypto / uuid-ossp if available
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USERS
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone           VARCHAR(15) UNIQUE NOT NULL,
    name            VARCHAR(100) NOT NULL,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('farmer', 'buyer', 'fpo', 'admin')),
    password_hash   VARCHAR(255) NOT NULL,
    
    -- Farmer-specific
    village         VARCHAR(100),
    district        VARCHAR(100),
    state           VARCHAR(50),
    latitude        DECIMAL(10,7),
    longitude       DECIMAL(10,7),
    land_area_acres DECIMAL(6,2),
    fpo_id          UUID REFERENCES users(id),
    
    -- Buyer-specific
    business_name   VARCHAR(150),
    buyer_type      VARCHAR(30) CHECK (buyer_type IN ('trader', 'processor', 'institutional', 'commission_agent')),
    is_verified     BOOLEAN DEFAULT false,
    verified_at     TIMESTAMP,
    verified_by     UUID REFERENCES users(id),
    
    -- Common
    preferred_lang  VARCHAR(5) DEFAULT 'hi',
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_location ON users(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_users_fpo ON users(fpo_id);

-- 2. COMMODITIES
CREATE TABLE IF NOT EXISTS commodities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_hi     VARCHAR(100) NOT NULL,
    name_en     VARCHAR(100) NOT NULL,
    category    VARCHAR(50) NOT NULL,      -- grain, vegetable, fruit, oilseed, pulse, spice
    unit        VARCHAR(20) DEFAULT 'quintal',
    icon        VARCHAR(50),
    quality_params JSONB DEFAULT '[]',
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- 3. MANDIS
CREATE TABLE IF NOT EXISTS mandis (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_hi         VARCHAR(150) NOT NULL,
    name_en         VARCHAR(150) NOT NULL,
    district        VARCHAR(100),
    state           VARCHAR(50) NOT NULL,
    latitude        DECIMAL(10,7) NOT NULL,
    longitude       DECIMAL(10,7) NOT NULL,
    commission_rate DECIMAL(4,2) DEFAULT 2.5,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mandis_location ON mandis(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_mandis_state ON mandis(state);

-- 4. MANDI_PRICES
CREATE TABLE IF NOT EXISTS mandi_prices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandi_id        UUID NOT NULL REFERENCES mandis(id) ON DELETE CASCADE,
    commodity_id    UUID NOT NULL REFERENCES commodities(id) ON DELETE CASCADE,
    price_date      DATE NOT NULL,
    min_price       DECIMAL(10,2),
    max_price       DECIMAL(10,2),
    modal_price     DECIMAL(10,2) NOT NULL,
    arrivals_tonnes DECIMAL(10,2) DEFAULT 0.00,
    unit            VARCHAR(20) DEFAULT 'quintal',
    is_demo_data    BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(mandi_id, commodity_id, price_date)
);

CREATE INDEX IF NOT EXISTS idx_prices_commodity_date ON mandi_prices(commodity_id, price_date DESC);
CREATE INDEX IF NOT EXISTS idx_prices_mandi ON mandi_prices(mandi_id);

-- 5. LOTS
CREATE TABLE IF NOT EXISTS lots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    commodity_id    UUID NOT NULL REFERENCES commodities(id),
    quantity        DECIMAL(10,2) NOT NULL,
    unit            VARCHAR(20) DEFAULT 'quintal',
    quality_grade   VARCHAR(5) CHECK (quality_grade IN ('A', 'B', 'C')),
    quality_params  JSONB DEFAULT '{}',
    latitude        DECIMAL(10,7),
    longitude       DECIMAL(10,7),
    expected_price  DECIMAL(10,2),
    photos          JSONB DEFAULT '[]',
    status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'offer_received', 'sold', 'expired', 'cancelled')),
    notes           TEXT,
    expires_at      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lots_farmer ON lots(farmer_id);
CREATE INDEX IF NOT EXISTS idx_lots_commodity ON lots(commodity_id);
CREATE INDEX IF NOT EXISTS idx_lots_status ON lots(status);
CREATE INDEX IF NOT EXISTS idx_lots_location ON lots(latitude, longitude);

-- 6. BUYER_REQUIREMENTS
CREATE TABLE IF NOT EXISTS buyer_requirements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    commodity_id    UUID NOT NULL REFERENCES commodities(id),
    quantity_min    DECIMAL(10,2),
    quantity_max    DECIMAL(10,2),
    price_min       DECIMAL(10,2),
    price_max       DECIMAL(10,2) NOT NULL,
    quality_grade   VARCHAR(5) CHECK (quality_grade IN ('A', 'B', 'C', 'any')),
    quality_params  JSONB DEFAULT '{}',
    pickup_available BOOLEAN DEFAULT false,
    delivery_radius_km INT,
    status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'fulfilled', 'expired', 'cancelled')),
    expires_at      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_buyerreq_buyer ON buyer_requirements(buyer_id);
CREATE INDEX IF NOT EXISTS idx_buyerreq_commodity ON buyer_requirements(commodity_id);
CREATE INDEX IF NOT EXISTS idx_buyerreq_status ON buyer_requirements(status);

-- 7. OFFERS
CREATE TABLE IF NOT EXISTS offers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id          UUID NOT NULL REFERENCES lots(id) ON DELETE CASCADE,
    buyer_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    offered_price   DECIMAL(10,2) NOT NULL,
    total_amount    DECIMAL(12,2) NOT NULL,
    pickup_offered  BOOLEAN DEFAULT false,
    payment_terms   VARCHAR(50) DEFAULT 'on_delivery',
    notes           TEXT,
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'expired', 'withdrawn')),
    counter_price   DECIMAL(10,2),
    expires_at      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_lot ON offers(lot_id);
CREATE INDEX IF NOT EXISTS idx_offers_buyer ON offers(buyer_id);
CREATE INDEX IF NOT EXISTS idx_offers_status ON offers(status);

-- 8. ORDERS
CREATE TABLE IF NOT EXISTS orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id        UUID NOT NULL REFERENCES offers(id),
    lot_id          UUID NOT NULL REFERENCES lots(id),
    farmer_id       UUID NOT NULL REFERENCES users(id),
    buyer_id        UUID NOT NULL REFERENCES users(id),
    agreed_price    DECIMAL(10,2) NOT NULL,
    quantity        DECIMAL(10,2) NOT NULL,
    total_amount    DECIMAL(12,2) NOT NULL,
    status          VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'dispatched', 'in_transit', 'delivered', 'completed', 'disputed', 'cancelled')),
    expected_delivery DATE,
    actual_delivery   DATE,
    transport_cost  DECIMAL(10,2) DEFAULT 0.00,
    loading_cost    DECIMAL(10,2) DEFAULT 0.00,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_farmer ON orders(farmer_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- 9. PAYMENTS
CREATE TABLE IF NOT EXISTS payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    amount          DECIMAL(12,2) NOT NULL,
    payment_type    VARCHAR(20) DEFAULT 'full' CHECK (payment_type IN ('advance', 'partial', 'full', 'final')),
    status          VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'disputed')),
    payment_method  VARCHAR(30) DEFAULT 'upi',
    transaction_ref VARCHAR(100),
    paid_at         TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);

-- 10. STORAGE_FACILITIES
CREATE TABLE IF NOT EXISTS storage_facilities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_hi         VARCHAR(150) NOT NULL,
    name_en         VARCHAR(150),
    facility_type   VARCHAR(30) CHECK (facility_type IN ('cold_storage', 'warehouse', 'silo')),
    district        VARCHAR(100),
    state           VARCHAR(50),
    latitude        DECIMAL(10,7),
    longitude       DECIMAL(10,7),
    capacity_quintal DECIMAL(10,2),
    daily_rate_per_quintal DECIMAL(8,2),
    commodities_accepted JSONB DEFAULT '[]',
    is_active       BOOLEAN DEFAULT true,
    is_demo_data    BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_storage_location ON storage_facilities(latitude, longitude);

-- 11. TRANSPORT_RATES
CREATE TABLE IF NOT EXISTS transport_rates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_type    VARCHAR(30) NOT NULL,
    rate_per_km_per_quintal DECIMAL(6,2) NOT NULL,
    loading_rate_per_quintal DECIMAL(6,2) NOT NULL,
    unloading_rate_per_quintal DECIMAL(6,2) NOT NULL,
    max_capacity_quintal DECIMAL(8,2),
    region          VARCHAR(50) DEFAULT 'default',
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- 12. BUYER_RATINGS
CREATE TABLE IF NOT EXISTS buyer_ratings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    farmer_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id        UUID REFERENCES orders(id),
    rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    payment_on_time BOOLEAN DEFAULT true,
    comment         TEXT,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ratings_buyer ON buyer_ratings(buyer_id);

-- 13. PLATFORM_CONFIG & AUDIT_LOGS
CREATE TABLE IF NOT EXISTS platform_config (
    key             VARCHAR(100) PRIMARY KEY,
    value           JSONB NOT NULL,
    description     TEXT,
    updated_by      UUID REFERENCES users(id),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    action          VARCHAR(50) NOT NULL,
    entity_type     VARCHAR(30),
    entity_id       UUID,
    details         JSONB DEFAULT '{}',
    ip_address      VARCHAR(45),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);
