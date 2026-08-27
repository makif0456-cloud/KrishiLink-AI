import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Phone, Lock, ArrowRight, ShieldCheck, KeyRound, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const { t, lang } = useLanguage();
  const { login, verifyOtp, demoLoginAs } = useAuth();
  const navigate = useNavigate();

  const [loginMode, setLoginMode] = useState('password'); // 'password' or 'otp'
  const [phone, setPhone] = useState('9876543210');
  const [password, setPassword] = useState('Password@123');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (loginMode === 'password') {
        await login(phone, password);
        navigate('/');
      } else {
        if (!otpSent) {
          setOtpSent(true);
          setOtp('123456'); // auto-fill demo OTP for tester convenience
        } else {
          await verifyOtp(phone, otp);
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSwitch = async (role) => {
    setError(null);
    setLoading(true);
    try {
      await demoLoginAs(role);
      if (role === 'buyer') {
        navigate('/buyer');
      } else if (role === 'fpo') {
        navigate('/fpo');
      } else if (role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-3 py-6 sm:py-10 space-y-6">
      {/* Top Header Card */}
      <div className="text-center space-y-1">
        <div className="w-16 h-16 rounded-2xl bg-krishi-100 dark:bg-darkbg-card border border-krishi-300 dark:border-darkbg-border flex items-center justify-center text-3xl shadow-sm mx-auto mb-2">
          👨‍🌾
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">
          {t('login')}
        </h2>
        <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium">
          {lang === 'hi' ? 'अपने मोबाइल नंबर से सुरक्षित प्रवेश करें' : 'Sign in securely with your mobile number'}
        </p>
      </div>

      {/* 🌟 1-Click Quick Demo Login Switcher (Crucial for SIH evaluators) */}
      <div className="bg-gradient-to-br from-amber-50 to-amber-100/70 dark:from-darkbg-card dark:to-darkbg-surface border border-amber-300 dark:border-amber-700/60 rounded-3xl p-4 space-y-2.5 shadow-sm transition-colors">
        <div className="flex items-center space-x-1.5 text-xs font-black text-amber-900 dark:text-kisan-gold">
          <Sparkles className="w-4 h-4 text-amber-600 dark:text-kisan-gold" />
          <span>{t('quick_demo_login')}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleDemoSwitch('farmer')}
            className="bg-white dark:bg-darkbg-card hover:bg-amber-50 dark:hover:bg-darkbg-hover text-gray-900 dark:text-gray-100 font-bold px-2.5 py-2 rounded-xl text-xs border border-amber-200 dark:border-darkbg-border shadow-xs transition touch-btn text-left"
          >
            {t('farmer_demo_btn')}
          </button>
          <button
            type="button"
            onClick={() => handleDemoSwitch('buyer')}
            className="bg-white dark:bg-darkbg-card hover:bg-amber-50 dark:hover:bg-darkbg-hover text-gray-900 dark:text-gray-100 font-bold px-2.5 py-2 rounded-xl text-xs border border-amber-200 dark:border-darkbg-border shadow-xs transition touch-btn text-left"
          >
            {t('buyer_demo_btn')}
          </button>
          <button
            type="button"
            onClick={() => handleDemoSwitch('fpo')}
            className="bg-white dark:bg-darkbg-card hover:bg-amber-50 dark:hover:bg-darkbg-hover text-gray-900 dark:text-gray-100 font-bold px-2.5 py-2 rounded-xl text-xs border border-amber-200 dark:border-darkbg-border shadow-xs transition touch-btn text-left"
          >
            {t('fpo_demo_btn')}
          </button>
          <button
            type="button"
            onClick={() => handleDemoSwitch('admin')}
            className="bg-white dark:bg-darkbg-card hover:bg-amber-50 dark:hover:bg-darkbg-hover text-gray-900 dark:text-gray-100 font-bold px-2.5 py-2 rounded-xl text-xs border border-amber-200 dark:border-darkbg-border shadow-xs transition touch-btn text-left"
          >
            {t('admin_demo_btn')}
          </button>
        </div>
      </div>

      {/* Main Login Form Box */}
      <div className="bg-white dark:bg-darkbg-surface p-5 sm:p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-md space-y-4 transition-colors">
        {/* Toggle Login Method */}
        <div className="flex border border-gray-200 dark:border-darkbg-border rounded-xl p-1 bg-gray-50 dark:bg-darkbg-card">
          <button
            type="button"
            onClick={() => { setLoginMode('password'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              loginMode === 'password' ? 'bg-white dark:bg-krishi-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-darkbg-muted'
            }`}
          >
            पासवर्ड से लॉगिन
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('otp'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${
              loginMode === 'otp' ? 'bg-white dark:bg-krishi-700 shadow text-gray-900 dark:text-white' : 'text-gray-500 dark:text-darkbg-muted'
            }`}
          >
            ओटीपी (OTP) से लॉगिन
          </button>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs p-3 rounded-xl border border-red-200 dark:border-red-800 font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Phone Number Input */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
              {t('phone_number')}
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 dark:text-darkbg-muted">
                <Phone className="w-5 h-5" />
              </span>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder={t('phone_placeholder')}
                className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl text-base font-semibold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none transition"
              />
            </div>
          </div>

          {/* Password Input or OTP */}
          {loginMode === 'password' ? (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                {t('password')}
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 dark:text-darkbg-muted">
                  <Lock className="w-5 h-5" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('password_placeholder')}
                  className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl text-base font-semibold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none transition"
                />
              </div>
            </div>
          ) : (
            otpSent && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                  {t('enter_otp')}
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 dark:text-darkbg-muted">
                    <KeyRound className="w-5 h-5" />
                  </span>
                  <input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50 dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl text-base font-semibold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none transition"
                  />
                </div>
                <p className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold mt-1">
                  ✓ डेमो ओटीपी: 123456
                </p>
              </div>
            )
          )}

          {/* Action Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-krishi-600 hover:bg-krishi-700 active:bg-krishi-800 text-white font-black py-3.5 px-4 rounded-xl flex items-center justify-center space-x-2 text-base shadow-md transition touch-btn disabled:opacity-60"
          >
            <span>
              {loading
                ? 'कृपया प्रतीक्षा करें...'
                : loginMode === 'otp' && !otpSent
                ? 'ओटीपी प्राप्त करें'
                : t('login')}
            </span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="pt-2 text-center border-t border-gray-100 dark:border-darkbg-border">
          <p className="text-xs text-gray-600 dark:text-darkbg-muted">
            खाता नहीं है?{' '}
            <Link to="/register" className="font-bold text-krishi-700 dark:text-kisan-gold hover:underline">
              {t('register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
