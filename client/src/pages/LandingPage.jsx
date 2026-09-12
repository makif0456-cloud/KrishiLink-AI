import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles, ArrowRight, ShieldCheck, TrendingUp, Users } from 'lucide-react';

export default function LandingPage() {
  const { lang, setLang, t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSelectLanguage = (selectedLang) => {
    setLang(selectedLang);
    if (isAuthenticated) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 py-8 max-w-xl mx-auto text-center space-y-6 sm:space-y-8">
      {/* Supporting Agriculture Background */}
      <img
        src="/assets/images/commons/agriculture-background.png"
        alt=""
        aria-hidden="true"
        className="fixed inset-0 w-full h-full object-cover opacity-5 dark:opacity-10 pointer-events-none -z-10"
      />

      {/* Hero Visual Card with landing-hero.png */}
      <div className="w-full h-44 sm:h-52 rounded-3xl overflow-hidden shadow-farmer border border-krishi-600/30 dark:border-darkbg-border relative group">
        <img
          src="/assets/images/hero/landing-hero.png"
          alt="Indian Agriculture & Farming"
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent flex flex-col justify-end p-4 sm:p-5 text-left">
          <div className="inline-flex items-center space-x-1.5 bg-kisan-gold/90 text-gray-950 text-[10px] font-black px-2.5 py-0.5 rounded-full w-fit mb-1 shadow-xs">
            <Sparkles className="w-3 h-3 text-gray-950" />
            <span>स्मार्ट कृषि विपणन मंच</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-white leading-tight drop-shadow-md">
            {t('app_name')}
          </h2>
          <p className="text-xs text-krishi-100 font-medium line-clamp-1 drop-shadow-xs">
            {t('app_tagline')}
          </p>
        </div>
      </div>

      {/* Language Selection Box */}
      <div className="w-full bg-white dark:bg-darkbg-surface p-5 sm:p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-md space-y-4 transition-colors">
        <h2 className="text-base font-black text-gray-900 dark:text-white">
          कृपया अपनी पसंदीदा भाषा चुनें / Choose Language
        </h2>

        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <button
            onClick={() => handleSelectLanguage('hi')}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all touch-btn ${
              lang === 'hi'
                ? 'border-krishi-600 dark:border-kisan-gold bg-krishi-50 dark:bg-darkbg-card text-krishi-900 dark:text-white font-black shadow-sm ring-2 ring-krishi-300/40'
                : 'border-gray-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface hover:bg-gray-50 dark:hover:bg-darkbg-card text-gray-800 dark:text-gray-200'
            }`}
          >
            <span className="text-3xl mb-1.5">🇮🇳</span>
            <span className="text-base font-bold">हिंदी (Hindi)</span>
            <span className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">अनुशंसित (Recommended)</span>
          </button>

          <button
            onClick={() => handleSelectLanguage('en')}
            className={`p-4 rounded-2xl border-2 flex flex-col items-center justify-center transition-all touch-btn ${
              lang === 'en'
                ? 'border-krishi-600 dark:border-kisan-gold bg-krishi-50 dark:bg-darkbg-card text-krishi-900 dark:text-white font-black shadow-sm ring-2 ring-krishi-300/40'
                : 'border-gray-200 dark:border-darkbg-border bg-white dark:bg-darkbg-surface hover:bg-gray-50 dark:hover:bg-darkbg-card text-gray-800 dark:text-gray-200'
            }`}
          >
            <span className="text-3xl mb-1.5">🌐</span>
            <span className="text-base font-bold">English</span>
            <span className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">International</span>
          </button>
        </div>

        <button
          onClick={() => handleSelectLanguage(lang)}
          className="w-full bg-krishi-600 hover:bg-krishi-700 active:bg-krishi-800 text-white font-black py-3.5 px-4 rounded-2xl flex items-center justify-center space-x-2 text-base shadow-md transition touch-btn"
        >
          <span>आगे बढ़ें (Continue)</span>
          <ArrowRight className="w-5 h-5" />
        </button>
      </div>

      {/* Feature Highlights */}
      <div className="grid grid-cols-3 gap-2 text-left w-full">
        <div className="bg-white dark:bg-darkbg-surface p-2.5 sm:p-3 rounded-2xl border border-gray-200 dark:border-darkbg-border text-center transition-colors">
          <TrendingUp className="w-5 h-5 text-krishi-600 dark:text-kisan-gold mx-auto mb-1" />
          <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 block">सटीक भाव</span>
        </div>
        <div className="bg-white dark:bg-darkbg-surface p-2.5 sm:p-3 rounded-2xl border border-gray-200 dark:border-darkbg-border text-center transition-colors">
          <ShieldCheck className="w-5 h-5 text-krishi-600 dark:text-kisan-gold mx-auto mb-1" />
          <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 block">सत्यापित खरीदार</span>
        </div>
        <div className="bg-white dark:bg-darkbg-surface p-2.5 sm:p-3 rounded-2xl border border-gray-200 dark:border-darkbg-border text-center transition-colors">
          <Users className="w-5 h-5 text-krishi-600 dark:text-kisan-gold mx-auto mb-1" />
          <span className="text-[11px] font-bold text-gray-800 dark:text-gray-200 block">सीधी कमाई</span>
        </div>
      </div>
    </div>
  );
}
