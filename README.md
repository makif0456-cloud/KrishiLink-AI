# KrishiLink AI (कृषि लिंक) 🌾

> **Smart India Hackathon (SIH) Problem Statement:** 26132 — Strengthening market linkages and price discovery for farmers.

KrishiLink AI empowers smallholder farmers and FPOs with Hindi-first, mobile-friendly market price discovery, verified buyer matching, and deterministic net realization calculations.

---

## 🏗️ Architecture

- **Frontend:** React, Vite, Tailwind CSS, Lucide Icons, React Router
- **Backend:** Node.js, Express, REST API, JSON Web Token (JWT), Role-Based Access Control (RBAC)
- **Database:** PostgreSQL (13-Table Schema) + In-Memory Fallback Demo Store
- **AI Service:** Python, FastAPI, scikit-learn, pandas

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
cd server
npm install
npm run dev
```

Server will run at `http://localhost:3001` (Health check: `http://localhost:3001/health`).

### 2. Frontend Setup

```bash
cd client
npm install
npm run dev
```

Frontend will run at `http://localhost:5173`.

---

## 👥 Demo Accounts (Pre-configured)

| Role | Name | Phone | Password / OTP |
|---|---|---|---|
| **Farmer (किसान)** | रामप्रसाद पटेल | `9876543210` | `Password@123` or OTP `123456` |
| **Buyer (खरीदार)** | शर्मा ट्रेडर्स | `9876543211` | `Password@123` or OTP `123456` |
| **FPO (किसान संघ)** | किसान उत्पादक संघ | `9876543212` | `Password@123` or OTP `123456` |
| **Admin (एडमिन)** | सिस्टम एडमिन | `9876543200` | `Password@123` or OTP `123456` |

---

## ⚠️ Data Disclaimer

Every screen displays:
`⚠️ प्रदर्शन डेटा — Demo Data: यह वास्तविक सरकारी डेटा नहीं है`
