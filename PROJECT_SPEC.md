# KrishiLink AI — Project Specification

> **Smart India Hackathon 2024**
> **Problem Statement:** 26132 — Strengthening market linkages and price discovery for farmers
> **Team Prototype — Not a theoretical research project**

---

## 1. Problem Statement

Smallholder farmers and Farmer Producer Organizations (FPOs) in India face a persistent information asymmetry when selling their produce. They lack timely visibility into:

| Gap | Impact |
|---|---|
| Current mandi prices across regions | Sell at local mandi even when better prices exist 50 km away |
| Expected future price trends | Distress-sell perishables due to uncertainty |
| Nearby buyer demand | Miss direct-sale opportunities with better margins |
| Quality requirements of buyers | Produce rejected or graded lower at point of sale |
| Buyer reliability & payment history | Non-payment or delayed payment after delivery |
| Transportation costs | Overestimate logistics, avoid distant but profitable mandis |
| Storage options & costs | No cold-storage awareness leads to forced immediate sale |
| Net realization after all costs | Cannot compare selling channels on an apples-to-apples basis |

### Core Questions the Platform Must Answer

1. **Where should I sell?** — Compare mandis, buyers, processors, institutional buyers
2. **Should I sell now or wait?** — Price forecasting with storage cost trade-off
3. **Which buyer is best?** — Deterministic multi-factor buyer scoring
4. **How much money will I actually receive?** — Net realization after all deductions

---

## 2. Target Users

### 2.1 Farmer (Primary User)

**Profile:**
- Smallholder (1-5 acres) or medium farmer (5-15 acres)
- Age range: 25-60
- Limited digital literacy — may only use WhatsApp and YouTube
- Primary language: Hindi (expandable to regional languages)
- Limited English vocabulary
- Limited typing ability — prefers voice and tap
- Feature phone or entry-level smartphone (Android Go / 2-3 GB RAM)

**Accessibility Requirements:**
- Hindi-first interface (all labels, buttons, notifications)
- Mobile-first responsive design (320px–420px viewport)
- Voice input for queries
- Text-to-speech for reading information aloud
- Large tap targets (minimum 48×48 dp, prefer 56×56 dp)
- High-contrast text (minimum 4.5:1 ratio)
- Icon + text on every actionable element
- Minimal typing — dropdowns, selectors, voice wherever possible
- Maximum 2-3 decisions per screen
- Simple linear workflows — no branching navigation

### 2.2 Buyer

**Profile:**
- Mandi traders, commission agents, processors, institutional buyers
- Moderate digital literacy
- Comfortable with Hindi + English mixed interface
- Smartphone with reliable internet

**Capabilities:**
- Post buy requirements (commodity, quantity, quality, price range)
- View and respond to farmer lots
- Negotiate and make offers
- Manage order history
- Build reputation through verified transactions

### 2.3 FPO (Farmer Producer Organization)

**Profile:**
- FPO manager or coordinator
- Manages 50-500+ member farmers
- Moderate-to-good digital literacy
- Needs aggregation and analytics

**Capabilities:**
- View aggregated member production
- Create bulk lots
- Negotiate on behalf of members
- Track payments for all members
- View FPO-level analytics and trends

### 2.4 Administrator

**Profile:**
- Platform operator
- Full digital literacy
- Desktop + mobile access

**Capabilities:**
- Manage users and roles
- Verify buyers
- Monitor platform activity
- View system analytics
- Manage master data (commodities, mandis, rates)
- Flag and moderate content

---

## 3. Core Features

### A. Market Intelligence
- Real-time mandi prices (demo data, architecture for real API)
- Price comparison across nearby mandis
- Historical price data visualization
- Commodity-wise and mandi-wise views

### B. Price Trends
- 7-day, 30-day, 90-day price trend charts
- Seasonal pattern indicators
- Year-over-year comparison

### C. Price Forecasting
- 7-day and 14-day price predictions
- Confidence intervals
- Trend direction (rising / falling / stable)
- Model: Time-series forecasting (ARIMA/Prophet on demo data, upgradable)

### D. Buyer Discovery
- Browse verified buyers by commodity and location
- Filter by distance, price offered, quantity needed
- View buyer profiles and ratings

### E. Verified Buyer Matching
- Deterministic scoring algorithm
- Multi-factor weighted matching
- Sorted recommendations with explanation

### F. Lot Creation
- Farmer creates a "lot" (commodity + quantity + quality + location + photos)
- Voice-assisted lot creation
- Lot visible to matched buyers

