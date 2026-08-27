# KrishiLink AI — Development Plan

> Phased development plan for SIH prototype implementation

---

## Overview

This plan breaks the project into **4 phases** designed for a student team working under SIH deadlines. Each phase produces a demonstrable increment. The team should not start Phase N+1 until Phase N is complete and working.

**Estimated Total Duration:** 4-5 weeks (assuming 3-4 developers working part-time)

---

## Phase 1: Foundation (Week 1)

> **Goal:** Working login, database, and basic market price display

### 1.1 Project Setup

- [ ] Initialize Git repository
- [ ] Create `client/` with Vite + React + Tailwind CSS
- [ ] Create `server/` with Express.js boilerplate
- [ ] Create `ai-service/` with FastAPI boilerplate
- [ ] Set up PostgreSQL database locally
- [ ] Create `.env.example` files for both services
- [ ] Set up `.gitignore` (node_modules, .env, __pycache__, etc.)

### 1.2 Database

- [ ] Write `schema.sql` with all tables from ARCHITECTURE.md
- [ ] Write `seed.sql` with demo data:
  - 15-20 commodities (गेहूं, चावल, मक्का, दाल, सोयाबीन, etc.)
  - 20-30 mandis across 5 states (MP, UP, Rajasthan, Maharashtra, Punjab)
  - 90 days of simulated mandi price history for each commodity-mandi pair
  - 5-10 demo farmer accounts
  - 5-10 demo buyer accounts
  - 3-5 storage facilities
  - Transport rate table
- [ ] Run schema + seed on local PostgreSQL

### 1.3 Backend Foundation

- [ ] Express app setup (`app.js`, `index.js`)
- [ ] Database connection (`config/database.js`)
- [ ] Environment config (`config/env.js`)
- [ ] JWT utilities (`utils/jwt.js`)
- [ ] Auth middleware (`middleware/auth.js`)
- [ ] RBAC middleware (`middleware/rbac.js`)
- [ ] Error handler middleware (`middleware/errorHandler.js`)
- [ ] Auth routes: register, login
- [ ] User model with basic CRUD
- [ ] CORS configuration for Vite dev server

### 1.4 Frontend Foundation

- [ ] Tailwind config with custom theme (farmer-friendly greens, high-contrast)
- [ ] Hindi/English translations file (`config/i18n.js`)
- [ ] `LanguageContext` — language toggle
- [ ] `AuthContext` — JWT storage and auth state
- [ ] Landing page with language selection (हिंदी / English)
- [ ] Login page (phone + password, large inputs, Hindi labels)
- [ ] Registration page (role selection: farmer / buyer)
- [ ] Basic routing setup (React Router)
- [ ] `Header` component with language toggle
- [ ] `BottomNav` component (mobile navigation)
- [ ] `DemoDataBanner` component

### 1.5 Market Prices (Basic)

- [ ] Backend: `GET /api/v1/market/prices` endpoint
- [ ] Backend: `GET /api/v1/market/commodities` endpoint
- [ ] Backend: `GET /api/v1/market/mandis` endpoint
- [ ] Frontend: Farmer home page with 4 big buttons
- [ ] Frontend: "आज का भाव" page — commodity selector → price display
- [ ] Frontend: `PriceCard` component showing min/max/modal price

### Phase 1 Deliverable

✅ User can open app → select Hindi → login → see farmer home → view today's mandi prices for selected commodity

---

## Phase 2: Core Trading (Week 2)

> **Goal:** Farmer can create lots, buyers can make offers, basic order flow

### 2.1 Lot Management

- [ ] Backend: `POST /api/v1/lots` — create lot
- [ ] Backend: `GET /api/v1/lots/my` — farmer's lots
- [ ] Backend: `GET /api/v1/lots` — browse lots (for buyers)
- [ ] Backend: `GET /api/v1/lots/:id` — lot detail
- [ ] Backend: `PUT /api/v1/lots/:id` — update lot
- [ ] Backend: `DELETE /api/v1/lots/:id` — cancel lot
- [ ] Frontend: Lot creation wizard (step-by-step):
  - Step 1: Commodity selector (big icon grid)
  - Step 2: Quantity input (large numeric, Hindi labels)
  - Step 3: Quality selector (visual grade A/B/C)
  - Step 4: Location (auto-detect or dropdown)
  - Step 5: Review + submit
- [ ] Frontend: "मेरी फसल" (My Lots) page
- [ ] Frontend: Lot detail view

### 2.2 Buyer Features

- [ ] Backend: `POST /api/v1/buyers/requirements` — post requirement
- [ ] Backend: `GET /api/v1/buyers/requirements/my` — buyer's requirements
- [ ] Frontend: Buyer home page
- [ ] Frontend: Post buy requirement form
- [ ] Frontend: Browse available lots page (with filters)
- [ ] Frontend: Lot detail view (buyer perspective)

### 2.3 Offer System

