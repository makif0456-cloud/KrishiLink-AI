import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { IntelligenceService } from '../services/intelligenceService';
import RecommendationCard from '../components/farmer/RecommendationCard';
import MandiMap from '../components/common/MandiMap';
import PriceForecastChart from '../components/common/PriceForecastChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ArrowLeft, Sparkles, Scale, TrendingUp, ShieldCheck, MapPin, ArrowRight } from 'lucide-react';

export default function RecommendationPage() {
  const { lotId } = useParams();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [recommendation, setRecommendation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await IntelligenceService.getSellingRecommendations(lotId);
        setRecommendation(data);
      } catch (err) {
        console.error('Failed to load recommendations', err);
        setError(err.response?.data?.message || err.message || 'सिफारिशें लोड करने में त्रुटि हुई');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [lotId]);

  if (loading) {
    return <LoadingSpinner message="सर्वोत्तम विक्रय विकल्प व शुद्ध प्राप्ति का विश्लेषण हो रहा है..." />;
  }

  if (error || !recommendation) {
    return (
      <div className="max-w-3xl mx-auto py-10 text-center space-y-3 bg-white dark:bg-darkbg-surface p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border">
        <h3 className="text-base font-bold text-red-700 dark:text-red-400">{error || 'फसल सिफारिशें उपलब्ध नहीं हैं'}</h3>
        <button
          onClick={() => navigate('/my-lots')}
          className="px-4 py-2 bg-krishi-600 text-white font-bold rounded-xl text-xs touch-btn"
        >
          मेरी फसलें पर लौटें
        </button>
      </div>
    );
  }

  const allOptions = recommendation.all_options || [];

  return (
    <div className="max-w-4xl mx-auto py-2 sm:py-4 space-y-5 sm:space-y-6">
      {/* Top Back Navigation Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/my-lots/${lotId}`)}
          className="flex items-center space-x-1.5 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-krishi-700 dark:hover:text-kisan-gold touch-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>फसल विवरण पर वापस जाएं</span>
        </button>

        <div className="flex items-center space-x-2 text-xs font-bold text-gray-700 dark:text-gray-300 bg-white dark:bg-darkbg-surface px-3.5 py-1.5 rounded-full border border-gray-200 dark:border-darkbg-border shadow-xs">
          <span>{recommendation.commodity_icon || '🌾'}</span>
          <span>{lang === 'hi' ? recommendation.commodity_name_hi : recommendation.commodity_name_en}</span>
          <span>•</span>
          <span>{recommendation.quantity} {recommendation.unit || 'क्विंटल'}</span>
        </div>
      </div>

      {/* 🏆 HERO TOP RECOMMENDATION CARD */}
      <RecommendationCard recommendation={recommendation} />

      {/* 📊 ALL OPTIONS COMPARISON TABLE / CARDS */}
      <div className="bg-white dark:bg-darkbg-surface p-4 sm:p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm space-y-4 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-darkbg-border">
          <div>
            <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">
              {t('options_comparison_title')} ({allOptions.length})
            </h3>
            <p className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">
              सभी मंडियों, सीधे खरीदारों एवं वेयरहाउसिंग विकल्पों की शुद्ध प्राप्ति तुलना
            </p>
          </div>
          <span className="text-[10px] bg-krishi-100 dark:bg-krishi-900/60 text-krishi-800 dark:text-krishi-300 font-bold px-2.5 py-0.5 rounded-full border border-krishi-200 dark:border-krishi-800">
            शुद्ध लाभ के आधार पर क्रमबद्ध
          </span>
        </div>

        {/* Options List */}
        <div className="space-y-3">
          {allOptions.map((opt, idx) => {
            const isTop = idx === 0;
            const isDirect = opt.option_type === 'direct_buyer';
            const isStorage = opt.option_type === 'storage_hold';

            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`;

            return (
              <div
                key={opt.option_id || idx}
                className={`p-4 rounded-2xl border transition relative ${
                  isTop
                    ? 'bg-krishi-50/80 dark:bg-darkbg-card border-2 border-krishi-500 dark:border-krishi-400 shadow-sm'
                    : 'bg-white dark:bg-darkbg-surface border-gray-200 dark:border-darkbg-border hover:border-gray-300 dark:hover:border-krishi-700'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">
                        {medal}
                      </span>
                      <h4 className="text-sm font-black text-gray-950 dark:text-white">
                        {opt.title_hi || opt.buyer_name || opt.mandi_name}
                      </h4>
                      {isDirect && <ShieldCheck className="w-4 h-4 text-krishi-600 dark:text-kisan-gold shrink-0" />}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium pl-7">
                      {opt.subtitle || opt.district} • {opt.distance_km || 0} km दूरी
                    </p>
                  </div>

                  {/* Realization Badge */}
                  <div className="text-left sm:text-right pl-7 sm:pl-0">
                    <span className="text-xs text-gray-500 dark:text-darkbg-muted font-bold block">शुद्ध प्राप्ति (Net Realization)</span>
                    <span className="text-lg sm:text-xl font-black text-krishi-800 dark:text-kisan-gold leading-tight">
                      ₹{Number(opt.net_realization || opt.net_total_amount || 0).toLocaleString('en-IN')}
                    </span>
                    {opt.difference_vs_local_mandi !== 0 && (
                      <span className={`text-[10px] font-bold block ${
                        opt.difference_vs_local_mandi > 0 ? 'text-emerald-700 dark:text-emerald-400' : 'text-gray-500 dark:text-darkbg-muted'
                      }`}>
                        {opt.difference_vs_local_mandi > 0 ? `+₹${opt.difference_vs_local_mandi.toLocaleString('en-IN')} लाभ` : 'बेसलाइन'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Deductions Breakdown Mini Bar */}
                <div className="mt-3 pt-2 border-t border-gray-100 dark:border-darkbg-border grid grid-cols-4 gap-1.5 text-[10px] text-center bg-gray-50/90 dark:bg-darkbg-card p-2.5 rounded-xl">
                  <div>
                    <span className="text-gray-400 dark:text-darkbg-muted block">भाव</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">₹{opt.price_per_quintal || opt.offered_price}/q</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-darkbg-muted block">परिवहन</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">₹{opt.transport_cost || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-darkbg-muted block">मंडी आढ़त</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">₹{opt.commission_cost || 0}</span>
                  </div>
                  <div>
                    <span className="text-gray-400 dark:text-darkbg-muted block">कुल कटौती</span>
                    <span className="font-bold text-amber-700 dark:text-amber-400">-₹{opt.total_deductions || 0}</span>
                  </div>
                </div>

                {opt.recommendation_reason && (
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 italic mt-2 pl-1">
                    "{opt.recommendation_reason}"
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 🗺️ INTERACTIVE MANDI & BUYER DISTANCE MAP */}
      <MandiMap
        farmerLocation={recommendation.farmer_location}
        options={allOptions}
      />

      {/* 📈 15-DAY PRICE FORECAST TIME-SERIES CHART */}
      <PriceForecastChart
        commodityId={recommendation.commodity_id}
        horizonDays={15}
      />

      {/* Bottom Action Footer */}
      <div className="p-4 sm:p-5 bg-white dark:bg-darkbg-surface rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3 transition-colors">
        <div>
          <h4 className="text-sm font-black text-gray-900 dark:text-white">सर्वोत्तम विकल्प पर आगे बढ़ें</h4>
          <p className="text-xs text-gray-500 dark:text-darkbg-muted">प्रस्ताव स्वीकार करें अथवा खरीदार से संपर्क करें</p>
        </div>
        <Link
          to={`/my-lots/${lotId}`}
          className="w-full sm:w-auto px-6 py-3.5 bg-krishi-600 hover:bg-krishi-700 active:bg-krishi-800 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-md touch-btn transition"
        >
          <span>डिजिटल प्रस्ताव देखें</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
