import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Award, ChevronDown, ChevronUp, CheckCircle2, TrendingUp, Truck, ShieldCheck, Sparkles } from 'lucide-react';

export default function RecommendationCard({ recommendation }) {
  const { t, lang } = useLanguage();
  const [showDeductions, setShowDeductions] = useState(false);

  if (!recommendation || !recommendation.top_recommendation) {
    return null;
  }

  const top = recommendation.top_recommendation;
  const isDirectBuyer = top.option_type === 'direct_buyer';
  const additionalGain = recommendation.additional_gain_top_option || 0;

  return (
    <div className="bg-gradient-to-br from-krishi-700 via-krishi-800 to-krishi-900 dark:from-darkbg-card dark:via-darkbg-surface dark:to-darkbg-card text-white p-5 sm:p-7 rounded-3xl shadow-xl space-y-5 relative overflow-hidden border border-krishi-600/50 dark:border-darkbg-border transition-colors">
      {/* Background soft glow decoration */}
      <div className="absolute -top-10 -right-10 w-44 h-44 bg-kisan-gold/20 rounded-full blur-3xl pointer-events-none"></div>

      {/* Top Banner Ribbon */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1.5 bg-gradient-to-r from-kisan-amber to-kisan-gold text-gray-950 px-3.5 py-1 rounded-full text-xs font-black shadow-sm tracking-wide">
          <Award className="w-4 h-4 text-gray-900" />
          <span>{t('top_recommendation_badge')}</span>
        </div>

        {additionalGain > 0 && (
          <div className="bg-emerald-500/30 border border-emerald-400/50 text-emerald-200 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shadow-xs">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>+₹{additionalGain.toLocaleString('en-IN')} अधिक लाभ</span>
          </div>
        )}
      </div>

      {/* Recommended Option Title & Rate */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2 text-white">
          <span>{top.title_hi || top.buyer_name || 'सर्वश्रेष्ठ विक्रय विकल्प'}</span>
          {isDirectBuyer && <ShieldCheck className="w-5 h-5 text-kisan-gold shrink-0" />}
        </h2>
        <p className="text-xs sm:text-sm text-krishi-100 dark:text-darkbg-muted font-medium">
          {top.subtitle || 'खेत से सीधा पिकअप एवं न्यूनतम पल्लेदारी'}
        </p>
      </div>

      {/* 💰 Primary Financial Realization Highlight Card */}
      <div className="bg-white/10 dark:bg-darkbg-surface/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 dark:border-darkbg-border grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div>
          <span className="text-[11px] text-krishi-200 dark:text-darkbg-muted font-bold block">{t('gross_revenue')}</span>
          <span className="text-base sm:text-lg font-black text-white">
            ₹{Number(top.gross_revenue || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-krishi-200 dark:text-darkbg-muted font-medium block mt-0.5">
            (@ ₹{top.price_per_quintal || top.offered_price || 0}/q × {recommendation.quantity} क्विंटल)
          </span>
        </div>

        <div>
          <span className="text-[11px] text-krishi-200 dark:text-darkbg-muted font-bold block">{t('total_deductions')}</span>
          <span className="text-base sm:text-lg font-black text-amber-300">
            - ₹{Number(top.total_deductions || 0).toLocaleString('en-IN')}
          </span>
          <button
            type="button"
            onClick={() => setShowDeductions(!showDeductions)}
            className="text-[10px] text-kisan-gold underline font-bold flex items-center gap-0.5 mt-0.5 touch-btn"
          >
            <span>विवरण देखें</span>
            {showDeductions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>

        <div className="sm:border-l sm:border-white/15 dark:sm:border-darkbg-border sm:pl-4">
          <span className="text-[11px] text-kisan-gold font-black uppercase tracking-wider block">
            {t('net_realization')} (शुद्ध कमाई)
          </span>
          <span className="text-2xl sm:text-3xl font-black text-white leading-none mt-0.5 block">
            ₹{Number(top.net_realization || top.net_total_amount || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-emerald-300 font-bold block mt-1">
            ✓ आपके बैंक खाते में सीधी प्राप्ति
          </span>
        </div>
      </div>

      {/* Deductions Breakdown Accordion */}
      {showDeductions && (
        <div className="bg-black/40 dark:bg-darkbg-base/80 rounded-2xl p-4 border border-white/10 dark:border-darkbg-border space-y-2 text-xs animate-in fade-in">
          <span className="font-bold text-krishi-200 dark:text-darkbg-muted block text-[11px]">
            कटौती का पारदर्शी विवरण (Cost Deductions Breakdown):
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
            <div className="bg-white/5 dark:bg-darkbg-card p-2.5 rounded-xl border border-white/5 dark:border-darkbg-border">
              <span className="text-gray-300 dark:text-darkbg-muted block">{t('transport_deduction')}</span>
              <span className="font-black text-white">₹{top.transport_cost || 0}</span>
              <span className="text-[9px] text-gray-400 block">{top.distance_km || 0} km</span>
            </div>
            <div className="bg-white/5 dark:bg-darkbg-card p-2.5 rounded-xl border border-white/5 dark:border-darkbg-border">
              <span className="text-gray-300 dark:text-darkbg-muted block">{t('loading_unloading')}</span>
              <span className="font-black text-white">₹{top.loading_cost || 0}</span>
            </div>
            <div className="bg-white/5 dark:bg-darkbg-card p-2.5 rounded-xl border border-white/5 dark:border-darkbg-border">
              <span className="text-gray-300 dark:text-darkbg-muted block">{t('mandi_commission')}</span>
              <span className="font-black text-white">₹{top.commission_cost || 0}</span>
            </div>
            <div className="bg-white/5 dark:bg-darkbg-card p-2.5 rounded-xl border border-white/5 dark:border-darkbg-border">
              <span className="text-gray-300 dark:text-darkbg-muted block">{t('storage_handling')}</span>
              <span className="font-black text-white">₹{top.storage_cost || 0}</span>
            </div>
          </div>
        </div>
      )}

      {/* Key Reasons bullets */}
      <div className="space-y-1.5 pt-1 text-xs sm:text-sm text-krishi-100 dark:text-gray-200">
        <span className="font-bold text-kisan-gold block text-xs">यह विकल्प सबसे बेहतर क्यों है?</span>
        <ul className="space-y-1">
          {(top.reasons_hi || [
            'खेत से सीधे पिकअप के कारण परिवहन व लोडिंग खर्च की पूरी बचत होती है।',
            'सत्यापित खरीदार द्वारा डिलीवरी पर तत्काल डिजिटल भुगतान की गारंटी।'
          ]).map((reason, idx) => (
            <li key={idx} className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{reason}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
