import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import {
  Globe,
  LogOut,
  Mic,
  ShieldCheck,
  Landmark,
  Sun,
  Moon,
} from 'lucide-react';
import VoiceAssistantModal from './VoiceAssistantModal';

export default function Header() {
  const { lang, toggleLanguage, t } = useLanguage();
  const { user, logout, isAuthenticated } = useAuth();
  const { toggleTheme, isDark } = useTheme();

  const navigate = useNavigate();
  const location = useLocation();

  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'admin';
  const isFpo = user?.role === 'fpo' || user?.role === 'admin';

  const navItemClass = (active) =>
    `flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap shrink-0 transition-all duration-200 ${
      active
        ? 'bg-krishi-700 dark:bg-darkbg-card text-kisan-gold shadow-sm'
        : 'text-krishi-100 hover:bg-krishi-700/60 hover:text-white'
    }`;

  return (
    <>
      <header className="bg-krishi-800 dark:bg-darkbg-surface text-white shadow-md sticky top-0 z-30 border-b border-krishi-700/50 dark:border-darkbg-border transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 sm:py-3 flex items-center gap-5">

          {/* =====================================================
              BRAND
          ====================================================== */}
          <Link
            to="/"
            className="flex items-center space-x-2.5 group shrink-0"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-krishi-500 to-krishi-700 p-1.5 shadow-md flex items-center justify-center border border-krishi-400/30 group-hover:scale-105 transition">
              <span className="text-xl">🌾</span>
            </div>

            <div>
              <h1 className="text-base sm:text-lg font-black leading-tight tracking-tight flex items-center gap-1.5 font-sans">
                <span className="bg-gradient-to-r from-white via-krishi-100 to-kisan-gold bg-clip-text text-transparent">
                  {t('app_name')}
                </span>
              </h1>

              <p className="text-[10px] text-krishi-200 dark:text-darkbg-muted hidden xs:block font-medium whitespace-nowrap">
                {t('app_tagline')}
              </p>
            </div>
          </Link>


          {/* =====================================================
              DESKTOP NAVIGATION
          ====================================================== */}
          <nav className="hidden md:flex items-center justify-center gap-1.5 text-xs font-bold flex-1 min-w-0">

            {/* Market Prices */}
            <Link
              to="/market"
              className={navItemClass(location.pathname === '/market')}
            >
              <span>📊</span>
              <span>{t('prices')}</span>
            </Link>

            {/* Sell Produce */}
            <Link
              to="/sell"
              className={navItemClass(location.pathname === '/sell')}
            >
              <span>🌾</span>
              <span>{t('sell')}</span>
            </Link>

            {/* My Lots */}
            <Link
              to="/my-lots"
              className={navItemClass(
                location.pathname.startsWith('/my-lots')
              )}
            >
              <span>📦</span>
              <span>{t('my_lots')}</span>
            </Link>

            {/* My Orders */}
            <Link
              to="/orders"
              className={navItemClass(location.pathname === '/orders')}
            >
              <span>🚚</span>
              <span>{t('orders')}</span>
            </Link>

            {/* Buyer Portal */}
            <Link
              to="/buyer"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl whitespace-nowrap shrink-0 transition-all duration-200 font-black ${
                location.pathname.startsWith('/buyer')
                  ? 'bg-amber-500 text-gray-950 shadow-sm ring-2 ring-amber-300/40'
                  : 'bg-amber-500 hover:bg-amber-400 text-gray-950 shadow-sm'
              }`}
            >
              <span>💼</span>
              <span>{t('buyer_panel')}</span>
            </Link>

            {/* FPO Portal */}
            {isFpo && (
              <Link
                to="/fpo"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap shrink-0 transition-all duration-200 font-black ${
                  location.pathname.startsWith('/fpo')
                    ? 'bg-purple-700 text-white ring-2 ring-purple-300/40'
                    : 'bg-purple-700 hover:bg-purple-800 text-white'
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>एफपीओ</span>
              </Link>
            )}

            {/* Admin Portal */}
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl whitespace-nowrap shrink-0 transition-all duration-200 font-black ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-rose-700 text-white ring-2 ring-rose-300/40'
                    : 'bg-rose-700 hover:bg-rose-800 text-white'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>एडमिन</span>
              </Link>
            )}
          </nav>


          {/* =====================================================
              RIGHT SIDE CONTROLS
              IMPORTANT:
              ml-3 + shrink-0 prevents Buyer Portal / Voice collision
          ====================================================== */}
          <div className="flex items-center gap-2.5 shrink-0 ml-3">

            {/* Voice Assistant */}
            <button
              onClick={() => setVoiceModalOpen(true)}
              className="bg-gradient-to-r from-kisan-amber to-kisan-gold hover:from-kisan-gold hover:to-amber-400 text-gray-950 font-black px-3 py-2 rounded-xl flex items-center gap-1.5 text-xs shadow-md transition active:scale-95 whitespace-nowrap shrink-0"
              title="बोलकर पूछें (Voice Assistant)"
              aria-label="Voice Assistant"
            >
              <Mic className="w-4 h-4 text-gray-950 animate-pulse" />
              <span className="hidden sm:inline">बोलें</span>
            </button>


            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-krishi-900/60 dark:bg-darkbg-card hover:bg-krishi-700 text-krishi-100 hover:text-white transition border border-krishi-600/40 dark:border-darkbg-border active:scale-95 shrink-0"
              title={
                isDark
                  ? 'Light Mode (दिन का मोड)'
                  : 'Dark Mode (रात का मोड)'
              }
              aria-label="Theme Toggle"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-kisan-gold" />
              ) : (
                <Moon className="w-4 h-4 text-krishi-200" />
              )}
            </button>


            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-krishi-900/60 dark:bg-darkbg-card hover:bg-krishi-700 text-krishi-100 hover:text-white transition border border-krishi-600/40 dark:border-darkbg-border flex items-center space-x-1 text-xs font-bold active:scale-95 whitespace-nowrap shrink-0"
              title="भाषा बदलें (Switch Language)"
              aria-label="Language Toggle"
            >
              <Globe className="w-3.5 h-3.5 text-kisan-gold" />
              <span className="font-mono">
                {lang === 'hi' ? 'ENG' : 'हिंदी'}
              </span>
            </button>


            {/* =================================================
                AUTHENTICATED USER
            ================================================== */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-1.5 pl-1 shrink-0">

                <img
                  src="/assets/images/farmer/farmer-avatar.png"
                  alt={user?.name || 'Farmer'}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl object-cover border border-krishi-400/40 shadow-xs shrink-0"
                />

                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-[11px] font-extrabold leading-none text-white truncate max-w-[90px]">
                    {user?.name?.split(' ')[0] || 'User'}
                  </span>

                  <span className="text-[9px] text-kisan-gold capitalize font-semibold leading-none mt-0.5">
                    {user?.role === 'farmer'
                      ? '🌾 किसान'
                      : user?.role === 'buyer'
                        ? '💼 खरीदार'
                        : user?.role}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  className="p-1.5 sm:p-2 rounded-xl bg-rose-900/40 hover:bg-rose-600 text-rose-200 hover:text-white transition border border-rose-700/50 active:scale-95 shrink-0"
                  title={t('logout')}
                  aria-label="Logout"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (

              /* =================================================
                  LOGIN BUTTON
              ================================================== */
              <Link
                to="/login"
                className="bg-white hover:bg-krishi-100 text-krishi-800 text-xs font-extrabold px-3.5 py-2 rounded-xl transition shadow-sm whitespace-nowrap shrink-0"
              >
                {t('login')}
              </Link>
            )}
          </div>
        </div>
      </header>


      {/* =======================================================
          VOICE ASSISTANT MODAL
      ======================================================== */}
      <VoiceAssistantModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
      />
    </>
  );
}
