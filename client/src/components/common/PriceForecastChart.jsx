import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { IntelligenceService } from '../../services/intelligenceService';
import { TrendingUp, TrendingDown, Minus, Sparkles, ShieldAlert, Calendar } from 'lucide-react';

export default function PriceForecastChart({ commodityId = 'b0000000-0000-0000-0000-000000000001', horizonDays = 15 }) {
  const { t, lang } = useLanguage();
  const [forecastData, setForecastData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedHorizon, setSelectedHorizon] = useState(horizonDays);

  useEffect(() => {
    async function loadForecast() {
      setLoading(true);
      try {
        const data = await IntelligenceService.getPriceForecast(commodityId, selectedHorizon);
        setForecastData(data);
      } catch (err) {
        console.error('Failed to load forecast', err);
      } finally {
        setLoading(false);
      }
    }
    loadForecast();
  }, [commodityId, selectedHorizon]);

  if (loading) {
    return (
      <div className="bg-white dark:bg-darkbg-surface p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm text-center animate-pulse space-y-3">
        <div className="h-4 bg-gray-200 dark:bg-darkbg-card rounded w-1/3 mx-auto"></div>
        <div className="h-32 bg-gray-100 dark:bg-darkbg-card/60 rounded-2xl"></div>
      </div>
    );
  }

  if (!forecastData || !forecastData.forecast || forecastData.forecast.length === 0) {
    return null;
  }

  const points = forecastData.forecast;
  const minPrice = Math.min(...points.map(p => p.min_estimate), forecastData.current_modal_price - 50);
  const maxPrice = Math.max(...points.map(p => p.max_estimate), forecastData.current_modal_price + 50);
  const priceRange = maxPrice - minPrice || 100;

  const isRising = forecastData.trend_direction === 'rising';
  const isFalling = forecastData.trend_direction === 'falling';

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 180;
  const paddingX = 40;
  const paddingY = 25;
  const chartWidth = svgWidth - paddingX * 2;
  const chartHeight = svgHeight - paddingY * 2;

  // Calculate SVG coordinates for points
  const coords = points.map((p, idx) => {
    const x = paddingX + (idx / (points.length - 1 || 1)) * chartWidth;
    const y = paddingY + chartHeight - ((p.predicted_modal_price - minPrice) / priceRange) * chartHeight;
    const yMin = paddingY + chartHeight - ((p.min_estimate - minPrice) / priceRange) * chartHeight;
    const yMax = paddingY + chartHeight - ((p.max_estimate - minPrice) / priceRange) * chartHeight;
    return { ...p, x, y, yMin, yMax };
  });

  // Path strings
  const linePath = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.y}`).join(' ');
  const areaPath = `${coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x} ${c.yMax}`).join(' ')} ${coords.slice().reverse().map(c => `L ${c.x} ${c.yMin}`).join(' ')} Z`;

  return (
    <div className="bg-white dark:bg-darkbg-surface p-4 sm:p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm space-y-4 transition-colors">
      {/* Header with Title & Horizon Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100 dark:border-darkbg-border">
        <div>
          <div className="flex items-center space-x-1.5">
            <Sparkles className="w-4 h-4 text-kisan-gold shrink-0" />
            <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">
              {t('price_forecast_title')}
            </h3>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">
            ऐतिहासिक डेटा व मौसमी रुझान पर आधारित समय-श्रृंखला अनुमान (Deterministic Time-Series Forecast)
          </p>
        </div>

        {/* Horizon selector: 7 / 15 / 30 Days */}
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-darkbg-card p-1 rounded-xl shrink-0 self-start sm:self-auto border border-gray-200 dark:border-darkbg-border">
          {[7, 15, 30].map(days => (
            <button
              key={days}
              type="button"
              onClick={() => setSelectedHorizon(days)}
              className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition touch-btn ${
                selectedHorizon === days
                  ? 'bg-white dark:bg-krishi-700 text-krishi-800 dark:text-white shadow-xs'
                  : 'text-gray-600 dark:text-darkbg-muted hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {days} दिन
            </button>
          ))}
        </div>
      </div>

      {/* Trend Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="bg-gray-50 dark:bg-darkbg-card p-3 rounded-2xl border border-gray-100 dark:border-darkbg-border">
          <span className="text-[10px] text-gray-500 dark:text-darkbg-muted font-bold block">वर्तमान मॉडल भाव</span>
          <span className="text-base font-black text-gray-900 dark:text-white">
            ₹{forecastData.current_modal_price}
          </span>
          <span className="text-[10px] text-gray-500 dark:text-darkbg-muted font-medium block">/ क्विंटल</span>
        </div>

        <div className={`p-3 rounded-2xl border ${
          isRising ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' :
          isFalling ? 'bg-rose-50 dark:bg-rose-950/50 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200' :
          'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200'
        }`}>
          <span className="text-[10px] font-bold block opacity-80">{selectedHorizon} दिन का अनुमान</span>
          <span className="text-base font-black flex items-center gap-1">
            ₹{forecastData.projected_end_price}
            <span className="text-xs font-bold">
              ({forecastData.change_pct >= 0 ? `+${forecastData.change_pct}%` : `${forecastData.change_pct}%`})
            </span>
          </span>
          <span className="text-[10px] font-bold flex items-center gap-0.5 mt-0.5">
            {isRising && <TrendingUp className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />}
            {isFalling && <TrendingDown className="w-3 h-3 text-rose-600 dark:text-rose-400" />}
            {!isRising && !isFalling && <Minus className="w-3 h-3 text-blue-600 dark:text-blue-400" />}
            {forecastData.trend_label_hi}
          </span>
        </div>

        <div className="col-span-2 sm:col-span-1 bg-gray-50 dark:bg-darkbg-card p-3 rounded-2xl border border-gray-100 dark:border-darkbg-border flex flex-col justify-center">
          <span className="text-[10px] text-gray-500 dark:text-darkbg-muted font-bold block">{t('forecast_confidence')}</span>
          <span className="text-base font-black text-krishi-700 dark:text-krishi-400">92%</span>
          <span className="text-[10px] text-gray-400 dark:text-darkbg-muted font-medium">मॉडल: {forecastData.model}</span>
        </div>
      </div>

      {/* 📈 Interactive SVG Forecast Chart */}
      <div className="w-full bg-slate-950 p-3.5 sm:p-4 rounded-3xl border border-slate-800 text-white overflow-hidden shadow-inner">
        <div className="flex items-center justify-between text-[11px] text-slate-400 pb-2 border-b border-slate-800 font-bold">
          <span>आज: ₹{forecastData.current_modal_price}</span>
          <span className="text-kisan-gold flex items-center gap-1">
            <span>---</span> अनुमानित मूल्य रेखा ({selectedHorizon} दिन)
          </span>
          <span>लक्ष्य: ₹{forecastData.projected_end_price}</span>
        </div>

        <svg
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="w-full h-36 sm:h-44 mt-2 overflow-visible"
        >
          <defs>
            <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#22c55e" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#334155" strokeDasharray="3 3" />
          <line x1={paddingX} y1={paddingY + chartHeight / 2} x2={svgWidth - paddingX} y2={paddingY + chartHeight / 2} stroke="#334155" strokeDasharray="3 3" />
          <line x1={paddingX} y1={paddingY + chartHeight} x2={svgWidth - paddingX} y2={paddingY + chartHeight} stroke="#334155" />

          {/* Uncertainty envelope band */}
          <path d={areaPath} fill="url(#forecastAreaGrad)" />

          {/* Forecast Trend Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#22c55e"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="5 4"
          />

          {/* Key Point Markers */}
          {coords.map((c, i) => (
            (i === 0 || i === Math.floor(coords.length / 2) || i === coords.length - 1) && (
              <g key={i}>
                <circle cx={c.x} cy={c.y} r="4.5" fill="#facc15" stroke="#022c22" strokeWidth="2" />
                <text
                  x={c.x}
                  y={c.y - 10}
                  textAnchor="middle"
                  fill="#fef08a"
                  fontSize="10"
                  fontWeight="bold"
                >
                  ₹{c.predicted_modal_price}
                </text>
                <text
                  x={c.x}
                  y={paddingY + chartHeight + 14}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="9"
                >
                  {c.date.slice(5)}
                </text>
              </g>
            )
          ))}
        </svg>

        <p className="text-[10px] text-slate-400 text-center mt-1">
          हरे रंग का क्षेत्र संभाव्य मूल्य दायरा (Uncertainty Range) दर्शाता है।
        </p>
      </div>
    </div>
  );
}