### G. Quality Information
- Simple quality parameters per commodity (e.g., moisture %, foreign matter %)
- Visual guides (photo examples of grade A, B, C)
- Quality impact on price explained

### H. Digital Offers
- Buyer makes offer on a farmer's lot
- Farmer sees all offers in a simple comparison view
- Accept / reject / counter

### I. Logistics Estimation
- Distance calculation between farmer location and buyer/mandi
- Estimated transport cost (₹/km/quintal rates)
- Loading/unloading cost estimates

### J. Storage Options
- List nearby cold storage / warehouses (demo data)
- Storage cost estimates
- "Store and sell later" scenario in recommendations

### K. Payment Tracking
- Order status tracking (Offer → Accepted → Dispatched → Delivered → Paid)
- Payment amount and date tracking
- Payment delay alerts

### L. Recommendation Engine
- **Net Realization Calculation** (deterministic, backend code):
  ```
  NET_REALIZATION = Selling_Price × Quantity
                    - Transportation_Cost
                    - Loading_Unloading_Cost
                    - Storage_Cost
                    - Commission/Mandi_Fee
                    - Other_Transaction_Costs
  ```
- Compare across: nearby mandis, verified buyers, processors, institutional buyers, store-and-sell-later
- Return: recommended option, net realization, alternatives, confidence, explanation

### M. Voice Assistant
- Hindi voice input → text transcription
- Intent extraction (NLU)
- Structured query to backend
- Response in Hindi text + text-to-speech

### N. FPO / Admin Analytics
- Member activity dashboard
- Aggregated sales data
- Price trend summaries
- Platform health metrics (admin)

---

## 4. Recommendation Engine — Detailed Specification

### 4.1 Architecture Rule

> **CRITICAL:** No LLM shall perform financial arithmetic.
> All net realization calculations are deterministic backend functions.
> LLMs are used ONLY for:
> - Natural language understanding (voice query → structured intent)
> - Generating human-readable Hindi explanations of results

### 4.2 Net Realization Formula

```
For each selling option S:

  gross_revenue(S) = offered_price(S) × quantity

  transport_cost(S) = distance_km(S) × rate_per_km_per_quintal × quantity
  loading_cost(S) = rate_per_quintal_loading × quantity
  commission(S) = gross_revenue(S) × commission_rate(S)
  storage_cost(S) = daily_rate × days × quantity  // only for store-and-sell-later

  net_realization(S) = gross_revenue(S)
                       - transport_cost(S)
                       - loading_cost(S)
                       - commission(S)
                       - storage_cost(S)
                       - other_fees(S)
```

### 4.3 Comparison Output

```json
{
  "recommended": {
    "option_type": "verified_buyer",
    "buyer_name": "Sharma Traders",
    "net_realization": 125000,
    "gross_price": 135000,
    "total_deductions": 10000,
    "deduction_breakdown": {
      "transportation": 4000,
      "loading_unloading": 1500,
      "commission": 3500,
      "storage": 0,
      "other": 1000
    },
    "confidence_score": 0.85,
    "explanation_hi": "शर्मा ट्रेडर्स से बेचने पर आपको सबसे ज्यादा ₹1,25,000 मिलेंगे..."
  },
  "alternatives": [],
  "additional_realization_vs_local": 8500
}
```

---

## 5. Buyer Matching — Detailed Specification

### 5.1 Scoring Weights (Configurable)

| Factor | Weight | Description |
|---|---|---|
| Price Offered | 40% | Higher price → higher score |
| Distance | 20% | Closer → higher score (inverse) |
| Quantity Match | 15% | Buyer needs ≈ farmer has → higher score |
| Quality Match | 10% | Buyer quality requirement met → higher score |
| Payment Reliability | 10% | Historical on-time payment rate |
| Delivery Compatibility | 5% | Pickup offered, flexible dates, etc. |

### 5.2 Normalization

Each factor is normalized to [0, 1] using min-max scaling within the candidate set.

### 5.3 Score Calculation

```
buyer_score = Σ (weight_i × normalized_score_i)
```

### 5.4 Configurability

- Weights stored in database configuration table
- Admin can adjust via admin panel
- Future: per-commodity or per-region weight profiles

---

## 6. AI Agents / Services

