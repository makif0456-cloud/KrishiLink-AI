import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { TradingService } from '../services/tradingService';
import MatchingBuyersList from '../components/farmer/MatchingBuyersList';
import OfferComparisonView from '../components/farmer/OfferComparisonView';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ArrowLeft, ArrowRight, MapPin, Scale, Award, Calendar, CheckCircle2, ShieldAlert, Sparkles } from 'lucide-react';

export default function LotDetail() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  const [lot, setLot] = useState(null);
  const [matchingBuyers, setMatchingBuyers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [activeTab, setActiveTab] = useState('offers'); // 'offers' or 'buyers'
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [lotData, buyersList, offersList] = await Promise.all([
        TradingService.getLotDetail(id),
        TradingService.getMatchingBuyers(id),
        TradingService.getOffersForLot(id)
      ]);
      setLot(lotData);
      setMatchingBuyers(buyersList || []);
      setOffers(offersList || []);
      if (offersList && offersList.length > 0) {
        setActiveTab('offers');
      } else {
        setActiveTab('buyers');
      }
    } catch (err) {
      console.error('Failed to load lot detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="फसल और खरीदार विवरण लोड हो रहा है..." />;
  }

  if (!lot) {
    return (
      <div className="text-center py-12 space-y-3 bg-white dark:bg-darkbg-surface p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border">
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">फसल विवरण नहीं मिला</h3>
        <Link to="/my-lots" className="text-krishi-700 dark:text-kisan-gold font-bold underline text-sm">
          मेरी फसलें पर लौटें
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-2 sm:py-4 space-y-4 sm:space-y-6">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/my-lots')}
          className="flex items-center space-x-1.5 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-krishi-700 dark:hover:text-kisan-gold touch-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('my_lots')} पर वापस जाएं</span>
        </button>

        <span className={`text-xs font-black uppercase px-3 py-1 rounded-full ${
          lot.status === 'sold' ? 'bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-300 dark:border-purple-800' :
          offers.length > 0 ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
          'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
        }`}>
          स्थिति: {lot.status === 'sold' ? 'बिक गई (Sold)' : 'सक्रिय (Active)'}
        </span>
      </div>

      {/* 🌾 Lot Summary Card */}
      <div className="bg-white dark:bg-darkbg-surface p-5 sm:p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-md space-y-4 transition-colors">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100 dark:border-darkbg-border">
          <div className="flex items-center space-x-3">
            <div className="w-14 h-14 rounded-2xl bg-krishi-50 dark:bg-darkbg-card border border-krishi-200 dark:border-darkbg-border flex items-center justify-center text-3xl shrink-0 shadow-inner">
              {lot.commodity_icon || '🌾'}
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-gray-950 dark:text-white leading-tight">
                {lang === 'hi' ? lot.commodity_name_hi : lot.commodity_name_en}
              </h2>
              <div className="flex items-center space-x-2 text-xs font-bold text-gray-500 dark:text-darkbg-muted mt-0.5">
                <span className="bg-krishi-100 dark:bg-krishi-900/60 text-krishi-800 dark:text-krishi-300 px-2 py-0.5 rounded-full border border-krishi-200 dark:border-krishi-800">
                  Grade {lot.quality_grade}
                </span>
                <span>•</span>
                <span>{lot.quantity} {lot.unit || 'क्विंटल'}</span>
              </div>
            </div>
          </div>

          <Link
            to={`/recommendations/${lot.id}`}
            className="px-4 py-2.5 bg-gradient-to-r from-kisan-amber to-kisan-gold hover:from-kisan-gold hover:to-amber-400 text-gray-950 font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow-md touch-btn shrink-0 active:scale-95 transition"
          >
            <Sparkles className="w-4 h-4" />
            <span>स्मार्ट सिफारिश देखें</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-gray-50 dark:bg-darkbg-card p-3 rounded-2xl border border-gray-100 dark:border-darkbg-border">
            <span className="text-[10px] text-gray-500 dark:text-darkbg-muted font-bold block">अपेक्षित भाव</span>
            <span className="text-base font-black text-gray-900 dark:text-white">₹{lot.expected_price || 2500}/q</span>
          </div>

          <div className="bg-gray-50 dark:bg-darkbg-card p-3 rounded-2xl border border-gray-100 dark:border-darkbg-border">
            <span className="text-[10px] text-gray-500 dark:text-darkbg-muted font-bold block">अनुमानित कुल मूल्य</span>
            <span className="text-base font-black text-krishi-700 dark:text-kisan-gold">
              ₹{Number((lot.quantity || 100) * (lot.expected_price || 2500)).toLocaleString('en-IN')}
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-darkbg-card p-3 rounded-2xl border border-gray-100 dark:border-darkbg-border">
            <span className="text-[10px] text-gray-500 dark:text-darkbg-muted font-bold block">स्थान</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white truncate block">
              {lot.village || 'बैरसिया'}, {lot.district || 'भोपाल'}
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-darkbg-card p-3 rounded-2xl border border-gray-100 dark:border-darkbg-border">
            <span className="text-[10px] text-gray-500 dark:text-darkbg-muted font-bold block">दर्ज दिनांक</span>
            <span className="text-sm font-bold text-gray-900 dark:text-white block">
              {new Date(lot.created_at).toLocaleDateString('hi-IN')}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs: Received Offers vs Matching Buyers */}
      <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-darkbg-border">
        <button
          type="button"
          onClick={() => setActiveTab('offers')}
          className={`pb-3 px-4 text-sm font-black border-b-2 transition touch-btn flex items-center space-x-2 ${
            activeTab === 'offers'
              ? 'border-krishi-600 dark:border-kisan-gold text-krishi-700 dark:text-kisan-gold'
              : 'border-transparent text-gray-500 dark:text-darkbg-muted hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <span>💼 प्राप्त प्रस्ताव (Received Offers)</span>
          <span className="bg-krishi-100 dark:bg-krishi-900/60 text-krishi-800 dark:text-krishi-300 text-xs px-2 py-0.5 rounded-full font-bold">
            {offers.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('buyers')}
          className={`pb-3 px-4 text-sm font-black border-b-2 transition touch-btn flex items-center space-x-2 ${
            activeTab === 'buyers'
              ? 'border-krishi-600 dark:border-kisan-gold text-krishi-700 dark:text-kisan-gold'
              : 'border-transparent text-gray-500 dark:text-darkbg-muted hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <span>🤝 सत्यापित खरीदार मिलान (Matches)</span>
          <span className="bg-gray-100 dark:bg-darkbg-card text-gray-700 dark:text-gray-300 text-xs px-2 py-0.5 rounded-full font-bold">
            {matchingBuyers.length}
          </span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'offers' ? (
        <OfferComparisonView offers={offers} onOfferUpdated={loadData} />
      ) : (
        <MatchingBuyersList matchingBuyers={matchingBuyers} />
      )}
    </div>
  );
}
