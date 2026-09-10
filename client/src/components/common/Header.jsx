import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Globe, LogOut, User as UserIcon, Mic, ShieldCheck, Landmark, Sun, Moon, Sparkles } from 'lucide-react';
import VoiceAssistantModal from './VoiceAssistantModal';

export default function Header() {
  const { lang, toggleLanguage, t } = useLanguage();
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
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
        <div className="max-w-5xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between">
          {/* Brand Logo & Name */}
          <Link to="/" className="flex items-center space-x-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-krishi-500 to-krishi-700 p-1.5 shadow-md flex items-center justify-center border border-krishi-400/30 group-hover:scale-105 transition">
              <span className="text-xl">🌾</span>
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black leading-tight tracking-tight flex items-center gap-1.5 font-sans">
                <span className="bg-gradient-to-r from-white via-krishi-100 to-kisan-gold bg-clip-text text-transparent">
                  {t('app_name')}
                </span>
              </h1>
              <p className="text-[10px] text-krishi-200 dark:text-darkbg-muted hidden xs:block font-medium">
                {t('app_tagline')}
              </p>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1 text-xs font-bold">
            <Link
              to="/market"
              className={`px-3 py-1.5 rounded-xl transition ${
                location.pathname === '/market'
                  ? 'bg-krishi-700 dark:bg-darkbg-card text-kisan-gold shadow-sm'
                  : 'hover:bg-krishi-700/50 text-krishi-100 hover:text-white'
              }`}
            >
              📊 {t('prices')}
            </Link>
            <Link
              to="/sell"
              className={`px-3 py-1.5 rounded-xl transition ${
                location.pathname === '/sell'
                  ? 'bg-krishi-700 dark:bg-darkbg-card text-kisan-gold shadow-sm'
                  : 'hover:bg-krishi-700/50 text-krishi-100 hover:text-white'
              }`}
            >
              🌾 {t('sell')}
            </Link>
            <Link
              to="/my-lots"
              className={`px-3 py-1.5 rounded-xl transition ${
                location.pathname.startsWith('/my-lots')
                  ? 'bg-krishi-700 dark:bg-darkbg-card text-kisan-gold shadow-sm'
                  : 'hover:bg-krishi-700/50 text-krishi-100 hover:text-white'
              }`}
            >
              📦 {t('my_lots')}
            </Link>
            <Link
              to="/orders"
              className={`px-3 py-1.5 rounded-xl transition ${
                location.pathname === '/orders'
                  ? 'bg-krishi-700 dark:bg-darkbg-card text-kisan-gold shadow-sm'
                  : 'hover:bg-krishi-700/50 text-krishi-100 hover:text-white'
              }`}
            >
              🚚 {t('orders')}
            </Link>
            <Link
              to="/buyer"
              className={`px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-gray-950 transition font-black flex items-center gap-1 shadow-sm ${
                location.pathname === '/buyer' ? 'ring-2 ring-white' : ''
              }`}
            >
              <span>💼</span>
              <span>{t('buyer_panel')}</span>
            </Link>

            {/* FPO Portal Link */}
            {isFpo && (
              <Link
                to="/fpo"
                className={`px-2.5 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white transition font-black flex items-center gap-1 shadow-sm ${
                  location.pathname === '/fpo' ? 'ring-2 ring-white' : ''
                }`}
              >
                <Landmark className="w-3.5 h-3.5" />
                <span>एफपीओ</span>
              </Link>
            )}

            {/* Admin Portal Link */}
            {isAdmin && (
              <Link
                to="/admin"
                className={`px-2.5 py-1.5 rounded-xl bg-rose-700 hover:bg-rose-800 text-white transition font-black flex items-center gap-1 shadow-sm ${
                  location.pathname === '/admin' ? 'ring-2 ring-white' : ''
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>एडमिन</span>
              </Link>
            )}
          </nav>

          {/* Right Action Tools: Voice + Theme + Lang + User */}
          <div className="flex items-center space-x-2">
            {/* 🎙️ Voice Assistant Button */}
            <button
              onClick={() => setVoiceModalOpen(true)}
              className="bg-gradient-to-r from-kisan-amber to-kisan-gold hover:from-kisan-gold hover:to-amber-400 text-gray-950 font-black px-2.5 sm:px-3 py-1.5 rounded-xl flex items-center space-x-1 text-xs shadow-md transition active:scale-95"
              title="बोलकर पूछें (Voice Assistant)"
            >
              <Mic className="w-4 h-4 text-gray-950 animate-pulse" />
              <span className="hidden sm:inline">बोलें</span>
            </button>

            {/* 🌙 / ☀️ Dark/Light Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-krishi-900/60 dark:bg-darkbg-card hover:bg-krishi-700 text-krishi-100 hover:text-white transition border border-krishi-600/40 dark:border-darkbg-border active:scale-95"
              title={isDark ? 'Light Mode (दिन का मोड)' : 'Dark Mode (रात का मोड)'}
              aria-label="Theme Toggle"
            >
              {isDark ? (
                <Sun className="w-4 h-4 text-kisan-gold" />
              ) : (
                <Moon className="w-4 h-4 text-krishi-200" />
              )}
            </button>

            {/* 🌐 Hindi / English Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-krishi-900/60 dark:bg-darkbg-card hover:bg-krishi-700 text-krishi-100 hover:text-white transition border border-krishi-600/40 dark:border-darkbg-border flex items-center space-x-1 text-xs font-bold active:scale-95"
              title="भाषा बदलें (Switch Language)"
            >
              <Globe className="w-3.5 h-3.5 text-kisan-gold" />
              <span className="font-mono">{lang === 'hi' ? 'ENG' : 'हिंदी'}</span>
            </button>

            {/* User Profile / Logout */}
            {isAuthenticated ? (
              <div className="flex items-center space-x-1.5 pl-1">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-[11px] font-extrabold leading-none text-white truncate max-w-[90px]">
                    {user?.name?.split(' ')[0] || 'User'}
                  </span>
                  <span className="text-[9px] text-kisan-gold capitalize font-semibold leading-none mt-0.5">
                    {user?.role === 'farmer' ? '🌾 किसान' : user?.role === 'buyer' ? '💼 खरीदार' : user?.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-1.5 sm:p-2 rounded-xl bg-rose-900/40 hover:bg-rose-600 text-rose-200 hover:text-white transition border border-rose-700/50 active:scale-95"
                  title={t('logout')}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="bg-white hover:bg-krishi-100 text-krishi-800 text-xs font-extrabold px-3 py-1.5 rounded-xl transition shadow-sm"
              >
                {t('login')}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Voice Assistant Modal */}
      <VoiceAssistantModal isOpen={voiceModalOpen} onClose={() => setVoiceModalOpen(false)} />
    </>
  );
}
