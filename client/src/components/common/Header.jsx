import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  Bell,
  ChevronDown,
  Globe2,
  LogOut,
  Menu,
  Mic,
  Moon,
  Sun,
  UserRound,
  Wheat,
  X,
} from 'lucide-react';

import VoiceButton from './VoiceButton';

const Header = ({
  user,
  language = 'hi',
  setLanguage,
  darkMode,
  setDarkMode,
  onLogout,
}) => {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const isFarmer = user?.role === 'farmer';
  const isBuyer = user?.role === 'buyer';
  const isFpo = user?.role === 'fpo';
  const isAdmin = user?.role === 'admin';

  const navItems = [
    {
      label: language === 'hi' ? 'बाज़ार' : 'Market',
      path: '/market',
      show: true,
    },
    {
      label: language === 'hi' ? 'बेचें' : 'Sell',
      path: '/sell',
      show: isFarmer || !user,
    },
    {
      label: language === 'hi' ? 'मेरी फसल' : 'My Lots',
      path: '/my-lots',
      show: isFarmer,
    },
    {
      label: language === 'hi' ? 'ऑर्डर' : 'Orders',
      path: '/orders',
      show: !!user,
    },
    {
      label: language === 'hi' ? 'खरीदार पैनल' : 'Buyer Panel',
      path: '/buyer',
      show: isBuyer,
    },
    {
      label: language === 'hi' ? 'FPO पोर्टल' : 'FPO Portal',
      path: '/fpo',
      show: isFpo,
    },
    {
      label: language === 'hi' ? 'एडमिन' : 'Admin',
      path: '/admin',
      show: isAdmin,
    },
  ];

  const visibleNavItems = navItems.filter((item) => item.show);

  const handleLogout = () => {
    setProfileOpen(false);
    setMobileOpen(false);
    onLogout?.();
  };

  const toggleLanguage = () => {
    setLanguage?.(language === 'hi' ? 'en' : 'hi');
  };

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-emerald-900/10 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-[#111914]/95">
        <div className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

          {/* Logo */}
          <Link
            to="/"
            onClick={() => setMobileOpen(false)}
            className="group flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-700 text-white shadow-sm transition-transform duration-200 group-hover:scale-105">
              <Wheat size={22} strokeWidth={2} />
            </div>

            <div className="leading-none">
              <div className="text-[17px] font-extrabold tracking-tight text-emerald-900 dark:text-emerald-100">
                Krishi<span className="text-amber-600">Link</span>
              </div>
              <div className="mt-1 text-[10px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {language === 'hi'
                  ? 'किसान से बाज़ार तक'
                  : 'Farm to Market'}
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            {visibleNavItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  [
                    'rounded-xl px-3.5 py-2 text-sm font-semibold transition-all duration-200',
                    isActive
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-emerald-700 dark:text-slate-300 dark:hover:bg-white/5 dark:hover:text-emerald-300',
                  ].join(' ')
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop actions */}
          <div className="hidden items-center gap-2 lg:flex">

            {/* Voice */}
            <button
              onClick={() => setVoiceOpen(true)}
              title={language === 'hi' ? 'बोलकर पूछें' : 'Ask by voice'}
              className="flex h-10 items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3 text-emerald-800 transition hover:border-emerald-200 hover:bg-emerald-100 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-300"
            >
              <Mic size={17} />
              <span className="text-xs font-bold">
                {language === 'hi' ? 'बोलकर पूछें' : 'Ask'}
              </span>
            </button>

            {/* Language */}
            <button
              onClick={toggleLanguage}
              className="flex h-10 items-center gap-1.5 rounded-xl px-3 text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
              title="Change language"
            >
              <Globe2 size={17} />
              <span className="text-xs font-bold">
                {language === 'hi' ? 'हिंदी' : 'EN'}
              </span>
            </button>

            {/* Theme */}
            <button
              onClick={() => setDarkMode?.(!darkMode)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/5"
              title="Toggle theme"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* User */}
            {user && (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2 transition hover:border-emerald-200 hover:bg-emerald-50 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300">
                    <UserRound size={16} />
                  </div>

                  <div className="hidden xl:block text-left">
                    <p className="max-w-[100px] truncate text-xs font-bold text-slate-800 dark:text-slate-100">
                      {user.name || user.full_name || 'User'}
                    </p>
                    <p className="text-[10px] capitalize text-slate-500">
                      {user.role}
                    </p>
                  </div>

                  <ChevronDown
                    size={15}
                    className={`text-slate-400 transition-transform ${
                      profileOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 top-12 w-56 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-xl dark:border-white/10 dark:bg-[#17201a]">

                    <button
                      onClick={() => {
                        setProfileOpen(false);
                        navigate('/profile');
                      }}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-emerald-50 hover:text-emerald-700 dark:text-slate-200 dark:hover:bg-white/5"
                    >
                      <UserRound size={17} />
                      {language === 'hi' ? 'प्रोफ़ाइल' : 'Profile'}
                    </button>

                    <div className="my-1 border-t border-slate-100 dark:border-white/10" />

                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <LogOut size={17} />
                      {language === 'hi' ? 'लॉग आउट' : 'Logout'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Mobile actions */}
          <div className="flex items-center gap-1 lg:hidden">

            <button
              onClick={() => setVoiceOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
            >
              <Mic size={19} />
            </button>

            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="flex h-10 w-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/5"
            >
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="border-t border-slate-100 bg-white px-4 pb-4 pt-2 shadow-lg dark:border-white/10 dark:bg-[#111914] lg:hidden">

            <nav className="space-y-1">
              {visibleNavItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    [
                      'flex items-center rounded-xl px-4 py-3 text-sm font-semibold',
                      isActive
                        ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-white/5',
                    ].join(' ')
                  }
                >
                  {item.label}
                </NavLink>
              ))}
            </nav>

            <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3 dark:border-white/10">

              <button
                onClick={toggleLanguage}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm font-semibold text-slate-700 dark:bg-white/5 dark:text-slate-200"
              >
                <Globe2 size={17} />
                {language === 'hi' ? 'English' : 'हिंदी'}
              </button>

              <button
                onClick={() => setDarkMode?.(!darkMode)}
                className="flex items-center justify-center gap-2 rounded-xl bg-slate-50 py-3 text-sm font-semibold text-slate-700 dark:bg-white/5 dark:text-slate-200"
              >
                {darkMode ? <Sun size={17} /> : <Moon size={17} />}
                {darkMode ? 'Light' : 'Dark'}
              </button>
            </div>

            {user && (
              <button
                onClick={handleLogout}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-red-50 py-3 text-sm font-semibold text-red-600 dark:bg-red-950/30"
              >
                <LogOut size={17} />
                {language === 'hi' ? 'लॉग आउट' : 'Logout'}
              </button>
            )}
          </div>
        )}
      </header>

      {/* Voice modal */}
      {voiceOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/40 p-3 backdrop-blur-sm sm:items-center"
          onClick={() => setVoiceOpen(false)}
        >
          <div
            className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-2xl dark:bg-[#17201a]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white">
                  {language === 'hi'
                    ? 'बोलकर पूछें'
                    : 'Ask KrishiLink'}
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  {language === 'hi'
                    ? 'अपनी फसल या बाज़ार के बारे में पूछें'
                    : 'Ask about crops, prices or markets'}
                </p>
              </div>

              <button
                onClick={() => setVoiceOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-500 dark:bg-white/5"
              >
                <X size={18} />
              </button>
            </div>

            <VoiceButton />
          </div>
        </div>
      )}
    </>
  );
};

export default Header;
