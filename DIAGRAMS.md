# 🌾 KrishiLink AI — Presentation Architecture & Workflows
> **Smart India Hackathon (SIH Problem Statement 26132)**  
> *Strengthening market linkages and price discovery for farmers.*

---

## 1. System Architecture Diagram (4-Tier Separation)

```mermaid
graph TB
    subgraph Tier1["1. Presentation Tier (Mobile & Hindi-First)"]
        FarmerUI["🌾 Farmer Portal<br/>(Voice, Lots, Mandi Prices)"]
        BuyerUI["🛒 Buyer Dashboard<br/>(Requirements, Counter-Offers)"]
        FpoUI["🏢 FPO Aggregator<br/>(Bulk Pooling & Logistics)"]
        AdminUI["🔐 Admin Console<br/>(Audit Logs & Verification)"]
    end

    subgraph Tier2["2. API Gateway & Core Engine (Node.js / Express)"]
        Gateway["Express API Gateway & Router"]
        AuthModule["JWT Auth & Role-Based Access Control (RBAC)"]
        TradingEngine["Deterministic Trading & Symmetrical Offer Engine"]
        NetRealization["Net Realization & Cost Calculator (No AI Drift)"]
        BuyerMatcher["Rule-Based Buyer Matching Engine"]
        VoiceSocket["WebSocket Live Audio Server (ws / 16kHz PCM)"]
    end

    subgraph Tier3["3. Intelligence & External Services Tier"]
        GeminiAPI["Google Gemini 1.5 / Flash<br/>(Hindi NLU, Intent & Audio TTS)"]
        PythonAI["Python FastAPI Microservice<br/>(ARMA Price Forecasting & Pandas)"]
    end

    subgraph Tier4["4. Data & Persistence Tier"]
        PostgresDB[("Neon Cloud PostgreSQL<br/>13-Table Schema (ACID Compliant)")]
        MemoryFallback[("In-Memory Demo Store<br/>Zero-Downtime Fallback")]
    end

    FarmerUI & BuyerUI & FpoUI & AdminUI -->|REST HTTPS| Gateway
    FarmerUI <==>|WebSocket WSS (PCM Streaming)| VoiceSocket
    Gateway --> AuthModule
    Gateway --> TradingEngine
    Gateway --> NetRealization
    Gateway --> BuyerMatcher
    VoiceSocket --> GeminiAPI
    Gateway -->|HTTP REST| PythonAI
    Gateway -->|pg pool| PostgresDB
    Gateway -.->|Auto-fallback if offline| MemoryFallback
```

---

## 2. End-to-End Trading & Symmetrical Counter-Offer Lifecycle

```mermaid
sequenceDiagram
    autonumber
    actor Farmer as 🌾 Farmer
    participant System as ⚙️ KrishiLink Backend
    actor Buyer as 🛒 Verified Buyer
    participant DB as 🗄️ PostgreSQL

    Farmer->>System: 1. Post Crop Lot (100 Qtl Wheat, ₹2,400/Qtl min)
    System->>DB: Save lot & trigger Buyer Matcher
    System-->>Buyer: 2. Ranked notification of compatible farmer produce
    Buyer->>System: 3. Make Offer (₹2,450/Qtl, Pick-up included)
    System-->>Farmer: 4. Instant notification of new buyer offer
    Farmer->>System: 5. Symmetrical Counter-Offer (₹2,480/Qtl)
    System-->>Buyer: 6. Counter-Offer visible on Buyer Dashboard
    Buyer->>System: 7. Accept Counter-Offer
    System->>DB: Advance Offer to "ACCEPTED"
    System->>DB: 8. Automatically generate Order & Audit Trail
    Note over System,DB: State Transition: Confirmed → Dispatched → Delivered
    Buyer->>System: 9. Record Payment & Delivery Inspection
    System->>DB: Order marked COMPLETED & Farmer paid
```

---

## 3. Multimodal Hindi Voice Assistant Pipeline

```mermaid
flowchart LR
    A["🗣️ Farmer speaks in Hindi<br/>'गेहूं का भाव क्या है?'"] --> B["🎤 Browser Web Audio API<br/>(16kHz Audio Stream)"]
    B --> C["⚡ WebSocket / Express Gateway<br/>(/api/v1/voice/live)"]
    C --> D["🧠 Google Gemini Multimodal<br/>(NLU + Entity Extraction)"]
    D --> E["📊 Internal Pricing Engine<br/>(Mandi DB + Net Realization)"]
    E --> F["📝 Response Formatted in Hindi"]
    F --> G["🔊 Web Speech Synthesis / TTS<br/>(Audio spoken back to farmer)"]
```

---

## 4. Farmgate Net Realization vs. Mandi Cost Model

```mermaid
flowchart TD
    Produce["Farmer Enters Produce: 50 Qtl Soybean"] --> MandiBranch["Option 1: APMC Mandi"]
    Produce --> DirectBranch["Option 2: Direct Buyer on KrishiLink"]

    MandiBranch --> MPrice["Mandi Price: ₹4,800/Qtl"]
    MPrice --> MSub["Deduct: 2.5% Commission + Loading + Freight"]
    MSub --> MNet["Mandi Net: ₹4,520/Qtl"]

    DirectBranch --> DPrice["Direct Buyer Offer: ₹4,750/Qtl"]
    DPrice --> DSub["Deduct: ₹0 Commission (Farmgate Pickup)"]
    DSub --> DNet["Direct Net: ₹4,750/Qtl"]

    MNet & DNet --> Decision{"KrishiLink Recommendation Engine"}
    Decision --> Recommendation["💡 Recommendation: Sell Directly to Buyer<br/>(+₹230/Quintal Extra In-Pocket Profit)"]
```
