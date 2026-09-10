import React from 'react';
import { Home, IndianRupee, Package, ShoppingCart, Wheat } from 'lucide-react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const BottomNav = ({ language = 'hi' }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const items = [
    {
      path: '/',
      label: language === 'hi' ? 'होम' : 'Home',
      icon: Home,
    },
    {
      path: '/market',
      label: language === 'hi' ? 'भाव' : 'Prices',
      icon: IndianRupee,
    },
    {
      path: '/my-lots',
      label: language === 'hi' ? 'फसल' : 'My Lots',
      icon: Wheat,
    },
    {
      path: '/orders',
      label: language === 'hi' ? 'ऑर्डर' : 'Orders',
      icon: Package,
    },
  ];

  const isSellPage =
    location.pathname === '/sell' ||
    location.pathname === '/create-lot';

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 px-3 pb-[max(8px,env(safe-area-inset-bottom))] lg:hidden">
      <div className="mx-auto flex h-[68px] max-w-md items-center justify-around rounded-2xl border border-slate-200/80 bg-white/95 px-1 shadow-[0_8px_30px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-[#111914]/95">

        {/* Home / Market / Lots */}
        {items.slice(0, 2).map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  'flex h-14 min-w-[58px] flex-col items-center justify-center gap-1 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'text-slate-500 dark:text-slate-400',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={19}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="text-[10px] font-bold">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        {/* Central Sell button */}
        <button
          onClick={() => navigate('/sell')}
          className="relative -mt-7 flex h-[58px] w-[58px] flex-shrink-0 items-center justify-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-700/25 transition-all duration-200 active:scale-95 hover:bg-emerald-800"
          aria-label={language === 'hi' ? 'फसल बेचें' : 'Sell crop'}
        >
          <div className="absolute inset-1 rounded-[13px] border border-white/20" />

          <div className="flex flex-col items-center">
            <ShoppingCart size={21} strokeWidth={2.3} />
            <span className="mt-0.5 text-[8px] font-extrabold">
              {language === 'hi' ? 'बेचें' : 'SELL'}
            </span>
          </div>

          {isSellPage && (
            <span className="absolute -bottom-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
          )}
        </button>

        {/* My Lots / Orders */}
        {items.slice(2).map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                [
                  'flex h-14 min-w-[58px] flex-col items-center justify-center gap-1 rounded-xl transition-all duration-200',
                  isActive
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'text-slate-500 dark:text-slate-400',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={19}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <span className="text-[10px] font-bold">
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
