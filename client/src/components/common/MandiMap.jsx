import React, { useMemo, useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Navigation } from 'lucide-react';

export default function MandiMap({ farmerLocation, options = [] }) {
  const { t } = useLanguage();
  const [selectedPin, setSelectedPin] = useState(options[0] || null);

  // ---------------------------------------------------------
  // FARMER LOCATION
  // ---------------------------------------------------------
  const farmerLat = Number(farmerLocation?.latitude) || 23.6341;
  const farmerLng = Number(farmerLocation?.longitude) || 77.4338;

  const farmerPlace = `${farmerLocation?.village || 'बैरसिया'}, ${
    farmerLocation?.district || 'भोपाल'
  }`;

  // ---------------------------------------------------------
  // SVG MAP
  // ---------------------------------------------------------
  const mapWidth = 700;
  const mapHeight = 380;

  const centerX = mapWidth / 2;
  const centerY = mapHeight / 2;

  // Maximum visual radius.
  // This keeps the map nicely spread out.
  const maxVisualRadius = 145;

  // ---------------------------------------------------------
  // HAVERSINE DISTANCE
  // ---------------------------------------------------------
  const calculateDistanceKm = (lat1, lng1, lat2, lng2) => {
    const R = 6371;

    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  // ---------------------------------------------------------
  // BEARING
  // Determines direction of location from farmer
  // ---------------------------------------------------------
  const calculateBearing = (lat1, lng1, lat2, lng2) => {
    const lat1Rad = (lat1 * Math.PI) / 180;
    const lat2Rad = (lat2 * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;

    const y = Math.sin(dLng) * Math.cos(lat2Rad);

    const x =
      Math.cos(lat1Rad) * Math.sin(lat2Rad) -
      Math.sin(lat1Rad) *
        Math.cos(lat2Rad) *
        Math.cos(dLng);

    const bearing = (Math.atan2(y, x) * 180) / Math.PI;

    return (bearing + 360) % 360;
  };

  // ---------------------------------------------------------
  // PREPARE MAP OPTIONS
  // ---------------------------------------------------------
  const mapOptions = useMemo(() => {
    if (!options || options.length === 0) return [];

    const validOptions = options.filter(
      (opt) =>
        Number.isFinite(Number(opt.latitude)) &&
        Number.isFinite(Number(opt.longitude))
    );

    if (validOptions.length === 0) return [];

    // Get real distances first
    const prepared = validOptions.map((opt, index) => {
      const lat = Number(opt.latitude);
      const lng = Number(opt.longitude);

      // Prefer backend distance because backend is responsible
      // for the actual recommendation calculation.
      const backendDistance = Number(opt.distance_km);

      const calculatedDistance = calculateDistanceKm(
        farmerLat,
        farmerLng,
        lat,
        lng
      );

      const distance =
        Number.isFinite(backendDistance) && backendDistance > 0
          ? backendDistance
          : calculatedDistance;

      const bearing = calculateBearing(
        farmerLat,
        farmerLng,
        lat,
        lng
      );

      return {
        ...opt,
        _distance: distance,
        _bearing: bearing,
        _index: index
      };
    });

    // -------------------------------------------------------
    // Convert actual distance into visual radius
    //
    // Example:
    // 7 km  -> closer to farmer
    // 50 km -> further away
    // 150 km -> near outer ring
    // -------------------------------------------------------

    const maxDistance = Math.max(
      ...prepared.map((opt) => opt._distance),
      30
    );

    return prepared.map((opt) => {
      // Logarithmic-ish scaling makes nearby points easier
      // to distinguish while preserving distance ordering.
      const normalized =
        Math.log10(opt._distance + 1) /
        Math.log10(maxDistance + 1);

      const radius = Math.max(
        32,
        normalized * maxVisualRadius
      );

      // Convert bearing to SVG coordinates.
      // Bearing 0 = North.
      const angle = (opt._bearing * Math.PI) / 180;

      let x = centerX + Math.sin(angle) * radius;
      let y = centerY - Math.cos(angle) * radius;

      // Keep labels/pins inside the SVG.
      x = Math.max(55, Math.min(mapWidth - 55, x));
      y = Math.max(40, Math.min(mapHeight - 40, y));

      return {
        ...opt,
        _x: x,
        _y: y,
        _radius: radius
      };
    });
  }, [
    options,
    farmerLat,
    farmerLng
  ]);

  // ---------------------------------------------------------
  // NET PRICE HELPERS
  // ---------------------------------------------------------
  const getQuantity = (option) => {
    return Number(option?.quantity) || 1;
  };

  const getNetTotal = (option) => {
    // Your backend uses net_realization as total net amount.
    if (Number.isFinite(Number(option?.net_realization))) {
      return Number(option.net_realization);
    }

    if (Number.isFinite(Number(option?.net_total_amount))) {
      return Number(option.net_total_amount);
    }

    return 0;
  };

  const getNetPerQuintal = (option) => {
    if (Number.isFinite(Number(option?.net_realization_per_quintal))) {
      return Number(option.net_realization_per_quintal);
    }

    const total = getNetTotal(option);
    const quantity = getQuantity(option);

    if (total > 0 && quantity > 0) {
      return total / quantity;
    }

    return Number(option?.price_per_quintal) || 0;
  };

  // ---------------------------------------------------------
  // OPTION TYPE
  // ---------------------------------------------------------
  const getOptionIcon = (option) => {
    if (option?.option_type === 'direct_buyer') {
      return '💼';
    }

    if (option?.option_type === 'storage_hold') {
      return '🏬';
    }

    return '🌾';
  };

  const getOptionName = (option, index) => {
    return (
      option?.title_hi ||
      option?.title ||
      option?.buyer_name ||
      option?.mandi_name_hi ||
      option?.mandi_name ||
      option?.title_en ||
      `विकल्प #${index + 1}`
    );
  };

  // ---------------------------------------------------------
  // SELECTED OPTION
  // ---------------------------------------------------------
  const selectedNetTotal = selectedPin
    ? getNetTotal(selectedPin)
    : 0;

  const selectedNetPerQuintal = selectedPin
    ? getNetPerQuintal(selectedPin)
    : 0;

  return (
    <div className="bg-white dark:bg-darkbg-surface p-4 sm:p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm space-y-4 transition-colors">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-darkbg-border">

        <div>
          <div className="flex items-center space-x-1.5">

            <Navigation className="w-4 h-4 text-krishi-600 dark:text-krishi-400 shrink-0" />

            <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">
              {t('mandi_map_title')}
            </h3>

          </div>

          <p className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">
            आपके खेत से मंडियों व खरीदारों की दूरी और दिशा
          </p>
        </div>

        <span className="text-[10px] bg-krishi-100 dark:bg-krishi-900/60 text-krishi-800 dark:text-krishi-300 font-bold px-2.5 py-0.5 rounded-full border border-krishi-200 dark:border-krishi-800">
          GPS आधारित दूरी
        </span>

      </div>

      {/* =====================================================
          RADAR MAP
      ===================================================== */}
      <div className="relative w-full bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 p-2 select-none shadow-inner">

        <svg
          viewBox={`0 0 ${mapWidth} ${mapHeight}`}
          className="w-full h-64 sm:h-80"
        >

          {/* =================================================
              RADAR RINGS
          ================================================= */}

          <circle
            cx={centerX}
            cy={centerY}
            r="45"
            fill="none"
            stroke="#1e293b"
            strokeDasharray="4 4"
          />

          <circle
            cx={centerX}
            cy={centerY}
            r="90"
            fill="none"
            stroke="#1e293b"
            strokeDasharray="4 4"
          />

          <circle
            cx={centerX}
            cy={centerY}
            r="145"
            fill="none"
            stroke="#1e293b"
            strokeDasharray="4 4"
          />

          {/* Ring labels */}

          <text
            x={centerX + 48}
            y={centerY - 5}
            fill="#64748b"
            fontSize="9"
            fontWeight="bold"
          >
            30 km
          </text>

          <text
            x={centerX + 93}
            y={centerY - 5}
            fill="#64748b"
            fontSize="9"
            fontWeight="bold"
          >
            100 km
          </text>

          <text
            x={centerX + 148}
            y={centerY - 5}
            fill="#64748b"
            fontSize="9"
            fontWeight="bold"
          >
            200 km
          </text>

          {/* =================================================
              DIRECTION LABELS
          ================================================= */}

          <text
            x={centerX}
            y="18"
            textAnchor="middle"
            fill="#475569"
            fontSize="9"
            fontWeight="bold"
          >
            उत्तर
          </text>

          <text
            x={centerX}
            y={mapHeight - 8}
            textAnchor="middle"
            fill="#475569"
            fontSize="9"
            fontWeight="bold"
          >
            दक्षिण
          </text>

          <text
            x="18"
            y={centerY + 3}
            textAnchor="middle"
            fill="#475569"
            fontSize="9"
            fontWeight="bold"
          >
            पश्चिम
          </text>

          <text
            x={mapWidth - 18}
            y={centerY + 3}
            textAnchor="middle"
            fill="#475569"
            fontSize="9"
            fontWeight="bold"
          >
            पूर्व
          </text>

          {/* =================================================
              CONNECTION LINES
          ================================================= */}

          {mapOptions.map((opt, idx) => {

            const isSelected =
              selectedPin?.option_id === opt.option_id;

            return (
              <line
                key={`line-${opt.option_id || idx}`}
                x1={centerX}
                y1={centerY}
                x2={opt._x}
                y2={opt._y}
                stroke={
                  isSelected
                    ? '#f59e0b'
                    : '#334155'
                }
                strokeWidth={
                  isSelected ? '2.5' : '1'
                }
                strokeDasharray={
                  isSelected ? 'none' : '3 3'
                }
              />
            );
          })}

          {/* =================================================
              FARMER
          ================================================= */}

          <g>

            <circle
              cx={centerX}
              cy={centerY}
              r="22"
              fill="#16a34a"
              fillOpacity="0.15"
            />

            <circle
              cx={centerX}
              cy={centerY}
              r="14"
              fill="#16a34a"
              fillOpacity="0.25"
              className="animate-ping"
            />

            <circle
              cx={centerX}
              cy={centerY}
              r="9"
              fill="#22c55e"
              stroke="#ffffff"
              strokeWidth="2"
            />

            <text
              x={centerX}
              y={centerY + 25}
              textAnchor="middle"
              fill="#86efac"
              fontSize="10"
              fontWeight="bold"
            >
              🧑‍🌾 आपका खेत
            </text>

            <text
              x={centerX}
              y={centerY + 37}
              textAnchor="middle"
              fill="#64748b"
              fontSize="8"
            >
              {farmerPlace}
            </text>

          </g>

          {/* =================================================
              OPTIONS
          ================================================= */}

          {mapOptions.map((opt, idx) => {

            const isSelected =
              selectedPin?.option_id === opt.option_id;

            const isBuyer =
              opt.option_type === 'direct_buyer';

            const isStorage =
              opt.option_type === 'storage_hold';

            const pinColor = isBuyer
              ? '#38bdf8'
              : isStorage
                ? '#c084fc'
                : '#f59e0b';

            const optionName = getOptionName(opt, idx);

            return (
              <g
                key={opt.option_id || idx}
                onClick={() => setSelectedPin(opt)}
                className="cursor-pointer"
              >

                {/* Selection glow */}

                {isSelected && (
                  <circle
                    cx={opt._x}
                    cy={opt._y}
                    r="16"
                    fill={pinColor}
                    fillOpacity="0.25"
                    className="animate-pulse"
                  />
                )}

                {/* Pin */}

                <circle
                  cx={opt._x}
                  cy={opt._y}
                  r="8"
                  fill={pinColor}
                  stroke="#020617"
                  strokeWidth="2"
                />

                {/* Number */}

                <text
                  x={opt._x}
                  y={opt._y + 3}
                  textAnchor="middle"
                  fill="#020617"
                  fontSize="7"
                  fontWeight="900"
                >
                  {idx + 1}
                </text>

                {/* Name */}

                <text
                  x={opt._x}
                  y={opt._y - 14}
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="bold"
                >
                  {optionName.length > 20
                    ? `${optionName.substring(0, 20)}…`
                    : optionName}
                </text>

                {/* Distance */}

                <text
                  x={opt._x}
                  y={opt._y + 22}
                  textAnchor="middle"
                  fill="#fbbf24"
                  fontSize="9"
                  fontWeight="bold"
                >
                  {Number(opt._distance).toFixed(1)} km
                </text>

              </g>
            );
          })}

        </svg>
      </div>

      {/* =====================================================
          LEGEND
      ===================================================== */}

      <div className="flex flex-wrap items-center justify-center gap-4 text-[10px] text-gray-500 dark:text-darkbg-muted">

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
          आपका खेत
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          मंडी
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-400"></span>
          खरीदार
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-purple-400"></span>
          स्टोरेज
        </div>

      </div>

      {/* =====================================================
          SELECTED OPTION
      ===================================================== */}

      {selectedPin && (

        <div className="bg-gray-50 dark:bg-darkbg-card p-3.5 rounded-2xl border border-gray-200 dark:border-darkbg-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">

          <div className="flex items-center space-x-3">

            <div className="w-10 h-10 rounded-xl bg-krishi-100 dark:bg-krishi-900/60 text-krishi-700 dark:text-krishi-300 flex items-center justify-center font-bold text-lg shrink-0">
              {getOptionIcon(selectedPin)}
            </div>

            <div>

              <h4 className="text-sm font-black text-gray-900 dark:text-white">
                {getOptionName(selectedPin, 0)}
              </h4>

              <p className="text-xs text-gray-500 dark:text-darkbg-muted">

                दूरी:{' '}
                <strong>
                  {Number(
                    selectedPin._distance ??
                    selectedPin.distance_km ??
                    0
                  ).toFixed(1)} किमी
                </strong>

                {' • '}

                शुद्ध भाव:{' '}

                <strong className="text-krishi-700 dark:text-kisan-gold">
                  ₹
                  {Math.round(
                    selectedNetPerQuintal
                  ).toLocaleString('en-IN')}
                  /क्विंटल
                </strong>

              </p>

            </div>

          </div>

          <div className="text-right shrink-0">

            <span className="text-[10px] text-gray-500 dark:text-darkbg-muted block">
              अनुमानित शुद्ध आय
            </span>

            <span className="text-base font-black text-krishi-700 dark:text-kisan-gold">

              ₹
              {Math.round(
                selectedNetTotal
              ).toLocaleString('en-IN')}

            </span>

          </div>

        </div>

      )}

    </div>
  );
}
