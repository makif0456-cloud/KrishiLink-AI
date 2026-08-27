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
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-8 max-w-lg mx-auto text-center space-y-6 sm:space-y-8">
      {/* Hero Visual */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-krishi-100 dark:bg-darkbg-card border-2 border-krishi-300 dark:border-darkbg-border flex items-center justify-center text-4xl sm:text-5xl shadow-md mx-auto">
        🌾
      </div>

      {/* Main Headlines */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-1.5 bg-krishi-100 dark:bg-krishi-900/60 text-krishi-800 dark:text-krishi-300 text-xs font-black px-3.5 py-1 rounded-full border border-krishi-300 dark:border-krishi-800">
          <Sparkles className="w-3.5 h-3.5 text-krishi-600 dark:text-kisan-gold" />
          <span>Smart India Hackathon 2024 (PS 26132)</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight">
          {t('app_name')}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-darkbg-muted font-medium">
          {t('app_tagline')}
        </p>
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