- [ ] Backend: `POST /api/v1/offers` — make offer
- [ ] Backend: `GET /api/v1/offers/lot/:lotId` — offers for a lot
- [ ] Backend: `GET /api/v1/offers/my` — buyer's offers
- [ ] Backend: `PUT /api/v1/offers/:id/accept` — accept offer
- [ ] Backend: `PUT /api/v1/offers/:id/reject` — reject offer
- [ ] Frontend: Make offer form (buyer)
- [ ] Frontend: View offers page (farmer) — comparison cards
- [ ] Frontend: Accept/reject buttons on offer cards

### 2.4 Basic Order Flow

- [ ] Backend: Auto-create order when offer is accepted
- [ ] Backend: `GET /api/v1/orders` — list orders
- [ ] Backend: `GET /api/v1/orders/:id` — order detail
- [ ] Backend: `PUT /api/v1/orders/:id/status` — update status
- [ ] Frontend: Order tracker (status badges: confirmed → dispatched → delivered → paid)
- [ ] Frontend: Basic payment recording (mark as paid)

### Phase 2 Deliverable

✅ Complete farmer → lot creation → buyer makes offer → farmer accepts → order created → status tracking flow

---

## Phase 3: Intelligence & Recommendations (Week 3)

> **Goal:** Working recommendation engine, buyer matching, price trends, and price forecasting

### 3.1 Price Trends & Charts

- [ ] Backend: `GET /api/v1/market/prices/trends` — historical data
- [ ] Frontend: `PriceTrendChart` using Recharts (line chart)
- [ ] Frontend: 7-day / 30-day / 90-day toggle
- [ ] Frontend: Trend direction indicator (↑ rising, ↓ falling, → stable)

### 3.2 Logistics Service

- [ ] Backend: `logisticsService.js`:
  - Haversine distance calculation
  - Transport cost = distance × rate_per_km_per_quintal × quantity
  - Loading/unloading cost = rate × quantity
  - Commission = gross × commission_rate
- [ ] Backend: `GET /api/v1/market/mandis/nearby` — nearby mandis with distance
- [ ] Unit tests for all cost calculations

### 3.3 Buyer Matching Service

- [ ] Backend: `buyerMatchingService.js`:
  - Query active buyer requirements matching lot's commodity
  - Calculate normalized scores for each factor (price, distance, quantity match, quality match, payment reliability, delivery compatibility)
  - Apply configurable weights from `platform_config` table
  - Return ranked list with score breakdown
- [ ] Backend: `POST /api/v1/recommendations/buyers` endpoint
- [ ] Unit tests for scoring algorithm
- [ ] Frontend: Matched buyers list with scores

### 3.4 Recommendation Engine

- [ ] Backend: `recommendationService.js`:
  - Gather all selling options (nearby mandis, matched buyers, storage + sell later)
  - For EACH option, call `logisticsService.estimateCosts()`
  - Compute net realization = gross - all deductions
  - Sort by net realization
  - Calculate additional realization vs. local mandi
  - Assign confidence score
- [ ] Backend: `POST /api/v1/recommendations/sell` endpoint
- [ ] Unit tests for net realization calculation
- [ ] Frontend: Recommendation view (see ARCHITECTURE.md UX spec)
  - Top recommendation card (highlighted)
  - Cost breakdown accordion
  - Alternative options list
  - "Store and sell later" option

### 3.5 Price Forecasting (Python AI Service)

- [ ] Python: Generate demo historical price CSV from seed data
- [ ] Python: `forecast_service.py` — simple time-series model
  - Option A: sklearn LinearRegression with lag features (simplest)
  - Option B: statsmodels ARIMA (more realistic)
- [ ] Python: `POST /api/v1/forecast` endpoint
- [ ] Backend: Proxy endpoint or direct call from recommendation service
- [ ] Frontend: Forecast line on price trend chart (dashed line)
- [ ] Frontend: "Store and sell later" option uses forecast price

### 3.6 Mandi Map

- [ ] Frontend: Leaflet map showing nearby mandis
- [ ] Frontend: Color-coded markers (green = high price, red = low)
- [ ] Frontend: Click marker → show price + distance + estimated net

### Phase 3 Deliverable

✅ Farmer creates lot → sees recommendation with net realization comparison → price trends with forecast → map view of mandis

---

## Phase 4: Polish & Demo (Week 4)

> **Goal:** Voice assistant, admin panel, FPO features, demo-ready polish

### 4.1 Voice Assistant

- [ ] Frontend: `VoiceButton` component (🎤)
- [ ] Frontend: `useVoice` hook (Web Speech API for browser-based STT)
- [ ] Python: `nlu_service.py` — LLM-based intent extraction
  - Prompt: "Extract intent and entities from this Hindi farmer query"
  - Supported intents: `check_price`, `sell_recommendation`, `find_buyer`, `check_forecast`
- [ ] Python: `POST /api/v1/nlu/parse` endpoint
- [ ] Backend: `voice.routes.js` — proxy to Python NLU
- [ ] Frontend: Voice response display + TTS (browser SpeechSynthesis API)
- [ ] Frontend: Voice button on farmer home page
- [ ] Handle common farmer queries:
  - "गेहूं का भाव क्या है?" → show wheat prices
  - "50 क्विंटल गेहूं कहाँ बेचूं?" → show recommendations
  - "सबसे अच्छा खरीदार कौन है?" → show matched buyers

