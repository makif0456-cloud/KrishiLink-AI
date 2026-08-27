import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShieldCheck, MapPin, Truck, Award, Sparkles, CheckCircle } from 'lucide-react';

export default function MatchingBuyersList({ matchingBuyers = [], onSelectBuyer }) {
  const { t, lang } = useLanguage();

  if (!matchingBuyers || matchingBuyers.length === 0) {
    return (
      <div className="bg-white dark:bg-darkbg-surface p-8 rounded-3xl border border-gray-200 dark:border-darkbg-border text-center space-y-2 transition-colors">
        <span className="text-3xl">🔍</span>
        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">कोई सक्रिय खरीदार आवश्यकता नहीं मिली</h4>
        <p className="text-xs text-gray-500 dark:text-darkbg-muted">
          जैसे ही कोई खरीदार मांग दर्ज करेगा, आपको सूचित किया जाएगा।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center space-x-1.5 text-krishi-800 dark:text-kisan-gold">
          <Sparkles className="w-4 h-4 text-kisan-gold" />
          <h3 className="text-sm sm:text-base font-black">
            {t('matched_buyers_title')} ({matchingBuyers.length})
          </h3>
        </div>
        <span className="text-[10px] bg-krishi-100 dark:bg-krishi-900/60 text-krishi-800 dark:text-krishi-300 font-bold px-2.5 py-0.5 rounded-full border border-krishi-200 dark:border-krishi-800">
          डिटर्मिनिस्टिक स्कोरिंग
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {matchingBuyers.map((buyer, idx) => (
          <div
            key={buyer.requirement_id || idx}
            className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-darkbg-surface border transition-all duration-200 relative ${
              idx === 0
                ? 'border-2 border-krishi-500 dark:border-krishi-400 shadow-md ring-1 ring-krishi-400/20'
                : 'border-gray-200 dark:border-darkbg-border shadow-sm hover:shadow-md'
            }`}
          >
            {/* Best Match Ribbon */}
            {idx === 0 && (
              <div className="absolute -top-3 right-4 bg-krishi-600 dark:bg-krishi-600 text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full shadow-sm tracking-wider flex items-center gap-1 border border-krishi-400/40">
                <span>🏆</span> सर्वोत्तम मिलान (Top Match)
              </div>
            )}

            {/* Buyer header */}
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-1.5">
                  <h4 className="text-base font-black text-gray-950 dark:text-white">
                    {buyer.business_name || buyer.buyer_name}
                  </h4>
                  {buyer.is_verified && (
                    <ShieldCheck className="w-4 h-4 text-krishi-600 dark:text-kisan-gold shrink-0" title="सत्यापित खरीदार" />
                  )}
                </div>
                <span className="text-[11px] text-gray-500 dark:text-darkbg-muted capitalize font-medium">
                  {buyer.buyer_type === 'trader' ? 'मंडी व्यापारी (Trader)' : 'प्रोसेसर / मिल मालिक'}
                </span>
              </div>

              {/* Match Score Badge */}
              <div className="text-right">
                <span className="text-xl font-black text-krishi-700 dark:text-kisan-gold">
                  {buyer.match_score}
                </span>
                <span className="text-[10px] text-gray-400 dark:text-darkbg-muted font-bold block">/100 स्कोर</span>
              </div>
            </div>

            {/* Price & Transport Stats */}
            <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-darkbg-border grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-50 dark:bg-darkbg-card p-2.5 rounded-2xl border border-gray-100 dark:border-darkbg-border">
                <span className="text-gray-500 dark:text-darkbg-muted font-bold block text-[10px]">प्रस्तावित भाव</span>
                <span className="text-base font-black text-gray-900 dark:text-white">
                  ₹{Number(buyer.offered_price || 0).toLocaleString('en-IN')}
                </span>
                <span className="text-[10px] text-gray-500 dark:text-darkbg-muted font-medium block">/ क्विंटल</span>
              </div>

              <div className="bg-gray-50 dark:bg-darkbg-card p-2.5 rounded-2xl border border-gray-100 dark:border-darkbg-border">
                <span className="text-gray-500 dark:text-darkbg-muted font-bold block text-[10px]">खेत से दूरी</span>
                <span className="text-base font-black text-gray-900 dark:text-white">
                  {buyer.distance_km} km
                </span>
                <span className="text-[10px] text-gray-500 dark:text-darkbg-muted font-medium block">
                  {buyer.pickup_available ? '🚚 पिकअप उपलब्ध' : 'स्वयं पहुंचाना'}
                </span>
              </div>
            </div>

            {/* Factor breakdown chips */}
            <div className="mt-2.5 flex flex-wrap gap-1.5 text-[10px] font-bold text-gray-600 dark:text-gray-300">
              <span className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded-lg">
                ✓ भुगतान: {buyer.payment_reliability_pct}%
              </span>
              <span className="bg-blue-50 dark:bg-blue-950/50 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 px-2 py-0.5 rounded-lg">
                ✓ मात्रा मिलान: {buyer.quantity_match_pct}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
