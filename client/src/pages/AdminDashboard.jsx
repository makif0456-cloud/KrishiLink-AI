import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { AdminService } from '../services/adminService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { 
  Users, ShoppingBag, Landmark, Package, FileText, CheckCircle2, 
  XCircle, Sliders, ShieldCheck, AlertCircle, RefreshCw, BarChart3, 
  History, DollarSign, ArrowRight 
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState('analytics'); // analytics, buyers, config, logs
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [pendingBuyers, setPendingBuyers] = useState([]);
  const [configWeights, setConfigWeights] = useState({
    price: 40,
    distance: 20,
    quantity_match: 15,
    quality_match: 10,
    payment_reliability: 10,
    delivery_compatibility: 5
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [actionMessage, setActionMessage] = useState(null);
  const [savingConfig, setSavingConfig] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    setActionMessage(null);
    try {
      const [analyticsData, buyersData, configData, logsData] = await Promise.all([
        AdminService.getAnalytics().catch(() => null),
        AdminService.getPendingBuyers().catch(() => []),
        AdminService.getConfig().catch(() => null),
        AdminService.getAuditLogs(30).catch(() => [])
      ]);

      if (analyticsData) setAnalytics(analyticsData);
      if (buyersData) setPendingBuyers(buyersData);
      if (configData) setConfigWeights(configData);
      if (logsData) setAuditLogs(logsData);
    } catch (err) {
      console.error('Failed to load admin data:', err);
      setActionMessage({ type: 'error', text: 'डेटा लोड करने में समस्या हुई।' });
    } finally {
      setLoading(false);
    }
  };

  // 1. Verify Buyer
  const handleVerifyBuyer = async (buyerId) => {
    setActionLoadingId(buyerId);
    try {
      await AdminService.verifyBuyer(buyerId);
      setActionMessage({ type: 'success', text: 'खरीदार सफलतापूर्वक सत्यापित हो गया!' });
      const updatedBuyers = await AdminService.getPendingBuyers();
      setPendingBuyers(updatedBuyers || []);
      const updatedAnalytics = await AdminService.getAnalytics();
      setAnalytics(updatedAnalytics);
    } catch (err) {
      console.error('Buyer verification failed:', err);
      setActionMessage({ type: 'error', text: err.response?.data?.message || err.message || 'सत्यापन विफल रहा' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // 2. Reject Buyer
  const handleRejectBuyer = async (buyerId) => {
    setActionLoadingId(buyerId);
    try {
      await AdminService.rejectBuyer(buyerId, 'Admin rejected verification');
      setActionMessage({ type: 'info', text: 'खरीदार सत्यापन अस्वीकार कर दिया गया।' });
      const updatedBuyers = await AdminService.getPendingBuyers();
      setPendingBuyers(updatedBuyers || []);
    } catch (err) {
      console.error('Buyer reject failed:', err);
      setActionMessage({ type: 'error', text: err.response?.data?.message || err.message || 'अस्वीकार करने में त्रुटि हुई' });
    } finally {
      setActionLoadingId(null);
    }
  };

  // 3. Weight configuration sum calculation
  const totalWeightSum = Math.round(
    Number(configWeights.price || 0) +
    Number(configWeights.distance || 0) +
    Number(configWeights.quantity_match || 0) +
    Number(configWeights.quality_match || 0) +
    Number(configWeights.payment_reliability || 0) +
    Number(configWeights.delivery_compatibility || 0)
  );

  const isWeightValid = totalWeightSum === 100;

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    if (!isWeightValid) {
      setActionMessage({ type: 'error', text: 'कुल वजन 100% होना चाहिए (Total weights must sum to 100%)' });
      return;
    }

    setSavingConfig(true);
    setActionMessage(null);
    try {
      await AdminService.updateConfig(configWeights);
      setActionMessage({ type: 'success', text: 'मैचिंग भार कॉन्फ़िगरेशन सफलतापूर्वक अपडेट हो गया!' });
    } catch (err) {
      console.error('Config update failed:', err);
      setActionMessage({ type: 'error', text: err.response?.data?.message || err.message || 'कॉन्फ़िगरेशन सेव करने में त्रुटि हुई' });
    } finally {
      setSavingConfig(false);
    }
  };

  // RBAC Access Guard
  if (user?.role !== 'admin') {
    return (
      <div className="bg-white dark:bg-darkbg-surface p-8 rounded-3xl border border-red-200 dark:border-red-800 text-center space-y-4 max-w-md mx-auto my-12 transition-colors">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-gray-900 dark:text-white">403 — अनाधिकृत पहुंच (Access Denied)</h3>
        <p className="text-xs text-gray-600 dark:text-darkbg-muted">
          यह पृष्ठ केवल अधिकृत एडमिन उपयोगकर्ताओं के लिए सुरक्षित है। कृपया एडमिन खाते से लॉगिन करें।
        </p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner text="एडमिन डेटा लोड हो रहा है..." />;
  }

  const kpis = analytics?.kpis || {
    farmers_count: 128,
    buyers_count: 42,
    fpos_count: 12,
    active_lots_count: 37,
    total_offers_count: 84,
    total_orders_count: 29,
    total_trading_value: 1845000,
    pending_buyer_verifications: pendingBuyers.length
  };

  return (
    <div className="space-y-5 pb-20 max-w-5xl mx-auto py-2 sm:py-4">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-gray-900 via-slate-800 to-gray-900 dark:from-darkbg-card dark:via-darkbg-surface dark:to-darkbg-card text-white p-5 sm:p-6 rounded-3xl shadow-lg border border-gray-700 dark:border-darkbg-border flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-kisan-gold" />
            <span className="text-xs font-bold text-kisan-gold uppercase tracking-wider">
              Admin Portal
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            कृषि-लिंक केंद्रीय नियंत्रण केंद्र (Control Center)
          </h1>
          <p className="text-xs text-gray-300 dark:text-darkbg-muted mt-0.5">
            प्लेटफॉर्म एनालिटिक्स, खरीदार सत्यापन एवं एल्गोरिदम भार प्रबंधन
          </p>
        </div>

        <button
          type="button"
          onClick={loadAllData}
          className="px-4 py-2 bg-gray-800 dark:bg-darkbg-card hover:bg-gray-700 dark:hover:bg-darkbg-hover text-gray-200 border border-gray-600 dark:border-darkbg-border rounded-xl text-xs font-extrabold flex items-center space-x-1.5 touch-btn transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>रिफ्रेश (Refresh)</span>
        </button>
      </div>

      {/* Action Notification Message */}
      {actionMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold flex items-center space-x-2.5 ${
          actionMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800' :
          actionMessage.type === 'error' ? 'bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-200 border border-red-300 dark:border-red-800' :
          'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 border border-blue-300 dark:border-blue-800'
        }`}>
          {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-darkbg-border pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-1.5 transition shrink-0 ${
            activeTab === 'analytics' ? 'bg-krishi-600 text-white shadow-sm' : 'bg-white dark:bg-darkbg-surface text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkbg-card'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>📊 एनालिटिक्स (Analytics)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('buyers')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-1.5 transition shrink-0 relative ${
            activeTab === 'buyers' ? 'bg-krishi-600 text-white shadow-sm' : 'bg-white dark:bg-darkbg-surface text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkbg-card'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>🛡️ खरीदार सत्यापन (Verification)</span>
          {pendingBuyers.length > 0 && (
            <span className="ml-1 bg-amber-500 text-gray-950 px-1.5 py-0.5 rounded-full text-[10px] font-black">
              {pendingBuyers.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-1.5 transition shrink-0 ${
            activeTab === 'config' ? 'bg-krishi-600 text-white shadow-sm' : 'bg-white dark:bg-darkbg-surface text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkbg-card'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>⚙️ मैचिंग भार संपादक (Config)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-1.5 transition shrink-0 ${
            activeTab === 'logs' ? 'bg-krishi-600 text-white shadow-sm' : 'bg-white dark:bg-darkbg-surface text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkbg-card'
          }`}
        >
          <History className="w-4 h-4" />
          <span>📜 ऑडिट लॉग (Audit Logs)</span>
        </button>
      </div>

      {/* TAB 1: ANALYTICS */}
      {activeTab === 'analytics' && (
        <div className="space-y-5 animate-in fade-in">
          {/* KPI Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-xs">
              <div className="flex items-center justify-between text-krishi-600 dark:text-krishi-400 mb-1">
                <Users className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase bg-krishi-50 dark:bg-darkbg-card px-2 py-0.5 rounded-full">Farmers</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white block">
                {kpis.farmers_count}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium">पंजीकृत किसान</span>
            </div>

            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-xs">
              <div className="flex items-center justify-between text-blue-600 dark:text-blue-400 mb-1">
                <ShoppingBag className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase bg-blue-50 dark:bg-darkbg-card px-2 py-0.5 rounded-full">Buyers</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white block">
                {kpis.buyers_count}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium">सत्यापित व्यापारी</span>
            </div>

            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-xs">
              <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
                <Landmark className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase bg-purple-50 dark:bg-darkbg-card px-2 py-0.5 rounded-full">FPOs</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white block">
                {kpis.fpos_count}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium">संबद्ध FPO समितियां</span>
            </div>

            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-xs">
              <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
                <Package className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase bg-emerald-50 dark:bg-darkbg-card px-2 py-0.5 rounded-full">Active</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white block">
                {kpis.active_lots_count}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium">सक्रिय फसल लॉट</span>
            </div>

            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-xs">
              <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
                <FileText className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase bg-amber-50 dark:bg-darkbg-card px-2 py-0.5 rounded-full">Offers</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white block">
                {kpis.total_offers_count}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium">डिजिटल प्रस्ताव</span>
            </div>

            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-xs">
              <div className="flex items-center justify-between text-indigo-600 dark:text-indigo-400 mb-1">
                <Package className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase bg-indigo-50 dark:bg-darkbg-card px-2 py-0.5 rounded-full">Orders</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white block">
                {kpis.total_orders_count}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium">कुल डिजिटल अनुबंध</span>
            </div>

            <div className="bg-white dark:bg-darkbg-surface p-4 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-xs col-span-2">
              <div className="flex items-center justify-between text-krishi-700 dark:text-kisan-gold mb-1">
                <DollarSign className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase bg-emerald-50 dark:bg-darkbg-card text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded-full">Trade Value</span>
              </div>
              <span className="text-2xl sm:text-3xl font-black text-krishi-800 dark:text-kisan-gold block">
                ₹{Number(kpis.total_trading_value || 0).toLocaleString('en-IN')}
              </span>
              <span className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium">कुल डिजिटल व्यापार मूल्य</span>
            </div>
          </div>

          {/* Commodity Distribution Breakdown */}
          {analytics?.commodity_breakdown && (
            <div className="bg-white dark:bg-darkbg-surface p-5 sm:p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-xs space-y-4">
              <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white flex items-center gap-2">
                <span>🌾</span> फसल अनुसार मांग व आपूर्ति विश्लेषण (Commodity Distribution)
              </h3>

              <div className="space-y-3">
                {Object.entries(analytics.commodity_breakdown).map(([name, data]) => {
                  const maxQty = 1500;
                  const pct = Math.min(100, Math.round((data.total_quantity / maxQty) * 100));
                  return (
                    <div key={name} className="space-y-1">
                      <div className="flex justify-between text-xs font-black text-gray-800 dark:text-gray-200">
                        <span>{name} ({data.count} लॉट)</span>
                        <span>{data.total_quantity} क्विंटल</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-darkbg-card h-3 rounded-full overflow-hidden">
                        <div
                          className="bg-krishi-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: BUYER VERIFICATION QUEUE */}
      {activeTab === 'buyers' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white">
                🛡️ खरीदार सत्यापन कतार (Buyer Verification Queue)
              </h3>
              <p className="text-xs text-gray-500 dark:text-darkbg-muted">
                पंजीकृत व्यापारियों का व्यावसायिक रिकॉर्ड व सत्यापन स्थिति
              </p>
            </div>
            <span className="text-xs font-black bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-300 px-3 py-1 rounded-full border border-amber-300 dark:border-amber-800">
              {pendingBuyers.length} लंबित
            </span>
          </div>

          {pendingBuyers.length === 0 ? (
            <div className="bg-white dark:bg-darkbg-surface p-8 rounded-3xl border border-gray-200 dark:border-darkbg-border text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
              <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">कोई लंबित खरीदार सत्यापन नहीं है</h4>
              <p className="text-xs text-gray-500 dark:text-darkbg-muted">सभी पंजीकृत खरीदार सफलतापूर्वक सत्यापित हैं।</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingBuyers.map((buyer) => (
                <div
                  key={buyer.id}
                  className="bg-white dark:bg-darkbg-surface p-4 sm:p-5 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="text-base font-black text-gray-950 dark:text-white">
                        {buyer.business_name || buyer.name}
                      </h4>
                      <span className="text-[10px] bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-black px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-800">
                        सत्यापन लंबित (Pending)
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                      👤 संपर्क: {buyer.name} • 📞 {buyer.phone} • 📍 {buyer.district || 'इंदौर'}, {buyer.state || 'मध्य प्रदेश'}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-darkbg-muted">
                      पंजीकरण तिथि: {new Date(buyer.created_at || Date.now()).toLocaleDateString('hi-IN')}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      disabled={actionLoadingId === buyer.id}
                      onClick={() => handleVerifyBuyer(buyer.id)}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-xs flex items-center justify-center space-x-1 shadow touch-btn disabled:opacity-50 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{actionLoadingId === buyer.id ? 'सत्यापित हो रहा है...' : 'सत्यापित करें (Verify) ✅'}</span>
                    </button>

                    <button
                      type="button"
                      disabled={actionLoadingId === buyer.id}
                      onClick={() => handleRejectBuyer(buyer.id)}
                      className="flex-1 sm:flex-none px-3.5 py-2.5 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold rounded-2xl text-xs flex items-center justify-center space-x-1 touch-btn disabled:opacity-50 transition"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>अस्वीकार करें ❌</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MATCHING WEIGHTS CONFIG EDITOR */}
      {activeTab === 'config' && (
        <form onSubmit={handleSaveConfig} className="bg-white dark:bg-darkbg-surface p-5 sm:p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-xs space-y-5 animate-in fade-in transition-colors">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-black text-gray-900 dark:text-white">
                ⚙️ 6-कारक खरीदार मैचिंग एल्गोरिदम भार (Matching Weights Editor)
              </h3>
              <p className="text-xs text-gray-500 dark:text-darkbg-muted mt-0.5">
                किसानों के लिए सर्वश्रेष्ठ खरीदार मैचिंग स्कोर निर्धारित करने वाले वजन को अनुकूलित करें। कुल योग 100% होना अनिवार्य है।
              </p>
            </div>

            <div className={`px-3 py-1.5 rounded-2xl text-xs font-black border ${
              isWeightValid ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800' : 'bg-rose-50 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-800'
            }`}>
              कुल योग: {totalWeightSum}% {isWeightValid ? '✅' : '❌ (100% चाहिए)'}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Price Weight */}
            <div className="bg-gray-50 dark:bg-darkbg-card p-4 rounded-2xl space-y-1.5 border border-gray-200 dark:border-darkbg-border">
              <div className="flex justify-between text-xs font-black text-gray-900 dark:text-white">
                <span>1. भाव प्राथमिकता (Price Factor)</span>
                <span className="text-krishi-700 dark:text-kisan-gold">{configWeights.price}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={configWeights.price}
                onChange={(e) => setConfigWeights({ ...configWeights, price: Number(e.target.value) })}
                className="w-full accent-krishi-600 cursor-pointer"
              />
              <p className="text-[10px] text-gray-500 dark:text-darkbg-muted">खरीदार के प्रस्तावित भाव का महत्व</p>
            </div>

            {/* Distance Weight */}
            <div className="bg-gray-50 dark:bg-darkbg-card p-4 rounded-2xl space-y-1.5 border border-gray-200 dark:border-darkbg-border">
              <div className="flex justify-between text-xs font-black text-gray-900 dark:text-white">
                <span>2. दूरी व लॉजिस्टिक्स (Distance Factor)</span>
                <span className="text-krishi-700 dark:text-kisan-gold">{configWeights.distance}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={configWeights.distance}
                onChange={(e) => setConfigWeights({ ...configWeights, distance: Number(e.target.value) })}
                className="w-full accent-krishi-600 cursor-pointer"
              />
              <p className="text-[10px] text-gray-500 dark:text-darkbg-muted">खेत से खरीदार के गोदाम की निकटता</p>
            </div>

            {/* Quantity Match */}
            <div className="bg-gray-50 dark:bg-darkbg-card p-4 rounded-2xl space-y-1.5 border border-gray-200 dark:border-darkbg-border">
              <div className="flex justify-between text-xs font-black text-gray-900 dark:text-white">
                <span>3. मात्रा अनुकूलता (Quantity Match)</span>
                <span className="text-krishi-700 dark:text-kisan-gold">{configWeights.quantity_match}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={configWeights.quantity_match}
                onChange={(e) => setConfigWeights({ ...configWeights, quantity_match: Number(e.target.value) })}
                className="w-full accent-krishi-600 cursor-pointer"
              />
              <p className="text-[10px] text-gray-500 dark:text-darkbg-muted">मांग और आपूर्ति क्षमता की समानता</p>
            </div>

            {/* Quality Match */}
            <div className="bg-gray-50 dark:bg-darkbg-card p-4 rounded-2xl space-y-1.5 border border-gray-200 dark:border-darkbg-border">
              <div className="flex justify-between text-xs font-black text-gray-900 dark:text-white">
                <span>4. गुणवत्ता ग्रेड (Quality Grade)</span>
                <span className="text-krishi-700 dark:text-kisan-gold">{configWeights.quality_match}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={configWeights.quality_match}
                onChange={(e) => setConfigWeights({ ...configWeights, quality_match: Number(e.target.value) })}
                className="w-full accent-krishi-600 cursor-pointer"
              />
              <p className="text-[10px] text-gray-500 dark:text-darkbg-muted">ग्रेड A/B/C की उपयुक्तता</p>
            </div>

            {/* Payment Reliability */}
            <div className="bg-gray-50 dark:bg-darkbg-card p-4 rounded-2xl space-y-1.5 border border-gray-200 dark:border-darkbg-border">
              <div className="flex justify-between text-xs font-black text-gray-900 dark:text-white">
                <span>5. भुगतान विश्वसनीयता (Payment Reliability)</span>
                <span className="text-krishi-700 dark:text-kisan-gold">{configWeights.payment_reliability}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={configWeights.payment_reliability}
                onChange={(e) => setConfigWeights({ ...configWeights, payment_reliability: Number(e.target.value) })}
                className="w-full accent-krishi-600 cursor-pointer"
              />
              <p className="text-[10px] text-gray-500 dark:text-darkbg-muted">तत्काल भुगतान व खरीदार साख</p>
            </div>

            {/* Delivery Compatibility */}
            <div className="bg-gray-50 dark:bg-darkbg-card p-4 rounded-2xl space-y-1.5 border border-gray-200 dark:border-darkbg-border">
              <div className="flex justify-between text-xs font-black text-gray-900 dark:text-white">
                <span>6. उठान सुविधा (Farm Pickup / Delivery)</span>
                <span className="text-krishi-700 dark:text-kisan-gold">{configWeights.delivery_compatibility}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={configWeights.delivery_compatibility}
                onChange={(e) => setConfigWeights({ ...configWeights, delivery_compatibility: Number(e.target.value) })}
                className="w-full accent-krishi-600 cursor-pointer"
              />
              <p className="text-[10px] text-gray-500 dark:text-darkbg-muted">खेत से सीधा वाहन भेजने की सुविधा</p>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-gray-100 dark:border-darkbg-border">
            <button
              type="button"
              onClick={() => setConfigWeights({
                price: 40, distance: 20, quantity_match: 15, quality_match: 10, payment_reliability: 10, delivery_compatibility: 5
              })}
              className="text-xs text-gray-600 dark:text-darkbg-muted font-bold hover:underline"
            >
              डिफ़ॉल्ट रीसेट करें (Reset Default)
            </button>

            <button
              type="submit"
              disabled={!isWeightValid || savingConfig}
              className="px-6 py-3 bg-krishi-600 hover:bg-krishi-700 text-white font-black rounded-2xl text-xs sm:text-sm shadow-md touch-btn disabled:opacity-50 flex items-center space-x-1.5 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{savingConfig ? 'सुरक्षित हो रहा है...' : 'कॉन्फ़िगरेशन सेव करें (Save Config) 💾'}</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: AUDIT LOGS */}
      {activeTab === 'logs' && (
        <div className="bg-white dark:bg-darkbg-surface p-5 sm:p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-xs space-y-4 animate-in fade-in transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-gray-900 dark:text-white">
              📜 प्लेटफॉर्म सुरक्षा एवं ऑडिट लॉग (Security & Audit Trail)
            </h3>
            <span className="text-xs text-gray-500 dark:text-darkbg-muted font-bold">
              नवीनतम {auditLogs.length} रिकॉर्ड
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 dark:bg-darkbg-card text-gray-500 dark:text-darkbg-muted uppercase text-[10px] font-black border-y border-gray-200 dark:border-darkbg-border">
                <tr>
                  <th className="py-2.5 px-3">समय (Timestamp)</th>
                  <th className="py-2.5 px-3">क्रिया (Action)</th>
                  <th className="py-2.5 px-3">इकाई प्रकार (Entity)</th>
                  <th className="py-2.5 px-3">आईडी (Entity ID)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-darkbg-border font-medium text-gray-800 dark:text-gray-200">
                {auditLogs.map((log, idx) => (
                  <tr key={log.id || idx} className="hover:bg-gray-50/80 dark:hover:bg-darkbg-hover">
                    <td className="py-2.5 px-3 text-gray-500 dark:text-darkbg-muted font-mono text-[11px]">
                      {new Date(log.created_at || Date.now()).toLocaleString('hi-IN')}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="font-black text-krishi-800 dark:text-krishi-300 bg-krishi-50 dark:bg-darkbg-card px-2 py-0.5 rounded-md border border-krishi-200 dark:border-krishi-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 dark:text-gray-400">{log.entity_type}</td>
                    <td className="py-2.5 px-3 font-mono text-[10px] text-gray-400 dark:text-darkbg-muted">
                      {log.entity_id ? log.entity_id.slice(0, 13) : 'N/A'}...
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
