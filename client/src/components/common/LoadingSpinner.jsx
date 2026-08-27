import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function LoadingSpinner({ message = null }) {
  const { lang } = useLanguage();
  const defaultMsg = lang === 'hi' ? 'डेटा लोड हो रहा है...' : 'Loading data...';

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-3">
      <div className="w-10 h-10 border-4 border-krishi-200 dark:border-darkbg-border border-t-krishi-600 dark:border-t-kisan-gold rounded-full animate-spin"></div>
      <p className="text-xs sm:text-sm font-semibold text-gray-600 dark:text-darkbg-muted animate-pulse">
        {message || defaultMsg}
      </p>
    </div>
  );
}
