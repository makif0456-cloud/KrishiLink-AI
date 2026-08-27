import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { TradingService } from '../services/tradingService';
import OrderTracker from '../components/common/OrderTracker';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ArrowLeft, CheckCircle2, Clock, Truck, PackageCheck, CreditCard, ShieldCheck, MapPin, Phone, Calendar } from 'lucide-react';

export default function OrderDetail() {
  const { id } = useParams();
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrderDetail = async () => {
    try {
      setError(null);
      const [orderData, paymentList] = await Promise.all([
        TradingService.getOrderDetail(id),
        TradingService.getOrderPayments(id).catch(() => [])
      ]);
      setOrder(orderData);
      setPayments(paymentList || []);
    } catch (err) {
      console.error('Failed to load order detail', err);
      setError(err.response?.data?.message || err.message || 'ऑर्डर विवरण लोड करने में असमर्थ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadOrderDetail();
    }
  }, [id]);

  if (loading) {
    return <LoadingSpinner message="ऑर्डर विवरण लोड हो रहा है..." />;
  }

  if (error || !order) {
    return (
      <div className="max-w-3xl mx-auto py-10 text-center space-y-4">
        <div className="bg-white dark:bg-darkbg-surface p-8 rounded-3xl border border-red-200 dark:border-red-800 shadow-sm space-y-3 transition-colors">
          <span className="text-4xl">⚠️</span>
          <h3 className="text-base font-bold text-red-700 dark:text-red-300">{error || 'ऑर्डर नहीं मिला'}</h3>
          <p className="text-xs text-gray-500 dark:text-darkbg-muted">
            यह ऑर्डर मौजूद नहीं है या आपको इसे देखने की अनुमति नहीं है।
          </p>
          <div className="pt-2">
            <Link
              to="/orders"
              className="inline-flex items-center space-x-1 px-4 py-2 bg-krishi-600 hover:bg-krishi-700 text-white font-bold rounded-xl text-xs touch-btn shadow"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>मेरे सभी ऑर्डर देखें</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-2 sm:py-4 space-y-5">
      {/* Top Back Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center space-x-1.5 text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 hover:text-krishi-700 dark:hover:text-kisan-gold touch-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>सभी ऑर्डर पर वापस जाएं</span>
        </button>

        <span className="text-xs font-mono font-bold bg-white dark:bg-darkbg-surface px-3 py-1 rounded-full border border-gray-200 dark:border-darkbg-border shadow-xs text-gray-600 dark:text-darkbg-muted">
          ID: {order.id ? order.id.slice(0, 8) : '—'}
        </span>
      </div>

      {/* 🚀 Primary Live Order Tracker Component */}
      <OrderTracker order={order} onOrderUpdated={loadOrderDetail} />

      {/* Detailed Order Specifications Card */}
      <div className="bg-white dark:bg-darkbg-surface p-5 sm:p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm space-y-4 transition-colors">
        <h4 className="text-sm font-black text-gray-900 dark:text-white border-b border-gray-100 dark:border-darkbg-border pb-2.5">
          सौदा व फसल विनिर्देश (Trade Specifications)
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="bg-gray-50 dark:bg-darkbg-card p-3 rounded-2xl border border-gray-100 dark:border-darkbg-border">
            <span className="text-gray-400 dark:text-darkbg-muted block text-[10px] font-bold">फसल व श्रेणी</span>
            <span className="font-black text-gray-900 dark:text-white">
              {lang === 'hi' ? order.commodity_name_hi : order.commodity_name_en} (Grade {order.lot_grade || 'A'})
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-darkbg-card p-3 rounded-2xl border border-gray-100 dark:border-darkbg-border">
            <span className="text-gray-400 dark:text-darkbg-muted block text-[10px] font-bold">कुल मात्रा</span>
            <span className="font-black text-gray-900 dark:text-white">
              {order.quantity} {order.lot_unit || 'क्विंटल'}
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-darkbg-card p-3 rounded-2xl border border-gray-100 dark:border-darkbg-border">
            <span className="text-gray-400 dark:text-darkbg-muted block text-[10px] font-bold">सहमति भाव</span>
            <span className="font-black text-krishi-700 dark:text-kisan-gold">
              ₹{order.agreed_price}/क्विंटल
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-darkbg-card p-3 rounded-2xl border border-gray-100 dark:border-darkbg-border">
            <span className="text-gray-400 dark:text-darkbg-muted block text-[10px] font-bold">कुल देय राशि</span>
            <span className="font-black text-gray-950 dark:text-white">
              ₹{Number(order.total_amount || 0).toLocaleString('en-IN')}
            </span>
          </div>
        </div>

        {/* Payment Records Section */}
        {payments && payments.length > 0 && (
          <div className="pt-3 border-t border-gray-100 dark:border-darkbg-border space-y-2">
            <h5 className="text-xs font-bold text-gray-800 dark:text-gray-200 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-krishi-600 dark:text-kisan-gold" />
              <span>भुगतान रिकॉर्ड (Payment Settlements)</span>
            </h5>
            <div className="space-y-1.5">
              {payments.map(p => (
                <div key={p.id} className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="font-black text-emerald-950 dark:text-emerald-200">
                      ₹{Number(p.amount).toLocaleString('en-IN')} ({p.payment_method ? p.payment_method.toUpperCase() : 'UPI'})
                    </span>
                    <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block">
                      स्थिति: {p.status === 'completed' ? 'सफल (Completed)' : p.status} • {new Date(p.created_at || Date.now()).toLocaleDateString('hi-IN')}
                    </span>
                  </div>
                  <span className="bg-emerald-200 dark:bg-emerald-900/80 text-emerald-900 dark:text-emerald-200 font-black px-2.5 py-0.5 rounded-md text-[10px]">
                    सत्यापित ✅
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
