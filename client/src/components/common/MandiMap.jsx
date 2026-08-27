import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { MapPin, Navigation, Building2, Truck, ShieldCheck, Warehouse, Sparkles } from 'lucide-react';

export default function MandiMap({ farmerLocation, options = [] }) {
  const { t, lang } = useLanguage();
  const [selectedPin, setSelectedPin] = useState(options[0] || null);

  const farmerLat = farmerLocation?.latitude || 23.6341;
  const farmerLng = farmerLocation?.longitude || 77.4338;
  const farmerPlace = `${farmerLocation?.village || 'बैरसिया'}, ${farmerLocation?.district || 'भोपाल'}`;

  // SVG Radar/Map dimensions
  const mapWidth = 500;
  const mapHeight = 300;
  const centerX = mapWidth / 2;
  const centerY = mapHeight / 2;

  // Scale degrees to pixels around center
  const scale = 55; // pixels per degree

  const getCoordinates = (lat, lng) => {
    if (!lat || !lng) return { x: centerX, y: centerY };
    const dx = (lng - farmerLng) * scale * 1.5;
    const dy = (farmerLat - lat) * scale;
    return {
      x: Math.max(30, Math.min(mapWidth - 30, centerX + dx)),
      y: Math.max(30, Math.min(mapHeight - 30, centerY + dy))
    };
  };

  return (
    <div className="bg-white dark:bg-darkbg-surface p-4 sm:p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm space-y-4 transition-colors">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-darkbg-border">
        <div>
          <div className="flex items-center space-x-1.5">
            <Navigation className="w-4 h-4 text-krishi-600 dark:text-krishi-400 shrink-0" />
            <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">
              {t('mandi_map_title')}
            </h3>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">
            आपके खेत से मंडियों व खरीदारों की वास्तविक दूरी एवं स्थान तुलना
          </p>
        </div>
        <span className="text-[10px] bg-krishi-100 dark:bg-krishi-900/60 text-krishi-800 dark:text-krishi-300 font-bold px-2.5 py-0.5 rounded-full border border-krishi-200 dark:border-krishi-800">
          GPS आधारित दूरी
        </span>
      </div>

      {/* 🗺️ Interactive Visual Radar Map */}
      <div className="relative w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 p-2 select-none shadow-inner">
        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-48 sm:h-64"
        >
          {/* Distance Radar concentric circles */}
          <circle cx={centerX} cy={centerY} r="45" fill="none" stroke="#1e293b" strokeDasharray="3 3" />
          <circle cx={centerX} cy={centerY} r="90" fill="none" stroke="#1e293b" strokeDasharray="3 3" />
          <circle cx={centerX} cy={centerY} r="135" fill="none" stroke="#1e293b" strokeDasharray="3 3" />

          {/* Distance labels */}
          <text x={centerX + 48} y={centerY - 4} fill="#64748b" fontSize="8" fontWeight="bold">30 km</text>
          <text x={centerX + 93} y={centerY - 4} fill="#64748b" fontSize="8" fontWeight="bold">100 km</text>
          <text x={centerX + 138} y={centerY - 4} fill="#64748b" fontSize="8" fontWeight="bold">200 km</text>

          {/* Connect line from farmer to each option pin */}
          {options.map((opt, idx) => {
            const pt = getCoordinates(opt.latitude, opt.longitude);
            const isSelected = selectedPin?.option_id === opt.option_id;
            return (
              <g key={opt.option_id || idx}>
                <line
                  x1={centerX}
                  y1={centerY}
                  x2={pt.x}
                  y2={pt.y}
                  stroke={isSelected ? '#f59e0b' : '#334155'}
                  strokeWidth={isSelected ? '2.5' : '1'}
                  strokeDasharray={isSelected ? 'none' : '2 2'}
                />
              </g>
            );
          })}

          {/* Central Farmer Pin */}
          <g>
            <circle cx={centerX} cy={centerY} r="14" fill="#16a34a" fillOpacity="0.3" className="animate-ping" />
            <circle cx={centerX} cy={centerY} r="8" fill="#22c55e" stroke="#ffffff" strokeWidth="2" />
            <text x={centerX} y={centerY + 18} textAnchor="middle" fill="#86efac" fontSize="9" fontWeight="bold">
              आपका खेत (Farmer)
            </text>
          </g>

          {/* Option Pins */}
          {options.map((opt, idx) => {
            const pt = getCoordinates(opt.latitude, opt.longitude);
            const isSelected = selectedPin?.option_id === opt.option_id;
            const isBuyer = opt.option_type === 'direct_buyer';
            const isStorage = opt.option_type === 'storage_hold';

            const pinColor = isBuyer ? '#38bdf8' : isStorage ? '#c084fc' : '#f59e0b';

            return (
              <g
                key={opt.option_id || idx}
                onClick={() => setSelectedPin(opt)}
                className="cursor-pointer transform hover:scale-110 transition"
              >
                {isSelected && (
                  <circle cx={pt.x} cy={pt.y} r="12" fill={pinColor} fillOpacity="0.3" className="animate-pulse" />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="7"
                  fill={pinColor}
                  stroke="#020617"
                  strokeWidth="2"
                />
                <text
                  x={pt.x}
                  y={pt.y - 10}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="bold"
                >
                  {opt.title || opt.buyer_name || opt.mandi_name || `विकल्प #${idx + 1}`}
                </text>
                <text
                  x={pt.x}
                  y={pt.y + 16}
                  textAnchor="middle"
                  fill="#94a3b8"
                  fontSize="8"
                >
                  {opt.distance_km || 0} km
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Selected Option Detail Card */}
      {selectedPin && (
        <div className="bg-gray-50 dark:bg-darkbg-card p-3.5 rounded-2xl border border-gray-200 dark:border-darkbg-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-krishi-100 dark:bg-krishi-900/60 text-krishi-700 dark:text-krishi-300 flex items-center justify-center font-bold text-lg shrink-0">
              {selectedPin.option_type === 'direct_buyer' ? '💼' : selectedPin.option_type === 'storage_hold' ? '🏬' : '🌾'}
            </div>
            <div>
              <h4 className="text-sm font-black text-gray-900 dark:text-white">
                {selectedPin.title || selectedPin.buyer_name || selectedPin.mandi_name || 'चयनित विकल्प'}
              </h4>
              <p className="text-xs text-gray-500 dark:text-darkbg-muted">
                दूरी: <strong>{selectedPin.distance_km || 0} किमी</strong> • शुद्ध भाव: <strong className="text-krishi-700 dark:text-kisan-gold">₹{selectedPin.net_realization_per_quintal || selectedPin.offered_price || 0}/क्विंटल</strong>
              </p>
            </div>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[10px] text-gray-500 dark:text-darkbg-muted block">अनुमानित शुद्ध आय</span>
            <span className="text-base font-black text-krishi-700 dark:text-kisan-gold">
              ₹{Number(selectedPin.net_total_amount || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