### 6.1 Farmer Voice Agent
**Responsibility:** Accept Hindi voice input, transcribe, extract intent and entities
**Input:** Audio blob or text
**Output:** Structured intent object `{ intent, commodity, quantity, location, ... }`
**Technology:** Google Speech-to-Text API (or Web Speech API for demo) + LLM for intent extraction

### 6.2 Market Intelligence Agent
**Responsibility:** Serve current and historical mandi price data, compute trends
**Input:** Commodity, location, date range
**Output:** Price data, trend direction, statistics
**Technology:** PostgreSQL queries + statistical calculations in Python

### 6.3 Buyer Matching Agent
**Responsibility:** Execute deterministic buyer scoring for a given lot
**Input:** Farmer lot details (commodity, quantity, quality, location)
**Output:** Ranked buyer list with scores and breakdowns
**Technology:** Deterministic algorithm in Express backend

### 6.4 Logistics Agent
**Responsibility:** Estimate transportation, loading, storage costs
**Input:** Origin, destination, quantity, commodity type
**Output:** Cost breakdown object
**Technology:** Distance matrix (Leaflet/OpenStreetMap) + configurable rate tables in DB

### 6.5 Recommendation Agent
**Responsibility:** Orchestrate all agents, compute net realization for each option, rank and recommend
**Input:** Farmer's selling scenario (commodity, quantity, quality, location, urgency)
**Output:** Ranked options with net realization, confidence, and Hindi explanation
**Technology:** Express backend (orchestration + arithmetic) + LLM API (explanation generation only)

---

## 7. Data Strategy

### 7.1 Demo Data

| Dataset | Source | Notes |
|---|---|---|
| Mandi prices | Simulated based on real patterns | Clearly labeled "प्रदर्शन डेटा" |
| Commodity master | Curated list of 15-20 major crops | Real names and units |
| Mandi master | 20-30 real mandi names with approximate coordinates | Real locations, simulated prices |
| Buyers | Simulated buyer profiles | Diverse types |
| Farmers | Simulated farmer profiles | Different regions and crops |
| Transport rates | Approximate ₹/km/quintal rates | Based on published estimates |
| Storage rates | Approximate ₹/quintal/day rates | Based on published estimates |

### 7.2 Real Data Integration Path

```
Demo Data Layer (current)
    ↓ replace with
Adapter/Interface Layer
    ↓ connects to
Real APIs:
  - Agmarknet (mandi prices)
  - eNAM API
  - India Post / Google Maps (distance)
  - WDRA (warehouses)
```

### 7.3 Data Labeling

Every screen showing demo data must display:
```
⚠️ प्रदर्शन डेटा — Demo Data
यह वास्तविक सरकारी डेटा नहीं है
```

---

## 8. Security Requirements

| Requirement | Implementation |
|---|---|
| Authentication | JWT-based login with phone number + OTP (simulated OTP for demo) |
| Role-Based Access Control | 4 roles: farmer, buyer, fpo, admin — middleware-enforced |
| Farmer Data Protection | Farmer's personal data (phone, location) not exposed to buyers until offer accepted |
| Buyer Verification | Admin-approved verification flow; unverified buyers marked clearly |
| Input Validation | Server-side validation on all endpoints; sanitize all user inputs |
| API Authorization | JWT middleware on all protected routes; role-based route guards |
| Environment Variables | All secrets (DB password, API keys, JWT secret) in `.env`, never committed |
| Secure Secrets | `.env` in `.gitignore`; `.env.example` committed with placeholder values |
| Audit Logs | Log all critical actions (login, offer, accept, payment) with timestamp and user ID |
| HTTPS | Required for production; optional for local dev |

---

## 9. Non-Functional Requirements

| Requirement | Target |
|---|---|
| Mobile performance | First Contentful Paint < 2s on 3G |
| Bundle size | < 500 KB initial JS bundle |
| Offline awareness | Show cached data with "offline" indicator; no offline-first requirement for prototype |
| Concurrent users | Handle 50 concurrent users (demo scale) |
| Database | Single PostgreSQL instance, no sharding needed |
| Availability | Not an SLA concern for prototype |
| Localization | Hindi primary, English secondary; architecture supports additional languages |

---

## 10. Out of Scope (for Prototype)

- Real payment gateway integration
- Real OTP SMS gateway
- Real government API integration
- Multi-language beyond Hindi/English
- iOS native app
- Offline-first PWA
- Real-time chat between farmer and buyer
- Blockchain-based contracts
- Drone/satellite imagery
- Weather integration (can be added as enhancement)
