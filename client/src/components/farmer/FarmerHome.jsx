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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHighlightPrices() {
      try {
        const prices = await MarketService.getPrices();
        setTopPrices((prices || []).slice(0, 3));
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
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      {/* 🌾 Farmer Greeting Hero Card */}
      <div className="bg-gradient-to-r from-krishi-700 via-krishi-800 to-krishi-900 dark:from-darkbg-surface dark:via-darkbg-card dark:to-darkbg-surface text-white p-5 sm:p-6 rounded-3xl border border-krishi-600/40 dark:border-darkbg-border shadow-farmer flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative overflow-hidden">
        {/* Background decorative wheat watermark */}
        <div className="absolute right-0 bottom-0 translate-x-4 translate-y-4 text-7xl sm:text-8xl opacity-10 select-none pointer-events-none">
          🌾
        </div>

        <div className="flex items-center space-x-3.5 sm:space-x-4 relative z-10">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 dark:bg-darkbg-surface border border-white/20 dark:border-darkbg-border flex items-center justify-center text-3xl shrink-0 shadow-inner backdrop-blur-xs">
            👨‍🌾
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {user ? user.name : (lang === 'hi' ? 'नमस्ते किसान भाई!' : 'Welcome Farmer!')}
              </h2>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-300" />
                सत्यापित
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-krishi-100 dark:text-darkbg-muted font-medium mt-1">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-kisan-gold shrink-0" />
                {user?.village || 'बैरसिया'}, {user?.district || 'भोपाल'} ({user?.state || 'म.प्र.'})
              </span>
              <span className="hidden sm:inline opacity-40">•</span>
              <span className="flex items-center gap-1 opacity-90">
                <Calendar className="w-3.5 h-3.5 text-krishi-300 shrink-0" />
                {todayFormatted}
              </span>
            </div>
          </div>
        </div>

        {/* Quick sell produce direct trigger */}
        <div className="relative z-10 shrink-0">
          <button
            onClick={() => navigate('/sell')}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-kisan-gold to-amber-500 hover:from-amber-400 hover:to-amber-500 text-gray-950 font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition"
          >
            <span>🌾 अपनी फसल बेचें</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 🎤 Voice Assistant Banner */}
      <VoiceButton onVoiceQuery={handleVoiceQuery} />

      {/* 🌾 4 Core Action Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
        {/* 1. आज का भाव */}
        <BigButton
          title={t('action_today_price_title')}
          subtitle={t('action_today_price_desc')}
          emoji="🌾"
          color="green"
          onClick={() => navigate('/market')}
        />

        {/* 2. अपनी फसल बेचें */}
        <BigButton
          title={t('action_sell_title')}
          subtitle={t('action_sell_desc')}
          emoji="💰"
          color="amber"
          badge="5-स्टेप"
          onClick={() => navigate('/sell')}
        />

        {/* 3. खरीदार खोजें */}
        <BigButton
          title={t('action_buyers_title')}
          subtitle={t('action_buyers_desc')}
          emoji="🔍"
          color="blue"
          onClick={() => navigate('/my-lots')}
        />

        {/* 4. मेरी फसल */}
        <BigButton
          title={t('action_my_lots_title')}
          subtitle={t('action_my_lots_desc')}
          emoji="📦"
          color="purple"
          onClick={() => navigate('/my-lots')}
        />
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
