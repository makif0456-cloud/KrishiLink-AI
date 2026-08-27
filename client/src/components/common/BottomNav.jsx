import React from 'react';
import { NavLink } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { Home, TrendingUp, PlusCircle, Package, ShoppingBag } from 'lucide-react';

export default function BottomNav() {
  const { t } = useLanguage();

  const navItems = [
    { to: '/', label: t('home'), icon: Home },
    { to: '/market', label: t('prices'), icon: TrendingUp },
    { to: '/sell', label: t('sell'), icon: PlusCircle, isHighlight: true },
    { to: '/my-lots', label: t('my_lots'), icon: Package },
    { to: '/orders', label: t('orders'), icon: ShoppingBag }
  ];

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-darkbg-surface/95 backdrop-blur-md border-t border-gray-200 dark:border-darkbg-border z-40 shadow-xl px-1.5 py-1 flex items-center justify-around transition-colors">
      {navItems.map(item => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 text-center touch-btn transition-all duration-200 rounded-xl ${
                isActive
                  ? 'text-krishi-700 dark:text-kisan-gold font-black bg-krishi-50 dark:bg-darkbg-card shadow-xs'
                  : 'text-gray-500 dark:text-darkbg-muted hover:text-gray-900 dark:hover:text-white font-medium'
              } ${item.isHighlight ? 'relative -top-2.5' : ''}`
            }
          >
            {item.isHighlight ? (
              <div className="bg-gradient-to-tr from-krishi-600 to-krishi-500 text-white p-3 rounded-full shadow-lg border-2 border-white dark:border-darkbg-surface -mb-1 transform active:scale-95 transition">
                <Icon className="w-5 h-5" />
              </div>
            ) : (
              <Icon className="w-5 h-5 mb-0.5" />
            )}
            <span className="text-[10px] font-bold leading-tight mt-0.5 truncate max-w-[64px]">
              {item.label}
            </span>
          </NavLink>
        );
      })}
    </nav>
  );
}
