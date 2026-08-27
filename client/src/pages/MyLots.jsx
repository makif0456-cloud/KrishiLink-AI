import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { TradingService } from '../services/tradingService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { PlusCircle, ArrowRight, Package, Calendar, Award, MapPin } from 'lucide-react';

export default function MyLots() {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [lots, setLots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadLots() {
      try {
        const myLots = await TradingService.getMyLots();
        setLots(myLots || []);
      } catch (err) {
        console.error('Failed to load my lots', err);
      } finally {
        setLoading(false);
      }
    }
    loadLots();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto py-2 sm:py-4">
      {/* Header */}
      <div className="bg-white dark:bg-darkbg-surface p-4 sm:p-5 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm flex items-center justify-between transition-colors">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-gray-950 dark:text-white flex items-center gap-2">
            <span>📦</span> {t('my_lots')} ({lots.length})
          </h2>
          <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">
            आपके द्वारा दर्ज की गई फसलों की सूची और उन पर प्राप्त प्रस्ताव
          </p>
        </div>

        <Link
          to="/sell"
          className="bg-krishi-600 hover:bg-krishi-700 active:scale-95 text-white font-black px-4 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center space-x-1.5 shadow-md touch-btn shrink-0 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>+ नई फसल जोड़ें</span>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : lots.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {lots.map(lot => {
            const isSold = lot.status === 'sold';
            const hasOffers = (lot.offers_count || 0) > 0;

            return (
              <div
                key={lot.id}
                onClick={() => navigate(`/my-lots/${lot.id}`)}
                className="bg-white dark:bg-darkbg-surface p-4 sm:p-5 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm hover:shadow-md transition cursor-pointer space-y-3 relative farmer-card"
              >
                {/* Status Badge */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-3xl filter drop-shadow-xs">{lot.commodity_icon || '🌾'}</span>
                    <div>
                      <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">
                        {lang === 'hi' ? lot.commodity_name_hi : lot.commodity_name_en}
                      </h3>
                      <span className="text-xs text-gray-500 dark:text-darkbg-muted font-semibold">
                        Grade {lot.quality_grade} • {lot.quantity} {lot.unit || 'क्विंटल'}
                      </span>
                    </div>
                  </div>

                  <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                    isSold ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800' :
                    hasOffers ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                    'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                  }`}>
                    {isSold ? 'बिक गई (Sold)' : hasOffers ? `प्रस्ताव मिले (${lot.offers_count})` : 'सक्रिय (Active)'}
                  </span>
                </div>

                {/* Details Bar */}
                <div className="pt-2 border-t border-gray-100 dark:border-darkbg-border flex items-center justify-between text-xs text-gray-600 dark:text-darkbg-muted">
                  <div>
                    <span className="text-gray-400 dark:text-darkbg-muted block text-[10px] font-bold">अपेक्षित भाव</span>
                    <span className="font-black text-gray-900 dark:text-white">₹{lot.expected_price || 2500}/क्विंटल</span>
                  </div>

                  <div className="text-right">
                    <span className="text-gray-400 dark:text-darkbg-muted block text-[10px] font-bold">दर्ज दिनांक</span>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                      {new Date(lot.created_at).toLocaleDateString('hi-IN')}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Hint */}
                <div className="flex items-center justify-between text-xs font-bold text-krishi-700 dark:text-kisan-gold pt-1">
                  <span>खरीदार व प्रस्ताव देखें</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-darkbg-surface p-10 rounded-3xl border border-gray-200 dark:border-darkbg-border text-center space-y-3 transition-colors">
          <span className="text-4xl">🌾</span>
          <h3 className="text-base font-black text-gray-900 dark:text-white">आपके पास कोई सक्रिय फसल नहीं है</h3>
          <p className="text-xs text-gray-500 dark:text-darkbg-muted max-w-sm mx-auto">
            अपनी फसल बेचने के लिए नया लॉट दर्ज करें और सीधे सत्यापित खरीदारों से प्रस्ताव प्राप्त करें।
          </p>
          <Link
            to="/sell"
            className="inline-flex items-center space-x-1.5 bg-krishi-600 hover:bg-krishi-700 text-white font-black px-5 py-3 rounded-2xl text-xs sm:text-sm shadow-md touch-btn transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ फसल बेचने के लिए जोड़ें</span>
          </Link>
        </div>
      )}
    </div>
  );
}
