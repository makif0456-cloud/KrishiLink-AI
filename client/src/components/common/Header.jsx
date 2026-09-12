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

  return (
    <>
      <header className="bg-krishi-800 dark:bg-darkbg-surface text-white shadow-md sticky top-0 z-30 border-b border-krishi-700/50 dark:border-darkbg-border transition-colors">
        <div className="max-w-6xl mx-auto px-3 sm:px-5 py-2.5 sm:py-3 flex items-center justify-between gap-2">

          {/* ==================== BRAND ==================== */}
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

              <p className="text-[10px] text-krishi-200 dark:text-darkbg-muted hidden lg:block font-medium">
                {t('app_tagline')}
              </p>
            </div>
          </Link>


          {/* ==================== DESKTOP NAVIGATION ==================== */}
          <nav className="hidden md:flex items-center gap-0.5 text-[11px] font-bold min-w-0">

            {/* Market Prices */}
            <Link
              to="/market"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all ${
                location.pathname === '/market'
                  ? 'bg-amber-500 text-gray-950 shadow-sm'
                  : 'text-white hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>📊</span>
              <span>{t('prices')}</span>
            </Link>


            {/* Sell Produce */}
            <Link
              to="/sell"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all ${
                location.pathname === '/sell'
                  ? 'bg-amber-500 text-gray-950 shadow-sm'
                  : 'text-white hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>🌾</span>
              <span>{t('sell')}</span>
            </Link>


            {/* My Lots */}
            <Link
              to="/my-lots"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all ${
                location.pathname.startsWith('/my-lots')
                  ? 'bg-amber-500 text-gray-950 shadow-sm'
                  : 'text-white hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>📦</span>
              <span>{t('my_lots')}</span>
            </Link>


            {/* My Orders */}
            <Link
              to="/orders"
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all ${
                location.pathname === '/orders'
                  ? 'bg-amber-500 text-gray-950 shadow-sm'
                  : 'text-white hover:bg-white/10 hover:text-white'
              }`}
            >
              <span>🚚</span>
              <span>{t('orders')}</span>
            </Link>


            {/* Buyer Portal */}
            <Link
              to="/buyer"
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full whitespace-nowrap transition-all font-black ${
                location.pathname.startsWith('/buyer')
                  ? 'bg-amber-500 text-gray-950 shadow-sm'
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
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all font-black ${
                  location.pathname.startsWith('/fpo')
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-purple-600/90 hover:bg-purple-500 text-white'
                }`}
              >
                <Landmark className="w-3 h-3" />
                <span>एफपीओ</span>
              </Link>
            )}


            {/* Admin Portal */}
            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full whitespace-nowrap transition-all font-black ${
                  location.pathname.startsWith('/admin')
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'bg-rose-600/90 hover:bg-rose-500 text-white'
                }`}
              >
                <ShieldCheck className="w-3 h-3" />
                <span>एडमिन</span>
              </Link>
            )}
          </nav>


          {/* ==================== RIGHT ACTIONS ==================== */}
          <div className="flex items-center gap-1.5 shrink-0">

            {/* Voice Assistant */}
            <button
              onClick={() => setVoiceModalOpen(true)}
              className="bg-gradient-to-r from-kisan-amber to-kisan-gold hover:from-kisan-gold hover:to-amber-400 text-gray-950 font-black px-2.5 py-1.5 rounded-full flex items-center gap-1 text-[11px] shadow-md transition active:scale-95 whitespace-nowrap"
              title="बोलकर पूछें (Voice Assistant)"
            >
              <Mic className="w-4 h-4 text-gray-950 animate-pulse" />
              <span className="hidden sm:inline">बोलें</span>
            </button>


            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-full bg-krishi-900/60 dark:bg-darkbg-card hover:bg-krishi-700 text-krishi-100 hover:text-white transition border border-krishi-600/40 dark:border-darkbg-border active:scale-95 shrink-0"
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
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-full bg-krishi-900/60 dark:bg-darkbg-card hover:bg-krishi-700 text-krishi-100 hover:text-white transition border border-krishi-600/40 dark:border-darkbg-border flex items-center gap-1 text-[11px] font-bold active:scale-95 whitespace-nowrap"
              title="भाषा बदलें (Switch Language)"
            >
              <Globe className="w-3.5 h-3.5 text-kisan-gold" />

              <span className="font-mono">
                {lang === 'hi' ? 'ENG' : 'हिंदी'}
              </span>
            </button>


            {/* ==================== AUTHENTICATED USER ==================== */}
            {isAuthenticated ? (
              <div className="flex items-center gap-1.5 pl-1">

                {/* Avatar */}
                <img
                  src="/assets/images/farmer/farmer-avatar.png"
                  alt={user?.name || 'Farmer'}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-krishi-400/40 shadow-xs shrink-0"
                />

                {/* User Name */}
                <div className="hidden lg:flex flex-col text-right">
                  <span className="text-[11px] font-extrabold leading-none text-white truncate max-w-[80px]">
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

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="p-1.5 sm:p-2 rounded-full bg-rose-900/40 hover:bg-rose-600 text-rose-200 hover:text-white transition border border-rose-700/50 active:scale-95"
                  title={t('logout')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              /* Login Button */
              <Link
                to="/login"
                className="bg-white hover:bg-krishi-100 text-krishi-800 text-[11px] font-extrabold px-3.5 py-1.5 rounded-full transition shadow-sm whitespace-nowrap"
              >
                {t('login')}
              </Link>
            )}
          </div>
        </div>
      </header>


      {/* ==================== VOICE ASSISTANT MODAL ==================== */}
      <VoiceAssistantModal
        isOpen={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
      />
    </>
  );
}
