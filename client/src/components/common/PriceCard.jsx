import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { TrendingUp, TrendingDown, Minus, MapPin, Truck } from 'lucide-react';

export default function PriceCard({ price, isBestPrice = false }) {
  const { lang, t } = useLanguage();

  if (!price) return null;

  const isRising = price.trend === 'rising';
  const isFalling = price.trend === 'falling';

  return (
    <div className={`p-4 sm:p-5 rounded-2xl bg-white dark:bg-darkbg-card border transition-all duration-200 relative ${
      isBestPrice
        ? 'border-2 border-krishi-500 dark:border-krishi-400 shadow-md ring-1 ring-krishi-400/30'
        : 'border-gray-200 dark:border-darkbg-border shadow-sm hover:shadow-md'
    }`}>
      {/* Best Price Ribbon */}
      {isBestPrice && (
        <div className="absolute -top-3 right-4 bg-gradient-to-r from-krishi-600 to-krishi-700 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm tracking-wider flex items-center gap-1 border border-krishi-400/40">
          <span>🏆</span> {t('highest_price')}
        </div>
      )}

      <div className="flex items-start justify-between">
        {/* Mandi & Location info */}
        <div>
          <div className="flex items-center space-x-1.5 text-gray-900 dark:text-white">
            <MapPin className="w-4 h-4 text-krishi-600 dark:text-krishi-400 shrink-0" />
            <h3 className="text-base sm:text-lg font-black tracking-tight">
              {lang === 'hi' ? price.mandi_name_hi : price.mandi_name_en}
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium ml-5 mt-0.5">
            {lang === 'hi' ? price.mandi_district : price.mandi_state} • {price.mandi_state}
          </p>
        </div>

        {/* Commodity icon & name */}
        <div className="flex items-center space-x-1.5 bg-gray-50 dark:bg-darkbg-surface border border-gray-100 dark:border-darkbg-border px-2.5 py-1 rounded-xl">
          <span className="text-xl">{price.commodity_icon || '🌾'}</span>
          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
            {lang === 'hi' ? price.commodity_name_hi : price.commodity_name_en}
          </span>
        </div>
      </div>

      {/* Main Price Numbers */}
      <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-darkbg-border flex items-end justify-between">
        <div>
          <span className="text-[11px] text-gray-500 dark:text-darkbg-muted font-bold uppercase tracking-wider block">
            {t('modal_price')}
          </span>
          <div className="flex items-baseline space-x-1">
            <span className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight">
              ₹{Number(price.modal_price || 0).toLocaleString('en-IN')}
            </span>
            <span className="text-xs font-bold text-gray-500 dark:text-darkbg-muted">
              / {t('quintal')}
            </span>
          </div>
        </div>

        {/* Trend Indicator */}
        <div className="flex flex-col items-end">
          <div className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
            isRising
              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
              : isFalling
              ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              : 'bg-gray-100 dark:bg-darkbg-surface text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-darkbg-border'
          }`}>
            {isRising && <TrendingUp className="w-3.5 h-3.5" />}
            {isFalling && <TrendingDown className="w-3.5 h-3.5" />}
            {!isRising && !isFalling && <Minus className="w-3.5 h-3.5" />}
            <span>
              {isRising ? t('price_trend_rising') : isFalling ? t('price_trend_falling') : t('price_trend_stable')}
            </span>
          </div>
          {price.price_change !== 0 && (
            <span className="text-[10px] text-gray-500 dark:text-darkbg-muted font-semibold mt-0.5">
              {price.price_change > 0 ? `+₹${price.price_change}` : `₹${price.price_change}`}
            </span>
          )}
        </div>
      </div>

      {/* Bottom Range and Arrivals stats */}
      <div className="mt-3 pt-2.5 bg-gray-50 dark:bg-darkbg-surface -mx-4 -mb-4 sm:-mx-5 sm:-mb-5 p-3 rounded-b-2xl flex items-center justify-between text-xs font-medium text-gray-600 dark:text-gray-400 border-t border-gray-100 dark:border-darkbg-border">
        <div>
          <span className="text-gray-500 dark:text-darkbg-muted">रेंज:</span>{' '}
          <span className="font-bold text-gray-800 dark:text-gray-200">
            ₹{price.min_price} - ₹{price.max_price}
          </span>
        </div>
        {price.arrivals_tonnes > 0 && (
          <div className="flex items-center space-x-1 text-gray-700 dark:text-gray-300">
            <Truck className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
            <span>आवक: <strong className="text-gray-900 dark:text-white">{price.arrivals_tonnes} टन</strong></span>
          </div>
        )}
      </div>
    </div>
  );
}
