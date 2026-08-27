# KrishiLink AI — Architecture Document

> Technical architecture blueprint for implementation

---

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Farmer App  │  │  Buyer App  │  │ FPO App  │  │Admin Panel│  │
│  │ (Mobile)    │  │  (Mobile)   │  │ (Mobile) │  │ (Desktop) │  │
│  └──────┬──────┘  └──────┬──────┘  └────┬─────┘  └────┬──────┘  │
│         │                │               │              │        │
│  React + Vite + Tailwind CSS + React Router + Recharts + Leaflet│
└─────────┼────────────────┼───────────────┼──────────────┼────────┘
          │                │               │              │
          ▼                ▼               ▼              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API GATEWAY LAYER                           │
│                   Node.js + Express Server                       │
│                                                                  │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │   Auth   │ │  Market  │ │  Trading │ │  Admin   │           │
│  │  Routes  │ │  Routes  │ │  Routes  │ │  Routes  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Middleware Layer                          │       │
│  │  JWT Auth │ RBAC │ Validation │ Rate Limit │ Logger  │       │
│  └──────────────────────────────────────────────────────┘       │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Service Layer                            │       │
│  │  MarketService │ BuyerMatchingService │ LotService   │       │
│  │  RecommendationService │ LogisticsService │ UserSvc  │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────┬───────────────────────┬────────────────────┘
                      │                       │
          ┌───────────┴───────────┐           │
          ▼                       ▼           ▼
