import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { TradingService } from '../services/tradingService';
import OrderTracker from '../components/common/OrderTracker';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { PackageCheck, Clock, CheckCircle2, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

export default function OrdersPage() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const orderList = await TradingService.getOrders();
      setOrders(Array.isArray(orderList) ? orderList : []);
    } catch (err) {
      console.error('Failed to load orders', err);
      setError(err.response?.data?.message || err.message || 'ऑर्डर लोड करने में त्रुटि हुई');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto py-2 sm:py-4">
      {/* Header */}
      <div className="bg-white dark:bg-darkbg-surface p-4 sm:p-5 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm flex items-center justify-between transition-colors">
        <div>
          <h2 className="text-lg sm:text-xl font-black text-gray-950 dark:text-white flex items-center gap-2">
            <span>📋</span> {t('orders')} ({orders ? orders.length : 0})
          </h2>
          <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">
            स्वीकृत सौदों की डिलीवरी और भुगतान स्थिति की लाइव ट्रैकिंग
          </p>
        </div>
        <button
          type="button"
          onClick={loadOrders}
          disabled={loading}
          className="p-2 text-gray-600 dark:text-gray-300 hover:text-krishi-700 dark:hover:text-kisan-gold bg-gray-100 dark:bg-darkbg-card hover:bg-gray-200 dark:hover:bg-darkbg-hover rounded-xl transition touch-btn"
          title="रिफ्रेश करें (Refresh)"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <LoadingSpinner message="ऑर्डर लोड हो रहे हैं..." />
      ) : error ? (
        <div className="bg-white dark:bg-darkbg-surface p-8 rounded-3xl border border-red-200 dark:border-red-800 text-center space-y-3 transition-colors">
          <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400 mx-auto" />
          <h3 className="text-base font-black text-red-800 dark:text-red-300">{error}</h3>
          <button
            onClick={loadOrders}
            className="px-4 py-2 bg-krishi-600 hover:bg-krishi-700 text-white font-black rounded-xl text-xs touch-btn shadow"
          >
            पुनः प्रयास करें (Retry)
          </button>
        </div>
      ) : orders && orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map(order => (
            <OrderTracker
              key={order.id}
              order={order}
              onOrderUpdated={loadOrders}
              showDetailLink={true}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-darkbg-surface p-10 rounded-3xl border border-gray-200 dark:border-darkbg-border text-center space-y-3 transition-colors">
          <span className="text-4xl">📦</span>
          <h3 className="text-base font-black text-gray-800 dark:text-gray-200">अभी कोई सक्रिय ऑर्डर नहीं है</h3>
          <p className="text-xs text-gray-500 dark:text-darkbg-muted max-w-sm mx-auto">
            जब आप किसी खरीदार का डिजिटल प्रस्ताव स्वीकार करेंगे, तो ऑर्डर यहां स्वतः दिखाई देगा।
          </p>
        </div>
      )}
    </div>
  );
}
