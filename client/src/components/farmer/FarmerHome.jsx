import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import BigButton from '../common/BigButton';
import VoiceButton from '../common/VoiceButton';
import PriceCard from '../common/PriceCard';
import LoadingSpinner from '../common/LoadingSpinner';
import { MarketService } from '../../services/marketService';
import { ArrowRight, ShieldCheck, Sparkles, MapPin, Calendar, TrendingUp } from 'lucide-react';

export default function FarmerHome() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [topPrices, setTopPrices] = useState([]);
  const [opportunity, setOpportunity] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHighlightPrices() {
      try {
        const prices = await MarketService.getPrices();
        setTopPrices((prices || []).slice(0, 3));

        // Load dynamic market price comparison for the suggestion banner
        try {
          const comms = await MarketService.getCommodities();
          if (comms && comms.length > 0) {
            const comp = await MarketService.comparePrices(comms[0].id);
            setOpportunity(comp);
          }
        } catch (e) {
          // Keep graceful fallback
        }
      } catch (err) {
        console.error('Failed to load highlight prices', err);
      } finally {
        setLoading(false);
      }
    }
    loadHighlightPrices();
  }, []);

  const handleVoiceQuery = (queryText) => {
    navigate(`/market?query=${encodeURIComponent(queryText)}`);
  };

  const todayFormatted = new Date().toLocaleDateString(lang === 'hi' ? 'hi-IN' : 'en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  return (
    <div className="space-y-4 sm:space-y-6 max-w-5xl mx-auto">
      {/* 🌾 Top Row: Large Farmer Hero Card + Weather Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Large Farmer Hero Section (8 cols on desktop) */}
        <div className="lg:col-span-7 xl:col-span-8 relative rounded-3xl overflow-hidden shadow-farmer border border-krishi-600/30 dark:border-darkbg-border min-h-[220px] sm:min-h-[260px] flex flex-col justify-between p-5 sm:p-7 bg-krishi-900 text-white group">
          {/* Real Agricultural Photography: farmer-hero.png */}
          <img
            src="/assets/images/hero/farmer-hero.png"
            alt="Indian Farmer in Agricultural Field"
            className="absolute inset-0 w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />
          {/* Subtle overlay for optimal text contrast and readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent sm:from-black/85 sm:via-black/55 sm:to-black/20 pointer-events-none"></div>

          <div className="relative z-10 flex flex-col justify-between h-full space-y-4">
            <div className="space-y-1.5 max-w-md">
              <div className="inline-flex items-center gap-1.5 bg-emerald-500/30 backdrop-blur-md text-emerald-200 border border-emerald-400/50 font-black px-2.5 py-0.5 rounded-full text-[11px] shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                <span>सत्यापित किसान पोर्टल (Verified Farmer)</span>
              </div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white tracking-tight drop-shadow-md">
                {user ? `नमस्ते, ${user.name}!` : (lang === 'hi' ? 'नमस्ते किसान भाई!' : 'Welcome Farmer!')}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-krishi-100 font-medium drop-shadow-sm pt-0.5">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-kisan-gold shrink-0" />
                  {user?.village || 'बैरसिया'}, {user?.district || 'भोपाल'} ({user?.state || 'म.प्र.'})
                </span>
                <span className="opacity-60">•</span>
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-krishi-200 shrink-0" />
                  {todayFormatted}
                </span>
              </div>
            </div>

            {/* Quick sell produce direct trigger */}
            <div className="pt-2">
              <button
                onClick={() => navigate('/sell')}
                className="w-full sm:w-auto px-4 sm:px-5 py-2.5 rounded-xl bg-gradient-to-r from-kisan-gold to-amber-500 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition border border-amber-300/40"
              >
                <span>🌾 अपनी फसल बेचें</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* 🌤️ Weather Card on Right (4 cols on desktop) */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-darkbg-surface p-4 sm:p-5 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm flex flex-col justify-between space-y-3 transition-colors">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-darkbg-border">
            <span className="text-xs font-black text-gray-900 dark:text-white">मौसम पूर्वानुमान (Weather)</span>
            <span className="text-[10px] bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 font-bold px-2 py-0.5 rounded-full border border-sky-200 dark:border-sky-800">
              {user?.district || 'भोपाल'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-baseline space-x-1">
                <span className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white">32°</span>
                <span className="text-sm font-bold text-gray-500 dark:text-darkbg-muted">C</span>
              </div>
              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5">
                धूप खिली है (Clear & Sunny)
              </p>
              <p className="text-[11px] text-gray-500 dark:text-darkbg-muted">
                आर्द्रता: 46% • वायु गति: 12 km/h
              </p>
            </div>
            <div className="w-16 h-16 sm:w-18 sm:h-18 shrink-0">
              <img
                src="/assets/images/weather/sunny.png"
                alt="Sunny weather"
                className="w-full h-full object-contain filter drop-shadow-sm"
              />
            </div>
          </div>

          {/* Crop Suitability Bar with leaf.png */}
          <div className="bg-emerald-50 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 flex items-center space-x-2.5">
            <img
              src="/assets/images/weather/leaf.png"
              alt="Crop Advisory"
              className="w-5 h-5 object-contain shrink-0"
            />
            <div className="text-[11px] text-emerald-900 dark:text-emerald-200 leading-tight">
              <strong>फसल सलाह:</strong> कटाई एवं सुखाने के लिए उत्तम मौसम
            </div>
          </div>

          {/* Forecast Outlook Strip with forecast.png */}
          <div className="flex items-center justify-between pt-1 border-t border-gray-100 dark:border-darkbg-border text-[11px] text-gray-600 dark:text-darkbg-muted font-medium">
            <div className="flex items-center gap-1.5">
              <img src="/assets/images/weather/forecast.png" alt="" className="w-3.5 h-3.5 object-contain" />
              <span>3-दिवसीय पूर्वानुमान</span>
            </div>
            <span className="font-bold text-gray-800 dark:text-gray-200">स्थिर • वर्षा शून्य</span>
          </div>
        </div>
      </div>

      {/* 🎤 Voice Assistant Banner */}
      <VoiceButton onVoiceQuery={handleVoiceQuery} />

      {/* 🌾 4 Core Action Cards with Agriculture Photography */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {/* 1. आज का भाव */}
        <BigButton
          title={t('action_today_price_title')}
          subtitle={t('action_today_price_desc')}
          emoji="🌾"
          color="green"
          image="/assets/images/cards/mandi-market.png"
          onClick={() => navigate('/market')}
        />

        {/* 2. अपनी फसल बेचें */}
        <BigButton
          title={t('action_sell_title')}
          subtitle={t('action_sell_desc')}
          emoji="💰"
          color="amber"
          badge="5-स्टेप"
          image="/assets/images/cards/sell-crop.png"
          onClick={() => navigate('/sell')}
        />

        {/* 3. खरीदार खोजें */}
        <BigButton
          title={t('action_buyers_title')}
          subtitle={t('action_buyers_desc')}
          emoji="🔍"
          color="blue"
          image="/assets/images/cards/buyer-search.png"
          onClick={() => navigate('/my-lots')}
        />

        {/* 4. मेरी फसल */}
        <BigButton
          title={t('action_my_lots_title')}
          subtitle={t('action_my_lots_desc')}
          emoji="📦"
          color="purple"
          image="/assets/images/cards/my-crop.png"
          onClick={() => navigate('/my-lots')}
        />
      </div>

      {/* 🌟 Market Opportunity / "आज का सुझाव" Section */}
      <div className="bg-gradient-to-r from-emerald-700 via-krishi-800 to-krishi-900 dark:from-darkbg-card dark:via-darkbg-surface dark:to-darkbg-card text-white rounded-3xl p-5 sm:p-6 border border-emerald-500/40 dark:border-darkbg-border shadow-md relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-5 transition-colors">
        <div className="flex-1 space-y-2.5 z-10">
          <div className="flex items-center space-x-1.5">
            <span className="text-[11px] bg-kisan-gold text-gray-950 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 shadow-xs">
              <Sparkles className="w-3.5 h-3.5 text-gray-950" />
              आज का सुझाव • Market Opportunity
            </span>
          </div>

          <h3 className="text-lg sm:text-xl font-black text-white leading-snug">
            {opportunity && opportunity.price_gap_per_quintal > 0
              ? `${opportunity.highest_mandi?.name || 'निकटतम मंडी'} में भाव ₹${opportunity.highest_mandi?.price || 2700}/क्विंटल तक उपलब्ध!`
              : 'अपनी उपज सीधे सत्यापित खरीदारों को बेचें एवं पल्लेदारी बचाएं'}
          </h3>

          <p className="text-xs sm:text-sm text-krishi-100 dark:text-darkbg-muted leading-relaxed max-w-xl">
            {opportunity && opportunity.price_gap_per_quintal > 0
              ? `न्यूनतम मंडी से +₹${opportunity.price_gap_per_quintal}/क्विंटल का अंतर है। 50 क्विंटल बेचने पर लगभग +₹${(opportunity.price_gap_per_quintal * 50).toLocaleString('en-IN')} का संभावित अतिरिक्त लाभ प्राप्त करें।`
              : 'कृषि लिंक पर सीधे खरीदार से सौदा करने पर 2.5% मंडी कमीशन और परिवहन खर्च की सीधी बचत होती है।'}
          </p>

          <div className="pt-1 flex flex-wrap gap-2">
            <button
              onClick={() => navigate('/market')}
              className="px-4 py-2 rounded-xl bg-kisan-gold hover:bg-amber-400 text-gray-950 font-black text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition"
            >
              <span>भाव तुलना देखें</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => navigate('/sell')}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 active:scale-95 transition"
            >
              फसल ऑफर बनाएं
            </button>
          </div>
        </div>

        {/* Tall / Right-side Visual Image from market-opportunity.png */}
        <div className="w-full sm:w-44 md:w-56 h-36 sm:h-44 rounded-2xl overflow-hidden shrink-0 border border-white/20 dark:border-darkbg-border shadow-lg relative z-10">
          <img
            src="/assets/images/market/market-opportunity.png"
            alt="Market Opportunity"
            loading="lazy"
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* 📊 Live Market Prices Preview Section */}
      <div className="bg-white dark:bg-darkbg-surface p-4 sm:p-5 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm space-y-3.5 transition-colors">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-xl bg-krishi-100 dark:bg-krishi-900/60 text-krishi-700 dark:text-krishi-300 flex items-center justify-center text-base">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
              {t('prices')} — मुख्य मंडियां
            </h3>
          </div>
          <button
            onClick={() => navigate('/market')}
            className="text-xs sm:text-sm font-bold text-krishi-700 dark:text-kisan-gold hover:underline flex items-center space-x-1 touch-btn"
          >
            <span>{t('all')} देखें</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : topPrices.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {topPrices.map((price, idx) => (
              <PriceCard key={price.id || idx} price={price} isBestPrice={idx === 0} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-gray-500 dark:text-darkbg-muted text-center py-4">
            {t('no_prices_found')}
          </p>
        )}
      </div>
    </div>
  );
}
