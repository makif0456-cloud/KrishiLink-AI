import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { TradingService } from '../../services/tradingService';
import { CheckCircle2, Clock, Truck, PackageCheck, CreditCard, ShieldCheck, MapPin, AlertCircle, ArrowRight, ExternalLink } from 'lucide-react';

export default function OrderTracker({ order, onOrderUpdated, showDetailLink = true }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(null);

  if (!order) {
    return (
      <div className="bg-white dark:bg-darkbg-surface p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border text-center text-xs text-gray-500 dark:text-darkbg-muted">
        ऑर्डर जानकारी उपलब्ध नहीं है (Order data unavailable)
      </div>
    );
  }

  const steps = [
    { key: 'confirmed', label: '1. पुष्टि (Confirmed)', icon: Clock },
    { key: 'dispatched', label: '2. रवाना (Dispatched)', icon: Truck },
    { key: 'delivered', label: '3. पहुँची (Delivered)', icon: PackageCheck },
    { key: 'completed', label: '4. भुगतान (Paid)', icon: CreditCard }
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case 'confirmed': return 0;
      case 'dispatched':
      case 'in_transit': return 1;
      case 'delivered': return 2;
      case 'completed': return 3;
      default: return 0;
    }
  };

  const status = order.status || 'confirmed';
  const currentStepIdx = getStepIndex(status);
  const isSpecialStatus = status === 'disputed' || status === 'cancelled';
  const isBuyer = user?.role === 'buyer' || user?.id === order.buyer_id;

  const handleAdvanceStatus = async (nextStatus) => {
    setLoading(true);
    setMsg(null);
    try {
      await TradingService.updateOrderStatus(order.id, nextStatus);
      setMsg({ type: 'success', text: `ऑर्डर स्थिति बदलकर '${nextStatus}' कर दी गई है।` });
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async () => {
    setLoading(true);
    setMsg(null);
    try {
      await TradingService.recordPayment({
        order_id: order.id,
        amount: Number(order.total_amount || 0),
        payment_type: 'full',
        payment_method: 'upi'
      });
      setMsg({ type: 'success', text: `₹${Number(order.total_amount || 0).toLocaleString('en-IN')} का भुगतान सफलतापूर्वक दर्ज हुआ!` });
      if (onOrderUpdated) onOrderUpdated();
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-darkbg-surface p-4 sm:p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm space-y-5 transition-colors">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 dark:border-darkbg-border gap-2">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{order.commodity_icon || '🌾'}</span>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight">
                  {lang === 'hi' ? (order.commodity_name_hi || 'फसल') : (order.commodity_name_en || 'Produce')} — {order.quantity || 100} {order.lot_unit || 'क्विंटल'}
                </h3>
                {showDetailLink && order.id && (
                  <Link
                    to={`/orders/${order.id}`}
                    className="text-krishi-600 dark:text-kisan-gold hover:text-krishi-700 p-1 rounded-md transition"
                    title="विस्तृत विवरण देखें"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">
                सौदा: <strong>{order.buyer_business_name || order.buyer_name || 'शर्मा ट्रेडर्स'}</strong> ↔ <strong>{order.farmer_name || 'किसान'}</strong>
              </p>
            </div>
          </div>
        </div>

        <div className="text-left sm:text-right">
          <span className="text-xs text-gray-500 dark:text-darkbg-muted font-bold block">कुल मूल्य</span>
          <span className="text-lg sm:text-xl font-black text-krishi-700 dark:text-kisan-gold">
            ₹{Number(order.total_amount || 0).toLocaleString('en-IN')}
          </span>
          <span className="text-[10px] text-gray-400 dark:text-darkbg-muted block">
            (@ ₹{order.agreed_price_per_quintal || 2500}/क्विंटल)
          </span>
        </div>
      </div>

      {msg && (
        <div className={`p-3 rounded-2xl text-xs font-bold flex items-center space-x-2 ${
          msg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-200 border border-red-300 dark:border-red-800'
        }`}>
          {msg.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
          <span>{msg.text}</span>
        </div>
      )}

      {/* 🚀 4-STEP LOGISTICS TRACKER PROGRESS BAR */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between text-xs font-black text-gray-700 dark:text-gray-200">
          <span>लॉजिस्टिक्स व भुगतान स्थिति (Live Tracking)</span>
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-mono ${
            status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
            status === 'delivered' ? 'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800' :
            status === 'dispatched' ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' :
            'bg-gray-100 dark:bg-darkbg-card text-gray-800 dark:text-gray-300'
          }`}>
            {status}
          </span>
        </div>

        {/* Stepper Line and Circles */}
        <div className="relative pt-2 pb-2">
          <div className="w-full bg-gray-200 dark:bg-darkbg-card h-2 rounded-full overflow-hidden">
            <div
              className="bg-gradient-to-r from-krishi-600 to-emerald-500 h-full transition-all duration-500 rounded-full"
              style={{ width: `${((currentStepIdx) / 3) * 100}%` }}
            ></div>
          </div>

          <div className="grid grid-cols-4 pt-3 text-center">
            {steps.map((st, idx) => {
              const isPastOrCurrent = idx <= currentStepIdx;
              const isCurrent = idx === currentStepIdx;
              const StepIcon = st.icon;

              return (
                <div key={st.key} className="flex flex-col items-center space-y-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                    isCurrent
                      ? 'bg-krishi-600 text-white ring-4 ring-krishi-100 dark:ring-krishi-900/60 shadow-md font-bold scale-110'
                      : isPastOrCurrent
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 dark:bg-darkbg-card text-gray-400 dark:text-darkbg-muted border border-gray-300 dark:border-darkbg-border'
                  }`}>
                    {isPastOrCurrent && idx < currentStepIdx ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      <StepIcon className="w-4 h-4" />
                    )}
                  </div>

                  <span className={`text-[10px] sm:text-[11px] leading-tight font-bold ${
                    isCurrent
                      ? 'text-krishi-700 dark:text-kisan-gold font-black'
                      : isPastOrCurrent
                      ? 'text-gray-900 dark:text-gray-200'
                      : 'text-gray-400 dark:text-darkbg-muted'
                  }`}>
                    {st.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Advance Logistics Lifecycle Action Controls */}
      <div className="pt-3 border-t border-gray-100 dark:border-darkbg-border flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs text-gray-500 dark:text-darkbg-muted font-bold">
          {status === 'confirmed' && 'अगला कदम: माल को वाहन में लोड कर रवाना करें'}
          {status === 'dispatched' && 'अगला कदम: माल गंतव्य पर पहुंचने की पुष्टि करें'}
          {status === 'delivered' && 'अगला कदम: माल सत्यापन के बाद पूर्ण भुगतान करें'}
          {status === 'completed' && '✓ यह ऑर्डर पूर्णतः डिलीवर व भुगतान हो चुका है'}
        </span>

        <div className="flex items-center space-x-2">
          {status === 'confirmed' && (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAdvanceStatus('dispatched')}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-gray-950 font-black rounded-xl text-xs flex items-center space-x-1.5 shadow touch-btn disabled:opacity-60 transition"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>रवाना मार्क करें (Dispatch)</span>
            </button>
          )}

          {status === 'dispatched' && (
            <button
              type="button"
              disabled={loading}
              onClick={() => handleAdvanceStatus('delivered')}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs flex items-center space-x-1.5 shadow touch-btn disabled:opacity-60 transition"
            >
              <PackageCheck className="w-3.5 h-3.5" />
              <span>पहुँच मार्क करें (Delivered)</span>
            </button>
          )}

          {status === 'delivered' && (
            <button
              type="button"
              disabled={loading}
              onClick={handleSimulatePayment}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center space-x-1.5 shadow touch-btn disabled:opacity-60 transition"
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>डिजिटल भुगतान करें (Pay Now)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
