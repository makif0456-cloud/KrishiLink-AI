import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

export default function CommoditySelector({ commodities = [], selectedId, onSelect }) {
  const { lang, t } = useLanguage();

  return (
    <div className="space-y-2">
      <label className="block text-sm font-extrabold text-gray-800 dark:text-gray-200">
        🌾 {t('select_crop')}
      </label>
      
      {/* Horizontal scrollable or wrapped icon cards for easy tapping */}
      <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2 sm:gap-2.5">
        {commodities.map((item) => {
          const isSelected = selectedId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item.id)}
              type="button"
              className={`p-2.5 sm:p-3 rounded-2xl flex flex-col items-center justify-center transition-all duration-200 touch-btn border text-center active:scale-95 ${
                isSelected
                  ? 'bg-krishi-600 dark:bg-krishi-600 border-krishi-700 dark:border-krishi-400 text-white font-black shadow-md ring-2 ring-krishi-400/50 scale-[1.03]'
                  : 'bg-white dark:bg-darkbg-card border-gray-200 dark:border-darkbg-border text-gray-800 dark:text-gray-200 hover:bg-krishi-50 dark:hover:bg-darkbg-hover hover:border-krishi-300 dark:hover:border-krishi-700 shadow-xs'
              }`}
            >
              <span className="text-2xl sm:text-3xl mb-1 filter drop-shadow-xs">{item.icon || '🌾'}</span>
              <span className="text-xs sm:text-sm font-bold truncate max-w-full">
                {lang === 'hi' ? item.name_hi : item.name_en}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