### 4.2 Admin Panel

- [ ] Frontend: Admin dashboard with stats cards
- [ ] Frontend: User management (list, search, activate/deactivate)
- [ ] Frontend: Buyer verification queue
- [ ] Frontend: Platform config editor (buyer matching weights)
- [ ] Frontend: Audit log viewer
- [ ] Backend: All admin routes from ARCHITECTURE.md

### 4.3 FPO Features

- [ ] Frontend: FPO dashboard with member overview
- [ ] Frontend: Member list
- [ ] Frontend: Aggregated lots view
- [ ] Backend: FPO routes (member management, analytics)

### 4.4 Buyer Ratings

- [ ] Backend: Rating creation endpoint
- [ ] Backend: Average rating calculation
- [ ] Frontend: Rate buyer after order completion
- [ ] Frontend: Buyer rating display on cards

### 4.5 UI/UX Polish

- [ ] Add micro-animations (button press, card transitions)
- [ ] Add loading skeletons for data fetching
- [ ] Add empty states with helpful icons
- [ ] Add error states with retry buttons
- [ ] Ensure all buttons have icon + text
- [ ] Test all flows in Hindi
- [ ] Test on mobile viewport (320px, 375px, 414px)
- [ ] Add "Demo Data" banner on all data screens
- [ ] Add success toasts for actions (lot created, offer accepted, etc.)

### 4.6 Demo Preparation

- [ ] Create demo accounts (farmer, buyer, FPO, admin)
- [ ] Pre-populate demo lots and offers
- [ ] Write demo script (see DEMO_SCENARIO.md)
- [ ] Test complete demo flow end-to-end
- [ ] Record backup video of demo
- [ ] Prepare deployment (VPS or free tier)

### Phase 4 Deliverable

✅ Complete demo-ready application with voice assistant, all user roles, and polished UI

---

## Development Guidelines

### Code Standards

- **Frontend:** Functional components, hooks, consistent naming
- **Backend:** Service pattern (route → service → model), async/await, proper error handling
- **Python:** Type hints, docstrings, virtual environment
- **Git:** Feature branches, meaningful commits, PR reviews (if team > 1)

### Environment Variables

```env
# server/.env.example
PORT=3001
DATABASE_URL=postgresql://user:pass@localhost:5432/krishilink
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
AI_SERVICE_URL=http://localhost:8000
LLM_API_KEY=your-llm-api-key

# ai-service/.env.example
PORT=8000
DATABASE_URL=postgresql://user:pass@localhost:5432/krishilink
LLM_API_KEY=your-llm-api-key

# client/.env.example
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

### Key Dependencies

**Client (package.json):**
```json
{
  "dependencies": {
    "react": "^18",
    "react-dom": "^18",
    "react-router-dom": "^6",
    "recharts": "^2",
    "react-leaflet": "^4",
    "leaflet": "^1.9",
    "axios": "^1",
    "react-icons": "^5"
  },
  "devDependencies": {
    "vite": "^5",
    "tailwindcss": "^3",
    "autoprefixer": "^10",
    "postcss": "^8"
  }
}
```

**Server (package.json):**
```json
{
  "dependencies": {
    "express": "^4",
    "pg": "^8",
    "jsonwebtoken": "^9",
    "bcryptjs": "^2",
    "cors": "^2",
    "dotenv": "^16",
    "express-validator": "^7",
    "helmet": "^7",
    "morgan": "^1",
    "uuid": "^9"
  },
  "devDependencies": {
    "jest": "^29",
    "nodemon": "^3",
    "supertest": "^6"
  }
}
```

**AI Service (requirements.txt):**
```
fastapi==0.110.*
uvicorn==0.29.*
pandas==2.2.*
scikit-learn==1.4.*
httpx==0.27.*
python-dotenv==1.0.*
psycopg2-binary==2.9.*
pytest==8.*
```

---

## Team Role Suggestions (3-4 developers)

| Role | Responsibility |
|---|---|
| **Dev 1 (Frontend Lead)** | React pages, components, Tailwind styling, i18n, responsive design |
| **Dev 2 (Backend Lead)** | Express routes, services, PostgreSQL models, API design |
| **Dev 3 (Full-stack)** | Recommendation engine, buyer matching, logistics — backend logic + frontend display |
| **Dev 4 (AI/Demo)** | Python AI service (forecasting, NLU), demo data, demo script, deployment |

If only 3 developers: Dev 3 and Dev 4 merge.

---

## Daily Standup Checklist

- What did I complete yesterday?
- What am I working on today?
- Am I blocked on anything?
- Is the current phase on track?

## Definition of Done (per Phase)

- [ ] All listed tasks completed
- [ ] Code committed and pushed
- [ ] Basic manual testing done (happy path)
- [ ] No console errors
- [ ] Hindi labels working
- [ ] Mobile responsive
- [ ] Demo data displays correctly
