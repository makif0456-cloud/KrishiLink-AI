"""
KrishiLink AI - Python AI Service (FastAPI)
Provides price forecasting (deterministic time-series analysis) and Hindi NLU.
CRITICAL RULE: AI service NEVER performs financial arithmetic or transaction calculations.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import math
import re

app = FastAPI(
    title="KrishiLink AI Service",
    description="Intelligent Price Forecasting and Hindi NLU Assistance for Indian Farmers",
    version="1.0.0-phase4"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------------------
# Data Models
# -------------------------------------------------------------
class HistoricalPricePoint(BaseModel):
    price_date: str
    modal_price: float
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    arrivals_tonnes: Optional[float] = None

class ForecastRequest(BaseModel):
    commodity_id: str
    commodity_name: Optional[str] = "Wheat"
    mandi_id: Optional[str] = None
    mandi_name: Optional[str] = None
    horizon_days: Optional[int] = Field(default=15, ge=1, le=90)
    historical_prices: Optional[List[HistoricalPricePoint]] = None

class NLURequest(BaseModel):
    text: str
    user_role: Optional[str] = "farmer"
    context: Optional[Dict[str, Any]] = None

# Commodity mappings for Hindi, Hinglish, and English
COMMODITY_MAPPINGS = {
    "wheat": ["गेहूं", "गेंहू", "गेहू", "wheat", "gehu", "gehun", "kanak"],
    "soybean": ["सोयाबीन", "सोया", "soybean", "soya", "soyabean"],
    "mustard": ["सरसों", "राई", "sarson", "mustard", "rai", "toria"],
    "chana": ["चना", "छोला", "chana", "gram", "chickpea"],
    "onion": ["प्याज", "प्याज़", "कांदा", "onion", "pyaz", "kanda"],
    "rice": ["चावल", "धान", "rice", "paddy", "dhan", "chawal"],
    "cotton": ["कपास", "रूई", "cotton", "kapas"]
}

COMMODITY_IDS = {
    "wheat": "b0000000-0000-0000-0000-000000000001",
    "soybean": "b0000000-0000-0000-0000-000000000002",
    "mustard": "b0000000-0000-0000-0000-000000000003",
    "chana": "b0000000-0000-0000-0000-000000000004",
    "onion": "b0000000-0000-0000-0000-000000000005",
    "rice": "b0000000-0000-0000-0000-000000000006",
    "cotton": "b0000000-0000-0000-0000-000000000007"
}

COMMODITY_DISPLAY_HI = {
    "wheat": "गेहूं (Wheat)",
    "soybean": "सोयाबीन (Soybean)",
    "mustard": "सरसों (Mustard)",
    "chana": "चना (Chana)",
    "onion": "प्याज (Onion)",
    "rice": "धान / चावल (Paddy/Rice)",
    "cotton": "कपास (Cotton)"
}

MANDI_MAPPINGS = {
    "bhopal": ["भोपाल", "bhopal", "karond"],
    "indore": ["इंदौर", "इन्दौर", "indore"],
    "sehore": ["सीहोर", "sehore"],
    "dewas": ["देवास", "dewas"],
    "ujjain": ["उज्जैन", "ujjain"],
    "vidisha": ["विदिशा", "vidisha"]
}

# -------------------------------------------------------------
# Health Check
# -------------------------------------------------------------
@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "KrishiLink AI Python Microservice",
        "version": "1.0.0-phase4",
        "is_demo_mode": True,
        "disclaimer": "⚠️ प्रदर्शन डेटा — Demo Data: यह वास्तविक सरकारी डेटा नहीं है",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/api/v1/health")
def api_health():
    return health_check()

# -------------------------------------------------------------
# Phase 4: Hindi Natural Language Understanding (NLU) Service
# -------------------------------------------------------------
@app.post("/api/v1/nlu")
def parse_natural_language(req: NLURequest):
    """
    Parses Hindi / Hinglish / English natural language queries from farmers.
    Extracts intents, entities, and produces deterministic structured tokens.
    """
    query = (req.text or "").strip().lower()
    if not query:
        raise HTTPException(status_code=400, detail="Query text cannot be empty")

    entities = {
        "commodity": None,
        "commodity_id": None,
        "commodity_name_hi": None,
        "mandi": None,
        "timeframe_days": 15
    }

    # 1. Extract Commodity Entity (From Query or Inherit from Context)
    for comm_key, synonyms in COMMODITY_MAPPINGS.items():
        for syn in synonyms:
            if syn in query:
                entities["commodity"] = comm_key
                entities["commodity_id"] = COMMODITY_IDS.get(comm_key)
                entities["commodity_name_hi"] = COMMODITY_DISPLAY_HI.get(comm_key)
                break
        if entities["commodity"]:
            break

    # Context Inheritance if entity not mentioned in current turn
    if not entities["commodity"] and req.context:
        ctx_comm = req.context.get("commodity") or req.context.get("commodity_id")
        if ctx_comm:
            for k, cid in COMMODITY_IDS.items():
                if ctx_comm in [k, cid]:
                    entities["commodity"] = k
                    entities["commodity_id"] = cid
                    entities["commodity_name_hi"] = COMMODITY_DISPLAY_HI.get(k)
                    break

    # 2. Extract Mandi Entity
    for mandi_key, synonyms in MANDI_MAPPINGS.items():
        for syn in synonyms:
            if syn in query:
                entities["mandi"] = mandi_key
                break
        if entities["mandi"]:
            break

    if not entities["mandi"] and req.context and req.context.get("mandi"):
        entities["mandi"] = req.context.get("mandi")

    # 3. Intent Detection using Pattern & Keyword Analysis
    intent = "general_help"
    confidence = 0.85
    suggested_action = None

    # Intent 0: Greetings & Welcome (नमस्ते, नमस्कार, राम राम, प्रणाम, hello, hi, help, सहायता)
    if any(w in query for w in ["नमस्ते", "नमस्कार", "राम राम", "प्रणाम", "सुप्रभात", "hello", "hi", "hey", "help", "मदद", "सहायता", "कौन हो"]):
        intent = "greeting"
        confidence = 0.98
        suggested_action = "view_help"

    # Intent A: Selling Recommendation & Net Realization (विकल्प, कहाँ बेचूँ, सिफारिश, अच्छा विकल्प, बेचना, सही समय, फायदा, मुनाफा)
    elif any(w in query for w in ["विकल्प", "कहाँ बेचूँ", "कहा बेचू", "कहाँ बेचना", "फायदा", "सिफारिश", "अच्छा विकल्प", "कहाँ फायदा", "बेचना चाहिए", "recommendation", "best option", "best market", "लाभ", "ज्यादा मुनाफा", "मुनाफा"]):
        intent = "selling_recommendation"
        confidence = 0.96
        suggested_action = "view_recommendations"

    # Intent B: Price Forecast (भविष्य, अनुमान, पूर्वानुमान, आगे क्या, बढ़ेगा, घटेगा, 15 दिन, forecast, trend)
    elif any(w in query for w in ["भविष्य", "अनुमान", "पूर्वानुमान", "आगे क्या", "आगे का", "बढ़ेगा", "घटेगा", "15 दिन", "forecast", "trend", "अगले 15", "आने वाले दिन"]) or bool(re.search(r'(^|\s)कल(\s|$| का| के| को)', query)):
        intent = "price_forecast"
        confidence = 0.95
        suggested_action = "view_forecast"

    # Intent C: Order Status / My Orders (ऑर्डर, आर्डर, स्थिति, स्टेटस, डिलीवरी, क्या हुआ)
    elif any(w in query for w in ["ऑर्डर", "आर्डर", "order", "स्थिति", "स्टेटस", "डिलीवरी", "क्या हुआ मेरे ऑर्डर", "क्या स्टेटस है", "क्या हुआ"]):
        intent = "order_status"
        confidence = 0.94
        suggested_action = "view_orders"

    # Intent D: Offers received (प्रस्ताव, ऑफर, बोली, offer)
    elif any(w in query for w in ["प्रस्ताव", "ऑफर", "offer", "बोली", "कितने प्रस्ताव", "कितने ऑफर", "ऑफर आए"]):
        intent = "my_offers"
        confidence = 0.94
        suggested_action = "view_offers"

    # Intent E: Buyer Matching (खरीदार, व्यापारी, बायर, कौन खरीदेगा, buyer)
    elif any(w in query for w in ["खरीदार", "व्यापारी", "बायर", "buyer", "कौन खरीदेगा", "सबसे अच्छा खरीदार"]):
        intent = "buyer_matching"
        confidence = 0.94
        suggested_action = "view_buyers"

    # Intent F: My Lots / Produce (मेरी फसल, मेरे लॉट, फसल कितनी, my crop, my lot)
    elif any(w in query for w in ["मेरी फसल", "मेरे लॉट", "कितना क्विंटल", "मेरी उपज", "my lot", "my crop", "कौन सी फसल"]):
        intent = "my_lots"
        confidence = 0.92
        suggested_action = "view_my_lots"

    # Intent G: Create New Lot (नई फसल, फसल बेचना है, लिस्ट करना, create lot, sell new)
    elif any(w in query for w in ["नई फसल", "फसल बेचना है", "बेचना चाहता हूँ", "लिस्ट", "नया लॉट", "sell crop", "create lot"]):
        intent = "create_lot"
        confidence = 0.92
        suggested_action = "create_lot"

    # Intent H: Market Price Discovery (भाव, कीमत, रेट, दाम, मूल्य, price, rate, mandi, मंडी)
    elif any(w in query for w in ["भाव", "कीमत", "रेट", "दाम", "मूल्य", "price", "rate", "mandi", "मंडी", "मण्डी"]):
        intent = "market_price"
        confidence = 0.95
        suggested_action = "view_prices"

    # Default fallback: if a commodity is mentioned without explicit action, default to market_price
    elif entities["commodity"]:
        intent = "market_price"
        confidence = 0.88
        suggested_action = "view_prices"

    return {
        "query": req.text,
        "intent": intent,
        "entities": entities,
        "confidence": confidence,
        "suggested_action": suggested_action,
        "clarification_needed": None if entities["commodity"] or intent in ["my_lots", "my_orders", "order_status", "my_offers", "create_lot", "general_help", "greeting"] else "आप किस फसल के बारे में जानना चाहते हैं? (जैसे: गेहूं, सोयाबीन, सरसों)"
    }

# -------------------------------------------------------------
# Phase 3: Time-Series Price Forecasting
# -------------------------------------------------------------
@app.post("/api/v1/forecast")
def generate_forecast(req: ForecastRequest):
    """
    Deterministic Time-Series Price Forecasting
    Calculates moving linear momentum, seasonality variance, and confidence intervals.
    """
    horizon = req.horizon_days or 15
    
    # 1. Base prices baseline
    base_price = 2550.0
    prices_history = []
    
    if req.historical_prices and len(req.historical_prices) > 0:
        prices_history = [p.modal_price for p in req.historical_prices if p.modal_price > 0]
        if len(prices_history) > 0:
            base_price = prices_history[-1]
    else:
        # Generate representative 14-day history for demo baseline
        for i in range(14, 0, -1):
            past_date = (datetime.now() - timedelta(days=i)).strftime("%Y-%m-%d")
            p = base_price - (i * 4.5) + (math.sin(i / 2.0) * 12.0)
            prices_history.append(round(p, 1))

    # 2. Linear Trend & Slope estimation
    n = len(prices_history)
    x = list(range(n))
    y = prices_history
    x_mean = sum(x) / float(n)
    y_mean = sum(y) / float(n)
    
    numerator = sum((x[i] - x_mean) * (y[i] - y_mean) for i in range(n))
    denominator = sum((x[i] - x_mean) ** 2 for i in range(n))
    slope = (numerator / denominator) if denominator != 0 else 1.2
    
    # Clamp slope to realistic agricultural price drift (max 0.8% per day)
    max_slope = base_price * 0.008
    slope = max(-max_slope, min(max_slope, slope))
    
    forecast_points = []
    current_date = datetime.now()
    
    for day in range(1, horizon + 1):
        target_date = (current_date + timedelta(days=day)).strftime("%Y-%m-%d")
        
        seasonal_factor = math.sin(day / 3.5) * (base_price * 0.005)
        predicted_modal = round(base_price + (slope * day) + seasonal_factor, 1)
        
        uncertainty = round((base_price * 0.015) + (day * 3.5), 1)
        min_est = round(predicted_modal - uncertainty, 1)
        max_est = round(predicted_modal + uncertainty, 1)
        
        confidence_pct = max(60, round(95 - (day * 0.45)))
        
        forecast_points.append({
            "date": target_date,
            "day_offset": day,
            "predicted_modal_price": predicted_modal,
            "min_estimate": min_est,
            "max_estimate": max_est,
            "confidence_pct": confidence_pct
        })
        
    start_price = base_price
    end_price = forecast_points[-1]["predicted_modal_price"]
    change_pct = round(((end_price - start_price) / start_price) * 100.0, 2)
    
    if change_pct > 1.0:
        trend_direction = "rising"
        trend_label_hi = "बढ़त का रुझान (Rising)"
    elif change_pct < -1.0:
        trend_direction = "falling"
        trend_label_hi = "गिरावट का रुझान (Falling)"
    else:
        trend_direction = "stable"
        trend_label_hi = "स्थिर (Stable)"

    return {
        "commodity_id": req.commodity_id,
        "commodity_name": req.commodity_name,
        "mandi_id": req.mandi_id,
        "mandi_name": req.mandi_name,
        "current_modal_price": base_price,
        "forecast_horizon_days": horizon,
        "projected_end_price": end_price,
        "trend_direction": trend_direction,
        "trend_label_hi": trend_label_hi,
        "change_pct": change_pct,
        "model": "Agri-Trend-ARMA-v1",
        "forecast": forecast_points,
        "is_demo_data": True,
        "disclaimer": "⚠️ प्रदर्शन डेटा — Demo Data: यह वास्तविक सरकारी डेटा नहीं है"
    }

@app.get("/api/v1/forecast/{commodity_id}")
def get_quick_forecast(commodity_id: str, horizon: int = 15):
    return generate_forecast(ForecastRequest(commodity_id=commodity_id, horizon_days=horizon))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
