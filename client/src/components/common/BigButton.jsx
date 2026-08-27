import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function BigButton({
  onClick,
  title,
  subtitle,
  icon: Icon,
  emoji,
  color = 'green', // green, amber, blue, purple
  disabled = false,
  badge = null
}) {
  const colorMap = {
    green: 'bg-white dark:bg-darkbg-card border-2 border-krishi-500/80 dark:border-krishi-600/50 hover:bg-krishi-50/70 dark:hover:bg-darkbg-hover text-krishi-950 dark:text-white shadow-sm hover:shadow-md active:bg-krishi-100',
    amber: 'bg-white dark:bg-darkbg-card border-2 border-amber-500/80 dark:border-amber-600/50 hover:bg-amber-50/70 dark:hover:bg-darkbg-hover text-amber-950 dark:text-white shadow-sm hover:shadow-md active:bg-amber-100',
    blue: 'bg-white dark:bg-darkbg-card border-2 border-sky-500/80 dark:border-sky-600/50 hover:bg-sky-50/70 dark:hover:bg-darkbg-hover text-sky-950 dark:text-white shadow-sm hover:shadow-md active:bg-sky-100',
    purple: 'bg-white dark:bg-darkbg-card border-2 border-purple-500/80 dark:border-purple-600/50 hover:bg-purple-50/70 dark:hover:bg-darkbg-hover text-purple-950 dark:text-white shadow-sm hover:shadow-md active:bg-purple-100'
  };

  const iconBgMap = {
    green: 'bg-krishi-100 dark:bg-krishi-900/60 text-krishi-700 dark:text-krishi-300 border border-krishi-200 dark:border-krishi-700/50',
    amber: 'bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700/50',
    blue: 'bg-sky-100 dark:bg-sky-900/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-700/50',
    purple: 'bg-purple-100 dark:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50'
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`w-full p-4 sm:p-5 rounded-2xl flex items-center space-x-3.5 text-left transition-all duration-200 relative farmer-card touch-btn ${
        colorMap[color] || colorMap.green
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    >
      {/* Icon or Emoji Avatar */}
      <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-2xl shrink-0 shadow-inner ${iconBgMap[color] || iconBgMap.green}`}>
        {emoji ? <span>{emoji}</span> : Icon ? <Icon className="w-6 h-6 sm:w-7 sm:h-7" /> : <span>🌾</span>}
      </div>

      {/* Text Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <h3 className="text-base sm:text-lg font-black tracking-tight text-gray-900 dark:text-white truncate">
            {title}
          </h3>
          {badge && (
            <span className="text-[10px] bg-gradient-to-r from-red-600 to-rose-500 text-white font-black px-2 py-0.5 rounded-full shadow-xs">
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-600 dark:text-darkbg-muted font-medium leading-snug truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right chevron indicator */}
      <div className="text-gray-400 dark:text-gray-500 font-bold text-xl shrink-0 pr-1 group-hover:translate-x-1 transition">
        <ChevronRight className="w-5 h-5" />
      </div>
    </button>
  );
}