┌──────────────────┐  ┌───────────────────────────────────────────┐
│   PostgreSQL     │  │         Python AI Service                  │
│                  │  │         FastAPI Server                      │
│  - Users         │  │                                            │
│  - Commodities   │  │  ┌──────────────┐  ┌───────────────────┐  │
│  - Mandis        │  │  │Price Forecast│  │  Voice/NLU Agent  │  │
│  - Prices        │  │  │  (sklearn)   │  │  (LLM API call)   │  │
│  - Lots          │  │  └──────────────┘  └───────────────────┘  │
│  - Offers        │  │                                            │
│  - Orders        │  │  ┌──────────────┐  ┌───────────────────┐  │
│  - Payments      │  │  │Market Stats  │  │  Explanation Gen  │  │
│  - Audit Logs    │  │  │  (pandas)    │  │  (LLM API call)   │  │
│  - Config        │  │  └──────────────┘  └───────────────────┘  │
└──────────────────┘  └───────────────────────────────────────────┘
```

---

## 2. Folder Structure

```
KrishiLink-AI/
│
├── PROJECT_SPEC.md
├── ARCHITECTURE.md
├── DEVELOPMENT_PLAN.md
├── DEMO_SCENARIO.md
├── README.md
│
├── client/                          # React Frontend (Vite)
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── package.json
│   │
│   ├── public/
│   │   ├── icons/                   # Commodity icons, UI icons
│   │   ├── sounds/                  # Notification sounds
│   │   └── manifest.json
│   │
│   └── src/
│       ├── main.jsx                 # App entry point
│       ├── App.jsx                  # Root component + router
│       │
│       ├── assets/                  # Static assets (images, fonts)
│       │
│       ├── config/
│       │   ├── api.js               # API base URLs, endpoints
│       │   └── i18n.js              # Hindi/English translations
│       │
│       ├── contexts/
│       │   ├── AuthContext.jsx       # Auth state + JWT management
│       │   └── LanguageContext.jsx   # Hindi/English toggle
│       │
│       ├── hooks/
│       │   ├── useAuth.js
│       │   ├── useVoice.js          # Voice input/output hook
│       │   ├── useMarketData.js
│       │   └── useApi.js            # Generic fetch wrapper
│       │
│       ├── components/
│       │   ├── common/
│       │   │   ├── Header.jsx
│       │   │   ├── BottomNav.jsx     # Mobile bottom navigation
│       │   │   ├── BigButton.jsx     # Large touch-friendly button
│       │   │   ├── VoiceButton.jsx   # 🎤 Voice input trigger
│       │   │   ├── DemoDataBanner.jsx # Demo data warning banner
│       │   │   ├── LoadingSpinner.jsx
│       │   │   ├── PriceCard.jsx
│       │   │   ├── CommoditySelector.jsx
│       │   │   └── LocationPicker.jsx
│       │   │
│       │   ├── farmer/
│       │   │   ├── FarmerHome.jsx
│       │   │   ├── PriceDisplay.jsx
│       │   │   ├── PriceTrendChart.jsx
│       │   │   ├── LotCreationForm.jsx
│       │   │   ├── LotCreationSteps.jsx  # Step-by-step wizard
│       │   │   ├── BuyerList.jsx
│       │   │   ├── BuyerCard.jsx
│       │   │   ├── OfferCard.jsx
│       │   │   ├── RecommendationView.jsx
│       │   │   ├── NetRealizationCard.jsx
│       │   │   ├── MyLots.jsx
│       │   │   ├── OrderTracker.jsx
│       │   │   └── VoiceAssistant.jsx
│       │   │
│       │   ├── buyer/
│       │   │   ├── BuyerHome.jsx
│       │   │   ├── BuyerRequirementForm.jsx
│       │   │   ├── AvailableLots.jsx
│       │   │   ├── MakeOffer.jsx
│       │   │   ├── BuyerOrders.jsx
│       │   │   └── BuyerProfile.jsx
│       │   │
│       │   ├── fpo/
│       │   │   ├── FPODashboard.jsx
│       │   │   ├── MemberList.jsx
│       │   │   ├── AggregatedLots.jsx
│       │   │   └── FPOAnalytics.jsx
│       │   │
│       │   └── admin/
│       │       ├── AdminDashboard.jsx
│       │       ├── UserManagement.jsx
│       │       ├── BuyerVerification.jsx
│       │       ├── MasterDataManager.jsx
│       │       ├── PlatformAnalytics.jsx
│       │       └── AuditLogViewer.jsx
│       │
│       ├── pages/
│       │   ├── LandingPage.jsx       # Language selection + entry
│       │   ├── LoginPage.jsx         # Phone + OTP login
│       │   ├── RegisterPage.jsx      # Role-based registration
│       │   ├── FarmerDashboard.jsx
│       │   ├── BuyerDashboard.jsx
│       │   ├── FPODashboard.jsx
│       │   ├── AdminDashboard.jsx
│       │   ├── MarketPrices.jsx
│       │   ├── CreateLot.jsx
│       │   ├── LotDetail.jsx
│       │   ├── Recommendations.jsx
│       │   ├── OrderDetail.jsx
│       │   └── NotFound.jsx
│       │
│       ├── services/
│       │   ├── authService.js
│       │   ├── marketService.js
│       │   ├── lotService.js
│       │   ├── offerService.js
│       │   ├── recommendationService.js
│       │   └── voiceService.js
│       │
│       └── utils/
│           ├── formatCurrency.js     # ₹ formatting
│           ├── formatDate.js
│           ├── formatQuantity.js     # "50 क्विंटल" formatting
│           └── validators.js
│
├── server/                           # Node.js + Express Backend
│   ├── package.json
│   ├── .env.example
│   │
│   ├── src/
│   │   ├── index.js                  # Server entry point
│   │   ├── app.js                    # Express app setup
│   │   │
│   │   ├── config/
│   │   │   ├── database.js           # PostgreSQL connection (pg)
│   │   │   ├── env.js                # Environment variable loader
│   │   │   └── constants.js          # App-wide constants
│   │   │
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT verification
│   │   │   ├── rbac.js               # Role-based access control
│   │   │   ├── validate.js           # Request validation
│   │   │   ├── errorHandler.js       # Global error handler
│   │   │   └── auditLog.js           # Action logging middleware
│   │   │
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── market.routes.js
│   │   │   ├── lot.routes.js
│   │   │   ├── offer.routes.js
│   │   │   ├── order.routes.js
│   │   │   ├── buyer.routes.js
│   │   │   ├── recommendation.routes.js
│   │   │   ├── fpo.routes.js
│   │   │   ├── admin.routes.js
│   │   │   └── voice.routes.js
│   │   │
│   │   ├── services/
│   │   │   ├── authService.js
│   │   │   ├── marketService.js       # Mandi price queries
│   │   │   ├── lotService.js          # Lot CRUD
│   │   │   ├── offerService.js        # Offer CRUD + business logic
│   │   │   ├── orderService.js        # Order lifecycle
│   │   │   ├── buyerMatchingService.js # Deterministic scoring
│   │   │   ├── logisticsService.js    # Transport + storage cost
│   │   │   ├── recommendationService.js # Net realization engine
│   │   │   ├── voiceService.js        # Proxy to Python AI service
│   │   │   └── analyticsService.js    # Dashboard data
│   │   │
│   │   ├── models/                    # Database query functions (raw SQL or query builder)
│   │   │   ├── User.js
│   │   │   ├── Commodity.js
│   │   │   ├── Mandi.js
│   │   │   ├── MandiPrice.js
│   │   │   ├── Lot.js
│   │   │   ├── Offer.js
│   │   │   ├── Order.js
│   │   │   ├── Payment.js
│   │   │   ├── BuyerRequirement.js
│   │   │   ├── StorageFacility.js
│   │   │   └── AuditLog.js
│   │   │
│   │   └── utils/
│   │       ├── jwt.js
│   │       ├── hash.js
│   │       ├── distanceCalc.js        # Haversine distance
│   │       └── responseHelper.js
│   │
│   ├── db/
│   │   ├── schema.sql                 # Full database schema
│   │   ├── seed.sql                   # Demo data seed
│   │   └── migrations/               # Future migrations
│   │
│   └── tests/
│       ├── services/
│       │   ├── buyerMatching.test.js
│       │   ├── recommendation.test.js
│       │   └── logistics.test.js
│       └── routes/
│           ├── auth.test.js
│           └── market.test.js
│
├── ai-service/                        # Python FastAPI AI Service
│   ├── requirements.txt
│   ├── .env.example
│   │
│   ├── main.py                        # FastAPI entry point
│   │
│   ├── routers/
│   │   ├── forecast.py                # Price forecasting endpoints
│   │   ├── voice.py                   # Voice/NLU endpoints
│   │   └── analytics.py              # Statistical analysis endpoints
│   │
│   ├── services/
│   │   ├── forecast_service.py        # ARIMA/Prophet forecasting
│   │   ├── nlu_service.py             # Intent extraction via LLM
│   │   ├── tts_service.py             # Text-to-speech
│   │   └── explanation_service.py     # Hindi explanation generation
│   │
│   ├── models/
│   │   └── forecast_model.py          # Trained model loading
│   │
│   ├── data/
│   │   └── demo_prices.csv            # Historical price demo data
│   │
│   └── tests/
│       ├── test_forecast.py
│       └── test_nlu.py
│
└── docs/
    ├── api/
    │   └── endpoints.md               # API documentation
    ├── database/
    │   └── erd.md                     # ER diagram
    └── demo/
        └── demo_script.md            # SIH demo script
