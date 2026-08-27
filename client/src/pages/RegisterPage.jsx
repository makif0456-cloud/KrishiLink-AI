import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Phone, User, Lock, MapPin, Building, ArrowRight } from 'lucide-react';

export default function RegisterPage() {
  const { t, lang } = useLanguage();
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('farmer');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    password: 'Password@123',
    village: '',
    district: '',
    business_name: '',
    buyer_type: 'trader'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({ ...formData, role });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-3 py-6 sm:py-10 space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">
          {t('register')}
        </h2>
        <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium">
          {lang === 'hi' ? 'कृषि लिंक नेटवर्क से जुड़ें' : 'Join the KrishiLink agricultural network'}
        </p>
      </div>

      <div className="bg-white dark:bg-darkbg-surface p-5 sm:p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-md space-y-4 transition-colors">
        {/* Role Selector Tabs */}
        <div className="space-y-1">
          <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
            आप कौन हैं? / Select Role
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
            {[
              { id: 'farmer', label: '🌾 किसान' },
              { id: 'buyer', label: '💼 खरीदार' },
              { id: 'fpo', label: '👥 एफपीओ' },
              { id: 'admin', label: '⚙️ एडमिन' }
            ].map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRole(r.id)}
                className={`py-2 px-1 text-xs font-bold rounded-xl border transition ${
                  role === r.id
                    ? 'bg-krishi-600 border-krishi-700 text-white shadow-sm'
                    : 'bg-gray-50 dark:bg-darkbg-card border-gray-200 dark:border-darkbg-border text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkbg-hover'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 text-xs p-3 rounded-xl border border-red-200 dark:border-red-800 font-medium">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Full Name */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">{t('full_name')}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 dark:text-darkbg-muted">
                <User className="w-4 h-4" />
              </span>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="रामप्रसाद पटेल"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none transition"
              />
            </div>
          </div>

          {/* Phone */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">{t('phone_number')}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 dark:text-darkbg-muted">
                <Phone className="w-4 h-4" />
              </span>
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="9876543210"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none transition"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">{t('password')}</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 dark:text-darkbg-muted">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="कम से कम 6 अक्षर"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none transition"
              />
            </div>
          </div>

          {/* Village & District for Farmer */}
          {role === 'farmer' && (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">{t('village')}</label>
                <input
                  type="text"
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  placeholder="बैरसिया"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">{t('district')}</label>
                <input
                  type="text"
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  placeholder="भोपाल"
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none"
                />
              </div>
            </div>
          )}

          {/* Business Name for Buyer */}
          {role === 'buyer' && (
            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">फर्म / व्यापार का नाम</label>
              <input
                type="text"
                required
                value={formData.business_name}
                onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                placeholder="शर्मा एग्रो ट्रेडर्स"
                className="w-full px-3 py-2 bg-gray-50 dark:bg-darkbg-card border border-gray-200 dark:border-darkbg-border rounded-xl text-sm font-semibold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-krishi-600 hover:bg-krishi-700 active:bg-krishi-800 text-white font-black py-3 px-4 rounded-xl flex items-center justify-center space-x-2 text-sm shadow-md transition touch-btn disabled:opacity-60 mt-4"
          >
            <span>{loading ? 'पंजीकरण हो रहा है...' : 'खाता बनाएं (Register)'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center border-t border-gray-100 dark:border-darkbg-border">
          <p className="text-xs text-gray-600 dark:text-darkbg-muted">
            पहले से पंजीकृत हैं?{' '}
            <Link to="/login" className="font-bold text-krishi-700 dark:text-kisan-gold hover:underline">
              {t('login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
