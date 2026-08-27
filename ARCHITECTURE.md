# KrishiLink AI — Architecture

> A practical overview of how KrishiLink AI is structured and how its main components work together.

## 1. Overview

KrishiLink AI is designed as a digital marketplace and decision-support platform for farmers, buyers, FPOs, and administrators.

The system combines:

- A simple, mobile-friendly React interface
- A Node.js and Express backend
- PostgreSQL for storing application data
- A Python FastAPI service for AI-related features
- Gemini/LLM-based voice and natural-language assistance
- Deterministic business logic for pricing, matching, and financial calculations

The platform is designed with a **Hindi-first and farmer-friendly experience**, especially for users who may not be comfortable with complex apps or typing.

---

## 2. High-Level Architecture

```text
                         ┌──────────────────────┐
                         │       Users          │
                         │                      │
                         │ Farmers / Buyers     │
                         │ FPOs / Admins        │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   KrishiLink AI      │
                         │   Web Application    │
                         │                      │
                         │ React + Vite         │
                         │ Tailwind CSS          │
                         │ React Router          │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Backend API        │
                         │                      │
                         │ Node.js + Express    │
                         │ REST APIs             │
                         │ JWT + RBAC            │
                         └──────────┬───────────┘
                                    │
                  ┌─────────────────┼─────────────────┐
                  │                 │                 │
                  ▼                 ▼                 ▼
        ┌────────────────┐ ┌────────────────┐ ┌────────────────┐
        │  PostgreSQL    │ │  Python AI     │ │ External AI    │
        │    Database    │ │    Service     │ │    Services    │
        │                │ │                │ │                │
        │ Users          │ │ FastAPI        │ │ Gemini / LLM   │
        │ Lots           │ │ Forecasting    │ │ Voice/NLU      │
        │ Offers         │ │ NLU            │ │ Explanations   │
        │ Orders         │ │ Analytics      │ │                │
        │ Payments       │ │                │ │                │
        └────────────────┘ └────────────────┘ └────────────────┘
 3. Frontend Architecture

The frontend is built using React + Vite and focuses on simplicity, accessibility, and mobile usability.

Main technologies
React
Vite
Tailwind CSS
React Router
Lucide Icons
Recharts
Leaflet
Main user roles

The frontend provides different experiences for:

🌾 Farmers
🛒 Buyers
🏢 FPOs
🔐 Administrators
Farmer-focused design

The farmer interface uses:

Large buttons
Simple navigation
Hindi/English language support
Visual commodity selection
Step-by-step forms
Voice-based interaction
Simple explanations instead of technical terminology

This is especially important because KrishiLink AI is designed to be usable even by farmers who may have limited digital literacy.

4. Backend Architecture

The backend is built using Node.js and Express.

It acts as the main API layer between the frontend, database, and AI services.

Main responsibilities

The backend handles:

Authentication
User management
Role-based access control
Market prices
Farmer lots
Buyer requirements
Offers and counter-offers
Orders
Payments
Buyer matching
Recommendations
Logistics calculations
Voice assistant requests
Analytics
Audit logs
Backend structure
server/
│
├── src/
│   ├── index.js
│   ├── app.js
│   │
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── models/
│   └── utils/
│
├── db/
│   ├── schema.sql
│   └── seed.sql
│
└── tests/

The service layer keeps important business logic separate from the API routes, making the application easier to maintain and test.

5. Database Architecture

KrishiLink AI uses PostgreSQL as its primary database.

The database stores information about users, commodities, markets, farmer lots, offers, orders, payments, buyers, logistics, and platform activity.

Main entities
Users
  │
  ├── Lots
  │     │
  │     └── Offers
  │            │
  │            └── Orders
  │                   │
  │                   └── Payments
  │
  ├── Buyer Requirements
  │
  └── Buyer Ratings

Commodities
  │
  └── Mandi Prices

Mandis
  │
  └── Mandi Prices

Storage Facilities
Transport Rates
Platform Configuration
Audit Logs

The project uses a structured 13-table PostgreSQL schema to support the marketplace workflow.

6. AI Architecture

AI is used where it adds value, but important financial and business decisions are handled using deterministic backend logic.

AI is used for
Hindi voice/text understanding
Intent detection
Commodity name recognition
Natural-language responses
Hindi explanations
Voice assistant interactions
Price forecasting
Market insights
AI is NOT responsible for
Calculating final prices
Financial calculations
Transport cost calculations
Buyer ranking
Net realization calculations
Sorting offers
Transaction amounts

These calculations are performed by backend services to keep the results predictable and reliable.

7. Voice Assistant

Voice interaction is one of the important features of KrishiLink AI.

A farmer can ask questions in natural language, for example:

"मेरे पास 50 क्विंटल गेहूं है,
सबसे अच्छी जगह कहाँ बेचूं?"

The flow is:

Farmer speaks
      ↓
Browser speech recognition
      ↓
Text generated
      ↓
Backend Voice API
      ↓
AI / Gemini
      ↓
Intent + entities extracted
      ↓
Backend processes the request
      ↓
Market / Buyer / Recommendation services
      ↓
Results calculated
      ↓
AI generates simple explanation
      ↓
Response shown to farmer
      ↓
Text-to-speech
      ↓
Farmer hears the answer

The goal is to allow farmers to interact with the platform without having to navigate through multiple screens or type complicated queries.

8. Recommendation Engine

The recommendation system helps farmers understand where they may get better value for their produce.

For example, when a farmer enters:

Commodity: Wheat
Quantity: 50 Quintals
Quality: Grade A
Location: Farmer's location

The system can evaluate:

Nearby mandi prices
Available buyers
Buyer offers
Distance
Transport costs
Loading costs
Commission
Storage costs
Price trends

The recommendation engine then calculates the estimated net realization.

Gross Sale Value
        ↓
- Transport Cost
- Loading Cost
- Commission
- Storage Cost
        ↓
Net Realization
        ↓
Rank Available Options
        ↓
Recommended Selling Option

The important calculations are performed by the backend rather than being generated by the AI model.

9. Buyer Matching

KrishiLink AI can match farmer lots with buyers based on several factors.

Example factors include:

Commodity
Required quantity
Offered price
Quality requirements
Distance
Pickup availability
Delivery radius
Buyer verification
Other configurable matching criteria

A deterministic scoring system is used so that the same input produces consistent results.

Farmer Lot
    ↓
Find compatible buyers
    ↓
Check commodity
    ↓
Check quantity
    ↓
Check quality
    ↓
Check price
    ↓
Check location/logistics
    ↓
Calculate buyer score
    ↓
Rank buyers
10. Marketplace Workflow

The core marketplace flow is:

Farmer creates a lot
        ↓
Lot becomes available
        ↓
Matching buyers are identified
        ↓
Buyer views the lot
        ↓
Buyer makes an offer
        ↓
Farmer accepts / rejects / counters
        ↓
Offer accepted
        ↓
Order created
        ↓
Payment process
        ↓
Delivery / completion
        ↓
Buyer rating

This creates a complete digital journey from listing produce to completing a transaction.

11. API Structure

The backend exposes REST APIs for the major features of the platform.

Authentication
POST   /auth/register
POST   /auth/login
POST   /auth/send-otp
POST   /auth/verify-otp
GET    /auth/me
PUT    /auth/profile
Market
GET    /market/prices
GET    /market/prices/trends
GET    /market/prices/compare
GET    /market/commodities
GET    /market/mandis
GET    /market/mandis/nearby
Lots
POST   /lots
GET    /lots
GET    /lots/:id
PUT    /lots/:id
DELETE /lots/:id
GET    /lots/my
Offers
POST   /offers
GET    /offers/lot/:lotId
GET    /offers/my
PUT    /offers/:id/accept
PUT    /offers/:id/reject
PUT    /offers/:id/counter
PUT    /offers/:id/withdraw
Orders & Payments
GET    /orders
GET    /orders/:id
PUT    /orders/:id/status

POST   /payments
GET    /payments/order/:orderId
Recommendations
POST   /recommendations/sell
POST   /recommendations/buyers
Voice Assistant
POST   /voice/query
12. Security

Security is handled at multiple levels.

Authentication

Users authenticate using JWT-based authentication.

Login
  ↓
Credentials verified
  ↓
JWT generated
  ↓
JWT sent with API requests
  ↓
Backend verifies JWT
Role-Based Access Control

Different users have different permissions.

Feature	Farmer	Buyer	FPO	Admin
Own profile	✅	✅	✅	✅
Create lot	✅	❌	✅	✅
Make offer	❌	✅	❌	✅
Manage orders	✅	✅	❌	✅
Buyer verification	❌	❌	❌	✅
Platform analytics	❌	❌	❌	✅

Sensitive operations are protected using authentication and role-based authorization.

13. Deployment Architecture

KrishiLink AI is deployed as a web application and does not require users to run the project locally.

The production/demo frontend is hosted on Vercel.

The application communicates with its deployed backend and database services through configured environment variables.

                         Internet
                            │
                            ▼
                  ┌───────────────────┐
                  │      Vercel       │
                  │  KrishiLink AI    │
                  │    Frontend       │
                  └─────────┬─────────┘
                            │
                            ▼
                  ┌───────────────────┐
                  │   Backend APIs    │
                  │ Node.js/Express   │
                  └─────────┬─────────┘
                            │
             ┌──────────────┼──────────────┐
             ▼              ▼              ▼
       ┌──────────┐   ┌────────────┐   ┌──────────┐
       │PostgreSQL│   │ Python AI  │   │ Gemini / │
       │ Database │   │  Service   │   │ LLM APIs │
       └──────────┘   └────────────┘   └──────────┘
Production environment

Environment-specific values such as:

Database connection strings
JWT secrets
AI API keys
Backend URLs
AI service URLs

are stored as environment variables rather than being committed to GitHub.

14. Testing

Testing focuses on the most important business operations.

Core tests
Buyer matching
Recommendation calculations
Net realization
Logistics calculations
Offer lifecycle
Order lifecycle
Authentication
RBAC
Market APIs
Voice processing
Important integration flow
Create Lot
    ↓
Find Buyers
    ↓
Make Offer
    ↓
Counter Offer
    ↓
Accept Offer
    ↓
Create Order
    ↓
Payment
    ↓
Complete Transaction

The complete flow is tested to ensure that different parts of the platform work together correctly.

15. Handling AI Failures

AI services can sometimes experience rate limits, network problems, or inaccurate speech recognition.

KrishiLink AI therefore uses fallback strategies where possible.

Examples:

Voice input can fall back to text input.
Common queries can use predefined responses.
Important calculations do not depend on the LLM.
Forecasts are clearly presented as estimates.
AI-generated responses are based on backend-computed results.

This prevents an AI failure from breaking the core marketplace functionality.

16. Design Principles

KrishiLink AI follows a few important principles.

🌾 Farmer First

The platform should be understandable even for users with limited digital experience.

🇮🇳 Hindi First

Hindi is treated as a first-class language rather than simply translating an English interface.

🎤 Voice First for Accessibility

Voice interaction allows farmers to ask questions without typing.

💰 Transparent Recommendations

Farmers should be able to understand why an option is recommended and what costs are involved.

🔒 Secure by Design

Authentication, authorization, and environment secrets are handled separately from application code.

🤖 AI with Boundaries

AI helps with language understanding and explanations, while important business and financial calculations remain deterministic.

📱 Mobile Friendly

The interface is designed primarily for smartphones and low-complexity interactions.

17. Future Improvements

Possible future improvements include:

Real-time mandi price APIs
Better price forecasting models
Regional language support beyond Hindi
WhatsApp-based farmer assistance
More advanced buyer verification
Digital payment integration
Logistics partner integration
Government scheme information
Offline-first capabilities
Improved voice recognition for regional accents