```

---

## 3. Database Schema

### 3.1 Entity-Relationship Overview

```
┌──────────┐     ┌───────────┐     ┌──────────────┐
│  Users   │────<│  Lots     │────<│   Offers     │
│          │     │           │     │              │
│ farmer   │     │ commodity │     │ buyer_id     │
│ buyer    │     │ quantity  │     │ price        │
│ fpo      │     │ quality   │     │ status       │
│ admin    │     │ location  │     └──────┬───────┘
└────┬─────┘     └───────────┘            │
     │                                     │
     │           ┌───────────┐     ┌──────▼───────┐
     │           │Commodities│     │   Orders     │
     │           │           │     │              │
     │           │ name_hi   │     │ status       │
     │           │ name_en   │     │ amount       │
     │           │ unit      │     └──────┬───────┘
     │           └───────────┘            │
     │                              ┌─────▼───────┐
     │           ┌───────────┐      │  Payments   │
     └──────────>│BuyerReqs  │      │             │
                 │           │      │ amount      │
                 │ commodity │      │ status      │
                 │ quantity  │      │ date        │
                 │ price_max │      └─────────────┘
                 └───────────┘
```

### 3.2 Complete Schema

#### `users`
```sql
CREATE TABLE users (
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

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_location ON users(latitude, longitude);
CREATE INDEX idx_users_fpo ON users(fpo_id);
```

#### `commodities`
```sql
CREATE TABLE commodities (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_hi     VARCHAR(100) NOT NULL,     -- गेहूं
    name_en     VARCHAR(100) NOT NULL,     -- Wheat
    category    VARCHAR(50) NOT NULL,      -- grain, vegetable, fruit, oilseed, spice
    unit        VARCHAR(20) DEFAULT 'quintal',
    icon        VARCHAR(50),               -- wheat, rice, tomato, etc.
    
    -- Quality parameters for this commodity
    quality_params JSONB DEFAULT '[]',
    -- Example: [{"name_hi":"नमी","name_en":"Moisture","unit":"%","min":8,"max":14,"ideal":12}]
    
    is_active   BOOLEAN DEFAULT true,
    created_at  TIMESTAMP DEFAULT NOW()
);
```

#### `mandis`
```sql
CREATE TABLE mandis (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name_hi         VARCHAR(150) NOT NULL,
    name_en         VARCHAR(150) NOT NULL,
    district        VARCHAR(100),
    state           VARCHAR(50) NOT NULL,
    latitude        DECIMAL(10,7) NOT NULL,
    longitude       DECIMAL(10,7) NOT NULL,
    commission_rate DECIMAL(4,2) DEFAULT 2.5,  -- percentage
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_mandis_location ON mandis(latitude, longitude);
CREATE INDEX idx_mandis_state ON mandis(state);
```

#### `mandi_prices`
```sql
CREATE TABLE mandi_prices (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mandi_id        UUID NOT NULL REFERENCES mandis(id),
    commodity_id    UUID NOT NULL REFERENCES commodities(id),
    price_date      DATE NOT NULL,
    min_price       DECIMAL(10,2),
    max_price       DECIMAL(10,2),
    modal_price     DECIMAL(10,2) NOT NULL,  -- most common transaction price
    unit            VARCHAR(20) DEFAULT 'quintal',
    is_demo_data    BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW(),
    
    UNIQUE(mandi_id, commodity_id, price_date)
);

CREATE INDEX idx_prices_commodity_date ON mandi_prices(commodity_id, price_date DESC);
CREATE INDEX idx_prices_mandi ON mandi_prices(mandi_id);
```

#### `lots`
```sql
CREATE TABLE lots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id       UUID NOT NULL REFERENCES users(id),
    commodity_id    UUID NOT NULL REFERENCES commodities(id),
    quantity        DECIMAL(10,2) NOT NULL,
    unit            VARCHAR(20) DEFAULT 'quintal',
    
    -- Quality details
    quality_grade   VARCHAR(5) CHECK (quality_grade IN ('A', 'B', 'C')),
    quality_params  JSONB DEFAULT '{}',
    -- Example: {"moisture": 12.5, "foreign_matter": 1.2}
    
    -- Location (farmer's location or produce location)
    latitude        DECIMAL(10,7),
    longitude       DECIMAL(10,7),
    
    -- Pricing expectation
    expected_price  DECIMAL(10,2),
    
    -- Photos
    photos          JSONB DEFAULT '[]',      -- Array of photo URLs
    
    -- Status
    status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'offer_received', 'sold', 'expired', 'cancelled')),
    
    -- Metadata
    notes           TEXT,
    expires_at      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_lots_farmer ON lots(farmer_id);
CREATE INDEX idx_lots_commodity ON lots(commodity_id);
CREATE INDEX idx_lots_status ON lots(status);
CREATE INDEX idx_lots_location ON lots(latitude, longitude);
```

#### `buyer_requirements`
```sql
CREATE TABLE buyer_requirements (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id        UUID NOT NULL REFERENCES users(id),
    commodity_id    UUID NOT NULL REFERENCES commodities(id),
    quantity_min    DECIMAL(10,2),
    quantity_max    DECIMAL(10,2),
    price_min       DECIMAL(10,2),
    price_max       DECIMAL(10,2) NOT NULL,
    quality_grade   VARCHAR(5) CHECK (quality_grade IN ('A', 'B', 'C', 'any')),
    quality_params  JSONB DEFAULT '{}',
    
    -- Delivery preferences
    pickup_available BOOLEAN DEFAULT false,
    delivery_radius_km INT,
    
    -- Status
    status          VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active', 'fulfilled', 'expired', 'cancelled')),
    
    expires_at      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_buyerreq_buyer ON buyer_requirements(buyer_id);
CREATE INDEX idx_buyerreq_commodity ON buyer_requirements(commodity_id);
CREATE INDEX idx_buyerreq_status ON buyer_requirements(status);
```

#### `offers`
```sql
CREATE TABLE offers (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lot_id          UUID NOT NULL REFERENCES lots(id),
    buyer_id        UUID NOT NULL REFERENCES users(id),
    
    offered_price   DECIMAL(10,2) NOT NULL,     -- per unit (per quintal)
    total_amount    DECIMAL(12,2) NOT NULL,
    
    -- Offer details
    pickup_offered  BOOLEAN DEFAULT false,
    payment_terms   VARCHAR(50) DEFAULT 'on_delivery',  -- on_delivery, 7_days, 15_days
    notes           TEXT,
    
    -- Status
    status          VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending', 'accepted', 'rejected', 'countered', 'expired', 'withdrawn')),
    
    -- Counter offer (if farmer counters)
    counter_price   DECIMAL(10,2),
    
    expires_at      TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_offers_lot ON offers(lot_id);
CREATE INDEX idx_offers_buyer ON offers(buyer_id);
CREATE INDEX idx_offers_status ON offers(status);
```

#### `orders`
```sql
CREATE TABLE orders (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    offer_id        UUID NOT NULL REFERENCES offers(id),
    lot_id          UUID NOT NULL REFERENCES lots(id),
    farmer_id       UUID NOT NULL REFERENCES users(id),
    buyer_id        UUID NOT NULL REFERENCES users(id),
    
    -- Agreed terms
    agreed_price    DECIMAL(10,2) NOT NULL,
    quantity        DECIMAL(10,2) NOT NULL,
    total_amount    DECIMAL(12,2) NOT NULL,
    
    -- Status tracking
    status          VARCHAR(20) DEFAULT 'confirmed'
                    CHECK (status IN ('confirmed', 'dispatched', 'in_transit', 'delivered', 'completed', 'disputed', 'cancelled')),
    
    -- Dates
    expected_delivery DATE,
    actual_delivery   DATE,
    
    -- Logistics
    transport_cost  DECIMAL(10,2),
    loading_cost    DECIMAL(10,2),
    
    created_at      TIMESTAMP DEFAULT NOW(),
    updated_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_orders_farmer ON orders(farmer_id);
CREATE INDEX idx_orders_buyer ON orders(buyer_id);
CREATE INDEX idx_orders_status ON orders(status);
```

#### `payments`
```sql
CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id        UUID NOT NULL REFERENCES orders(id),
    
    amount          DECIMAL(12,2) NOT NULL,
    payment_type    VARCHAR(20) DEFAULT 'full'
                    CHECK (payment_type IN ('advance', 'partial', 'full', 'final')),
    
    status          VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'disputed')),
    
    payment_method  VARCHAR(30),   -- upi, bank_transfer, cash (demo)
    transaction_ref VARCHAR(100),
    
    paid_at         TIMESTAMP,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_payments_order ON payments(order_id);
CREATE INDEX idx_payments_status ON payments(status);
```

#### `storage_facilities`
```sql
CREATE TABLE storage_facilities (
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
    commodities_accepted JSONB DEFAULT '[]',  -- List of commodity IDs
    is_active       BOOLEAN DEFAULT true,
    is_demo_data    BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_storage_location ON storage_facilities(latitude, longitude);
```

#### `transport_rates`
```sql
CREATE TABLE transport_rates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_type    VARCHAR(30) NOT NULL,   -- tractor, pickup, truck, mini_truck
    rate_per_km_per_quintal DECIMAL(6,2) NOT NULL,
    loading_rate_per_quintal DECIMAL(6,2) NOT NULL,
    unloading_rate_per_quintal DECIMAL(6,2) NOT NULL,
    max_capacity_quintal DECIMAL(8,2),
    region          VARCHAR(50) DEFAULT 'default',
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMP DEFAULT NOW()
);
```

#### `buyer_ratings`
```sql
CREATE TABLE buyer_ratings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    buyer_id        UUID NOT NULL REFERENCES users(id),
    farmer_id       UUID NOT NULL REFERENCES users(id),
    order_id        UUID REFERENCES orders(id),
    
    rating          INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
    payment_on_time BOOLEAN,
    comment         TEXT,
    
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_ratings_buyer ON buyer_ratings(buyer_id);
```

#### `platform_config`
```sql
CREATE TABLE platform_config (
    key             VARCHAR(100) PRIMARY KEY,
    value           JSONB NOT NULL,
    description     TEXT,
    updated_by      UUID REFERENCES users(id),
    updated_at      TIMESTAMP DEFAULT NOW()
);

-- Store configurable values like buyer matching weights:
-- key: 'buyer_matching_weights'
-- value: {"price": 0.40, "distance": 0.20, "quantity_match": 0.15, ...}
```

#### `audit_logs`
```sql
CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID REFERENCES users(id),
    action          VARCHAR(50) NOT NULL,     -- login, create_lot, make_offer, accept_offer, etc.
    entity_type     VARCHAR(30),              -- lot, offer, order, payment, user
    entity_id       UUID,
    details         JSONB DEFAULT '{}',
    ip_address      VARCHAR(45),
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);
```

---

## 4. API Architecture

### 4.1 Base URL Structure

```
Express Backend:   http://localhost:3001/api/v1
Python AI Service: http://localhost:8000/api/v1
```

### 4.2 Authentication Routes

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Register new user | Public |
| POST | `/auth/login` | Login with phone + password | Public |
| POST | `/auth/send-otp` | Send OTP (simulated) | Public |
| POST | `/auth/verify-otp` | Verify OTP | Public |
| GET | `/auth/me` | Get current user profile | JWT |
| PUT | `/auth/profile` | Update profile | JWT |

### 4.3 Market Routes

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/market/prices` | Get current prices (query: commodity, mandi, date) | JWT |
| GET | `/market/prices/trends` | Get price trends (query: commodity, mandi, days) | JWT |
| GET | `/market/prices/compare` | Compare prices across mandis | JWT |
| GET | `/market/commodities` | List all commodities | JWT |
| GET | `/market/mandis` | List mandis (query: state, lat, lng, radius) | JWT |
| GET | `/market/mandis/nearby` | Get nearby mandis by lat/lng | JWT |

### 4.4 Lot Routes

| Method | Endpoint | Description | Auth | Role |
|---|---|---|---|---|
| POST | `/lots` | Create new lot | JWT | farmer, fpo |
| GET | `/lots` | List lots (filters) | JWT | all |
| GET | `/lots/:id` | Get lot detail | JWT | all |
| PUT | `/lots/:id` | Update lot | JWT | owner |
| DELETE | `/lots/:id` | Cancel lot | JWT | owner |
| GET | `/lots/my` | Get farmer's own lots | JWT | farmer |

### 4.5 Offer Routes

| Method | Endpoint | Description | Auth | Role |
|---|---|---|---|---|
| POST | `/offers` | Make offer on a lot | JWT | buyer |
| GET | `/offers/lot/:lotId` | Get all offers for a lot | JWT | lot owner |
| GET | `/offers/my` | Get buyer's sent offers | JWT | buyer |
| PUT | `/offers/:id/accept` | Accept an offer | JWT | lot owner |
| PUT | `/offers/:id/reject` | Reject an offer | JWT | lot owner |
| PUT | `/offers/:id/counter` | Counter an offer | JWT | lot owner |
| PUT | `/offers/:id/withdraw` | Withdraw an offer | JWT | offer owner |

### 4.6 Order & Payment Routes

| Method | Endpoint | Description | Auth | Role |
|---|---|---|---|---|
| GET | `/orders` | List orders | JWT | farmer, buyer |
| GET | `/orders/:id` | Get order detail | JWT | involved party |
| PUT | `/orders/:id/status` | Update order status | JWT | buyer |
| POST | `/payments` | Record payment | JWT | buyer |
| GET | `/payments/order/:orderId` | Get payments for order | JWT | involved |

### 4.7 Recommendation Routes

| Method | Endpoint | Description | Auth | Role |
|---|---|---|---|---|
| POST | `/recommendations/sell` | Get selling recommendations | JWT | farmer |
| POST | `/recommendations/buyers` | Get matched buyers for a lot | JWT | farmer |

**Request body for `/recommendations/sell`:**
```json
{
  "commodity_id": "uuid",
  "quantity": 50,
  "quality_grade": "A",
  "latitude": 28.6139,
  "longitude": 77.2090,
  "urgency": "flexible"
}
```

### 4.8 Buyer Routes

| Method | Endpoint | Description | Auth | Role |
|---|---|---|---|---|
| POST | `/buyers/requirements` | Post buy requirement | JWT | buyer |
| GET | `/buyers/requirements/my` | Get buyer's requirements | JWT | buyer |
| GET | `/buyers/:id/profile` | Get buyer public profile | JWT | all |
| GET | `/buyers/:id/ratings` | Get buyer ratings | JWT | all |
| POST | `/buyers/:id/rate` | Rate a buyer | JWT | farmer |

### 4.9 FPO Routes

| Method | Endpoint | Description | Auth | Role |
|---|---|---|---|---|
| GET | `/fpo/members` | Get FPO member list | JWT | fpo |
| GET | `/fpo/analytics` | Get FPO analytics | JWT | fpo |
| GET | `/fpo/lots` | Get aggregated member lots | JWT | fpo |
| POST | `/fpo/lots/bulk` | Create bulk lot for members | JWT | fpo |

### 4.10 Admin Routes

| Method | Endpoint | Description | Auth | Role |
|---|---|---|---|---|
| GET | `/admin/users` | List all users | JWT | admin |
| PUT | `/admin/users/:id/status` | Activate/deactivate user | JWT | admin |
| PUT | `/admin/buyers/:id/verify` | Verify a buyer | JWT | admin |
| GET | `/admin/analytics` | Platform analytics | JWT | admin |
| GET | `/admin/audit-logs` | View audit logs | JWT | admin |
| PUT | `/admin/config/:key` | Update platform config | JWT | admin |

### 4.11 Voice Routes (Proxy to Python AI Service)

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/voice/query` | Process voice/text query | JWT |

**Request:**
```json
{
  "text": "मेरे पास 50 क्विंटल गेहूं है, सबसे अच्छी जगह कहाँ बेचूं?",
  "type": "text"
}
```

**Response:**
```json
{
  "intent": "sell_recommendation",
  "entities": {
    "commodity": "wheat",
    "quantity": 50,
    "unit": "quintal"
  },
  "action": "redirect_to_recommendations",
  "response_hi": "आपके 50 क्विंटल गेहूं के लिए सबसे अच्छे विकल्प देख रहा हूँ...",
  "response_en": "Finding the best options for your 50 quintal wheat..."
}
```

### 4.12 Python AI Service Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/v1/forecast` | Price forecast for commodity + mandi |
| POST | `/api/v1/nlu/parse` | Parse Hindi text → structured intent |
| POST | `/api/v1/explain` | Generate Hindi explanation for recommendation results |
| GET | `/api/v1/health` | Health check |

---

## 5. AI Architecture

### 5.1 LLM Usage Boundary

```
┌─────────────────────────────────────────────────────────────┐
│                    LLM IS ALLOWED FOR:                       │
│                                                              │
│  ✅ Hindi voice/text → structured intent extraction          │
│  ✅ Generating Hindi explanations of computed results        │
│  ✅ Commodity name normalization ("gehun" → "wheat")         │
│  ✅ Natural language response generation                     │
│                                                              │
├─────────────────────────────────────────────────────────────┤
│                   LLM IS FORBIDDEN FOR:                      │
│                                                              │
│  ❌ Price calculations                                       │
│  ❌ Net realization arithmetic                               │
│  ❌ Buyer score computation                                  │
│  ❌ Distance/logistics calculations                          │
│  ❌ Any financial math                                       │
│  ❌ Ranking/sorting decisions (must be deterministic)        │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 5.2 Price Forecasting Pipeline

```
Historical Mandi Prices (DB)
    ↓
Pandas DataFrame (clean, fill gaps)
    ↓
Feature Engineering (day_of_week, month, lag features)
    ↓
Model: ARIMA / sklearn LinearRegression / Simple exponential smoothing
    ↓
7-day and 14-day forecasts
    ↓
Confidence intervals (based on historical variance)
    ↓
Return: { forecast: [{date, predicted_price, confidence_low, confidence_high}], trend: "rising" }
```

### 5.3 Voice/NLU Pipeline

```
User speaks Hindi
    ↓
Web Speech API (browser) → text transcription
    ↓
POST /api/v1/nlu/parse  { text: "..." }
    ↓
LLM API (Gemini / GPT) with structured prompt:
  "Extract intent and entities from this Hindi farmer query.
   Return JSON: { intent, commodity, quantity, unit, location }"
    ↓
Validate and sanitize extracted entities
    ↓
Return structured intent to Express backend
    ↓
Express routes appropriate action (e.g., call recommendation engine)
    ↓
Results computed (deterministic)
    ↓
POST /api/v1/explain  { results: {...}, language: "hi" }
    ↓
LLM generates Hindi explanation of the computed results
    ↓
Response displayed + read aloud via TTS
```

### 5.4 Recommendation Computation Flow

```
Farmer Input: { commodity, quantity, quality, location }
    │
    ├──→ MarketService.getNearbyMandiPrices()
    │         → Returns: [{ mandi, modal_price, distance }]
    │
    ├──→ BuyerMatchingService.getMatchedBuyers()
    │         → Returns: [{ buyer, offered_price, distance, score }]
    │
    ├──→ LogisticsService.estimateCosts()
    │         → Returns: { transport, loading, commission } per option
    │
    ├──→ MarketService.getForecast() (from Python service)
    │         → Returns: { forecast_7d, trend }
    │
    └──→ StorageService.getNearbyOptions()
              → Returns: [{ facility, daily_rate }]
    │
    ▼
RecommendationService.computeNetRealization()
    │
    │  For EACH option:
    │    net = gross - transport - loading - commission - storage
    │
    │  Sort by net_realization DESC
    │  Mark top option as "recommended"
    │  Calculate additional_realization vs local mandi
    │  Assign confidence score
    │
    ▼
POST /api/v1/explain { computed_results }
    │
    ▼
Return: { recommended, alternatives, explanation_hi }
```

---

## 6. UX Flows

### 6.1 Farmer UX Flow

```
┌─────────────────┐
│  App Opens       │
│  Language Select │
│  हिंदी / English │
└────────┬────────┘
         ▼
┌─────────────────┐
│  Login Screen    │
│  📱 Phone + OTP  │
│  (Big input,     │
│   numeric pad)   │
└────────┬────────┘
         ▼
┌──────────────────────────────────────────────┐
│              FARMER HOME                      │
│                                               │
│  ┌─────────────┐  ┌─────────────────┐        │
│  │ 🌾 आज का     │  │ 💰 अपनी फसल     │        │
│  │    भाव       │  │    बेचें         │        │
│  │ Today's      │  │ Sell Your        │        │
│  │ Prices       │  │ Produce          │        │
│  └──────┬──────┘  └───────┬─────────┘        │
│                                               │
│  ┌─────────────┐  ┌─────────────────┐        │
│  │ 🔍 खरीदार   │  │ 📦 मेरी फसल      │        │
│  │    खोजें     │  │    My Lots       │        │
│  │ Find Buyers  │  │                  │        │
│  └─────────────┘  └─────────────────┘        │
│                                               │
│  ┌───────────────────────────────────┐       │
│  │  🎤 बोलकर पूछें — Ask by Voice   │       │
│  └───────────────────────────────────┘       │
│                                               │
│  ⚠️ प्रदर्शन डेटा — Demo Data               │
└──────────────────────────────────────────────┘
```

**Flow: "अपनी फसल बेचें" (Sell Your Produce)**

```
Step 1: Select Commodity (big icon grid)
  🌾 गेहूं  🌾 चावल  🌽 मक्का  🫘 दाल  ...
  
Step 2: Enter Quantity
  [  50  ] क्विंटल  (large numeric input)

Step 3: Select Quality (visual guide)
  ⭐⭐⭐ Grade A — अच्छी गुणवत्ता
  ⭐⭐   Grade B — सामान्य गुणवत्ता
  ⭐     Grade C — कम गुणवत्ता

Step 4: Confirm Location
  📍 [Auto-detect] or [Select from list]

Step 5: Review & Create Lot
  गेहूं — 50 क्विंटल — Grade A — जयपुर
  [✅ फसल जोड़ें — Add Lot]

  → System immediately shows RECOMMENDATIONS
```

**Flow: Recommendations View**

```
┌────────────────────────────────────────────┐
│  🏆 सबसे अच्छा विकल्प — Best Option       │
│                                             │
│  शर्मा ट्रेडर्स (सत्यापित खरीदार ✅)       │
│  ₹2,700/क्विंटल                            │
│                                             │
│  आपको मिलेंगे: ₹1,25,000                  │
│                                             │
│  ₹8,500 ज्यादा                            │
│  (स्थानीय मंडी से तुलना में)                │
│                                             │
│  📊 खर्चे का ब्यौरा  ▼                     │
│    ढुलाई:     ₹4,000                       │
│    लोडिंग:    ₹1,500                       │
│    कमीशन:    ₹3,500                        │
│    कुल कटौती: ₹10,000                      │
│                                             │
│  [📞 संपर्क करें]  [✅ स्वीकार करें]        │
├────────────────────────────────────────────┤
│  अन्य विकल्प — Other Options               │
│                                             │
│  2. जयपुर मंडी — ₹1,22,500 मिलेंगे        │
│  3. अग्रवाल प्रोसेसर — ₹1,20,000 मिलेंगे  │
│  4. 🕐 रख कर बाद में बेचें — ₹1,30,000*   │
│     (*7 दिन बाद अनुमानित, भंडारण खर्च शामिल)│
└────────────────────────────────────────────┘
```

### 6.2 Buyer UX Flow

```
Buyer Login
    ↓
Buyer Home
  ├── 📋 My Requirements (post what you want to buy)
  ├── 📦 Available Lots (browse farmer lots)
  ├── 💼 My Offers (track sent offers)
  ├── 📊 Market Prices
  └── 👤 Profile

Flow: Post Requirement
  1. Select Commodity
  2. Enter Quantity Range (min-max)
  3. Enter Price Range
  4. Select Quality Grade
  5. Set Delivery Preferences (pickup / delivery within X km)
  6. Submit → Visible to matching farmers

Flow: Browse & Make Offer
  1. Browse available lots (filtered by commodity, location, quantity)
  2. View lot details (commodity, quantity, quality, photos, farmer location)
  3. Make Offer:
     - Enter price per quintal
     - Select payment terms
     - Offer pickup? Yes/No
     - Submit Offer
  4. Wait for farmer response
  5. If accepted → Order created
```

### 6.3 Admin / FPO UX Flow

```
Admin Login
    ↓
Admin Dashboard
  ├── 📊 Platform Overview
  │     - Total users (farmers, buyers)
  │     - Active lots
  │     - Completed transactions
  │     - Revenue (if applicable)
  │
  ├── 👥 User Management
  │     - List / search users
  │     - Activate / deactivate
  │     - View user details
  │
  ├── ✅ Buyer Verification
  │     - Pending verification queue
  │     - Review documents
  │     - Approve / reject
  │
  ├── 📦 Master Data
  │     - Commodities (add/edit)
  │     - Mandis (add/edit)
  │     - Transport rates
  │     - Storage facilities
  │
  ├── ⚙️ Configuration
  │     - Buyer matching weights
  │     - Commission rates
  │     - System parameters
  │
  └── 📋 Audit Logs
        - Filterable action log

---

FPO Login
    ↓
FPO Dashboard
  ├── 📊 Overview
  │     - Member count
  │     - Active lots
  │     - Total quantity listed
  │     - Transactions this month
  │
  ├── 👥 Members
  │     - List member farmers
  │     - View member activity
  │     - Add member (register farmer under FPO)
  │
  ├── 📦 Aggregated Lots
  │     - View all member lots
  │     - Create bulk lot (aggregate from members)
  │
  └── 📈 Analytics
        - Commodity-wise sales
        - Price trends for member commodities
        - Best performing channels
```

---

## 7. Security Architecture

### 7.1 Authentication Flow

```
Register:
  Phone → simulated OTP → verify → create user → return JWT

Login:
  Phone + Password → validate → return JWT
  
JWT Structure:
  {
    "sub": "user_uuid",
    "role": "farmer",
    "iat": timestamp,
    "exp": timestamp + 7days
  }
```

### 7.2 RBAC Middleware

```javascript
// Middleware chain for protected route:
router.get('/admin/users',
  authMiddleware,          // Verify JWT
  rbac('admin'),           // Check role
  auditLog('view_users'),  // Log action
  adminController.getUsers
);
```

### 7.3 Data Protection Matrix

| Data | Farmer | Buyer | FPO | Admin |
|---|---|---|---|---|
| Own profile | ✅ | ✅ | ✅ | ✅ |
| Farmer phone | Own only | After accept | Own members | ✅ |
| Farmer location (exact) | Own | After accept | Own members | ✅ |
| Farmer location (district) | Own | ✅ (for matching) | Own members | ✅ |
| Lot details | Own + public | Public lots | Member lots | ✅ |
| Offer details | Own lots | Own offers | Member lots | ✅ |
| Buyer business info | Matched buyers | Own | N/A | ✅ |
| Platform analytics | ❌ | ❌ | Own FPO | ✅ |

---

## 8. Deployment Architecture

### 8.1 Development (Local)

```
┌─────────────────────────────────────────────┐
│  Developer Machine                           │
│                                              │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐ │
│  │ Vite Dev │  │ Express  │  │  FastAPI   │ │
│  │ :5173    │  │ :3001    │  │  :8000     │ │
│  └──────────┘  └──────────┘  └───────────┘ │
│                      │                       │
│               ┌──────▼──────┐               │
│               │ PostgreSQL  │               │
│               │ :5432       │               │
│               └─────────────┘               │
└─────────────────────────────────────────────┘
```

### 8.2 SIH Demo Deployment

```
Option A: Single VPS (Recommended for demo)
┌─────────────────────────────────────────┐
│  VPS (e.g., DigitalOcean 4GB RAM)       │
│                                          │
│  Nginx (reverse proxy + static files)   │
│    ↓              ↓            ↓        │
│  React Build   Express     FastAPI       │
│  (static)      (PM2)       (uvicorn)    │
│                    ↓                     │
│              PostgreSQL                  │
└─────────────────────────────────────────┘

Option B: Free tier (Budget alternative)
  - Frontend: Vercel (free)
  - Backend: Render.com (free tier)
  - AI Service: Render.com (free tier)
  - Database: Supabase PostgreSQL (free tier)
```

### 8.3 Production-Ready (Future)

```
  AWS / GCP
  ├── CloudFront/CDN → React static build
  ├── ECS/Cloud Run → Express backend
  ├── ECS/Cloud Run → FastAPI AI service
  ├── RDS → PostgreSQL (managed)
  └── S3 → File uploads (lot photos)
```

---

## 9. Testing Strategy

### 9.1 Unit Tests

| Component | Tool | Priority |
|---|---|---|
| Buyer Matching Service | Jest | **P0** — core business logic |
| Recommendation Service | Jest | **P0** — core business logic |
| Logistics Service | Jest | **P1** — cost calculations |
| Net Realization Calc | Jest | **P0** — financial accuracy |
| Price Forecasting | pytest | **P1** — model validation |
| NLU Intent Extraction | pytest | **P2** — NLU accuracy |

### 9.2 API Tests

- Test all endpoints with valid/invalid inputs
- Test RBAC enforcement (farmer can't access admin routes)
- Test JWT expiry and refresh

### 9.3 Integration Tests

- End-to-end lot creation → offer → order → payment flow
- Recommendation pipeline: input → all service calls → final output
- Voice pipeline: text → NLU → action → response

### 9.4 Manual Testing

- Mobile responsiveness on different screen sizes
- Hindi text rendering and layout
- Voice input/output in Hindi
- Demo walkthrough from farmer's perspective

---

## 10. Technical Risks & Mitigation

| # | Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|---|
| 1 | Hindi voice recognition accuracy | Core feature degradation | Medium | Fall back to typed Hindi input; keep queries simple; provide suggestion chips |
| 2 | LLM API rate limits or cost | NLU/explanation service unavailable | Medium | Cache common intents; use rule-based fallback for top-10 queries; budget LLM calls |
| 3 | Price forecasting accuracy on demo data | Misleading predictions | High | Clearly label as "अनुमान" (estimate); show confidence intervals; caveat on all forecasts |
| 4 | PostgreSQL performance with complex joins | Slow recommendations | Low | Pre-compute nearby mandis; use proper indexes; keep demo data small |
| 5 | Mobile performance on low-end devices | Poor farmer UX | Medium | Minimize bundle size; lazy-load routes; optimize images; test on throttled connection |
| 6 | Scope creep during development | Missed deadline | High | Strict phased approach; MVP first; say no to nice-to-haves until core is done |
| 7 | Team unfamiliarity with Python AI stack | Blocked on AI service | Medium | Keep AI service minimal; provide starter code; can demo without AI initially |
| 8 | Demo day network issues | Live demo failure | Medium | Pre-record video backup; have offline fallback data; test on demo venue WiFi |
