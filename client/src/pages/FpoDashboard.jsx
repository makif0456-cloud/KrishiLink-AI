import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { FpoService } from '../services/fpoService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { 
  Landmark, Users, Package, DollarSign, TrendingUp, Handshake, 
  MapPin, Phone, ShieldCheck, ArrowRight, RefreshCw, AlertCircle 
} from 'lucide-react';

export default function FpoDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [activeTab, setActiveTab] = useState('produce'); // produce, buyers, members
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFpoData();
  }, []);

  const loadFpoData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await FpoService.getDashboard();
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load FPO data:', err);
      setError('एफपीओ डैशबोर्ड डेटा लोड करने में त्रुटि हुई।');
    } finally {
      setLoading(false);
    }
  };

  // RBAC Access Guard
  if (user?.role !== 'fpo' && user?.role !== 'admin') {
    return (
      <div className="bg-white dark:bg-darkbg-surface p-8 rounded-3xl border border-red-200 dark:border-red-800 text-center space-y-4 max-w-md mx-auto my-12 transition-colors">
        <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-gray-900 dark:text-white">403 — अनाधिकृत पहुंच (Access Denied)</h3>
        <p className="text-xs text-gray-600 dark:text-darkbg-muted">
          यह पृष्ठ केवल अधिकृत एफपीओ (FPO Manager) उपयोगकर्ताओं के लिए उपलब्ध है।
        </p>
      </div>
    );
  }

  if (loading) {
    return <LoadingSpinner text="एफपीओ डेटा और सामूहिक उपज का विश्लेषण हो रहा है..." />;
  }

  const fpo = dashboardData?.fpo || {};
  const summary = dashboardData?.summary || {};
  const produceList = dashboardData?.aggregated_produce || [];
  const bulkBuyers = dashboardData?.bulk_buyer_matches || [];
  const members = dashboardData?.recent_member_farmers || [];

  return (
    <div className="space-y-5 pb-20 max-w-5xl mx-auto py-2 sm:py-4">

      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-purple-950 dark:from-darkbg-card dark:via-darkbg-surface dark:to-darkbg-card text-white p-5 sm:p-6 rounded-3xl shadow-lg border border-purple-800 dark:border-darkbg-border flex flex-wrap items-center justify-between gap-4 transition-colors">
        <div>
          <div className="flex items-center space-x-2">
            <Landmark className="w-5 h-5 text-kisan-gold" />
            <span className="text-xs font-bold text-kisan-gold uppercase tracking-wider">
              FPO Collective Aggregation Portal
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white mt-1">
            {fpo.business_name || 'भोपाल किसान उत्पादक समिति (FPO)'}
          </h1>
          <p className="text-xs text-purple-200 dark:text-darkbg-muted mt-0.5">
            📍 {fpo.district || 'भोपाल'} जिला • {summary.total_members || 42} सदस्य किसान • सामूहिक उपज एकत्रीकरण
          </p>
        </div>

        <button
          type="button"
          onClick={loadFpoData}
          className="px-4 py-2 bg-purple-800 dark:bg-darkbg-card hover:bg-purple-700 dark:hover:bg-darkbg-hover text-white border border-purple-600 dark:border-darkbg-border rounded-xl text-xs font-extrabold flex items-center space-x-1.5 touch-btn transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>रिफ्रेश (Refresh)</span>
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-200 border border-red-300 dark:border-red-800 text-xs font-bold flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-darkbg-surface p-4 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-xs">
          <div className="flex items-center justify-between text-purple-600 dark:text-purple-400 mb-1">
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase bg-purple-50 dark:bg-darkbg-card px-2 py-0.5 rounded-full">Members</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white block">
            {summary.total_members || 42}
          </span>
          <span className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium">संबद्ध सदस्य किसान</span>
        </div>

        <div className="bg-white dark:bg-darkbg-surface p-4 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-xs">
          <div className="flex items-center justify-between text-krishi-600 dark:text-krishi-400 mb-1">
            <Package className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase bg-krishi-50 dark:bg-darkbg-card px-2 py-0.5 rounded-full">Produce</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white block">
            {(summary.total_produce_quintals || 2850).toLocaleString('en-IN')}
          </span>
          <span className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium">क्विंटल कुल एकत्रित उपज</span>
        </div>

        <div className="bg-white dark:bg-darkbg-surface p-4 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-1">
            <DollarSign className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase bg-emerald-50 dark:bg-darkbg-card px-2 py-0.5 rounded-full">Est. Value</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-800 dark:text-emerald-400 block">
            ₹{Math.round((summary.total_potential_trading_value || 7200000) / 100000)}L
          </span>
          <span className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium">अनुमानित व्यापार मूल्य</span>
        </div>

        <div className="bg-white dark:bg-darkbg-surface p-4 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-1">
            <Handshake className="w-5 h-5" />
            <span className="text-[10px] font-bold uppercase bg-amber-50 dark:bg-darkbg-card px-2 py-0.5 rounded-full">Matches</span>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white block">
            {summary.potential_bulk_buyers_count || 17}
          </span>
          <span className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium">थोक खरीदार अवसर</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 border-b border-gray-200 dark:border-darkbg-border pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('produce')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-1.5 transition shrink-0 ${
            activeTab === 'produce' ? 'bg-purple-800 text-white shadow-sm' : 'bg-white dark:bg-darkbg-surface text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkbg-card'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>🌾 एकत्रित उपज (Aggregated Produce)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('buyers')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-1.5 transition shrink-0 ${
            activeTab === 'buyers' ? 'bg-purple-800 text-white shadow-sm' : 'bg-white dark:bg-darkbg-surface text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkbg-card'
          }`}
        >
          <Handshake className="w-4 h-4" />
          <span>🤝 थोक खरीदार अवसर (Bulk Buyers)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('members')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black flex items-center space-x-1.5 transition shrink-0 ${
            activeTab === 'members' ? 'bg-purple-800 text-white shadow-sm' : 'bg-white dark:bg-darkbg-surface text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-darkbg-card'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>👥 सदस्य किसान डायरेक्टरी (Members)</span>
        </button>
      </div>

      {/* TAB 1: AGGREGATED PRODUCE CARDS */}
      {activeTab === 'produce' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-purple-50 dark:bg-darkbg-card border border-purple-200 dark:border-darkbg-border p-4 rounded-2xl text-xs text-purple-950 dark:text-purple-200">
            <span className="font-black block mb-0.5">💡 सामूहिक एकत्रीकरण का लाभ (Bargaining Power):</span>
            <span>छोटे किसानों की उपज को FPO स्तर पर एकत्रित करके संस्थागत खरीदारों से प्रति क्विंटल ₹120-180 अधिक भाव प्राप्त किया जा सकता है।</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {produceList.map((p) => (
              <div
                key={p.commodity_id}
                className="bg-white dark:bg-darkbg-surface p-5 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-xs space-y-3 relative overflow-hidden transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <span className="text-3xl">{p.icon || '🌾'}</span>
                    <div>
                      <h4 className="text-base font-black text-gray-950 dark:text-white">{p.commodity_name_hi}</h4>
                      <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium">
                        👥 {p.farmer_count} किसानों की सामूहिक उपज
                      </p>
                    </div>
                  </div>

                  <span className="text-xs font-black bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 px-3 py-1 rounded-full border border-purple-200 dark:border-purple-800">
                    {p.total_quantity} क्विंटल
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-100 dark:border-darkbg-border text-xs">
                  <div className="bg-gray-50 dark:bg-darkbg-card p-2.5 rounded-xl border border-gray-100 dark:border-darkbg-border">
                    <span className="text-[10px] text-gray-500 dark:text-darkbg-muted font-bold block">औसत अपेक्षित भाव</span>
                    <span className="text-base font-black text-gray-950 dark:text-white">₹{Number(p.avg_expected_price).toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-gray-400 dark:text-darkbg-muted block">/ क्विंटल</span>
                  </div>

                  <div className="bg-gray-50 dark:bg-darkbg-card p-2.5 rounded-xl border border-gray-100 dark:border-darkbg-border">
                    <span className="text-[10px] text-gray-500 dark:text-darkbg-muted font-bold block">सामूहिक कुल मूल्य</span>
                    <span className="text-base font-black text-purple-800 dark:text-purple-300">₹{Number(p.total_value).toLocaleString('en-IN')}</span>
                    <span className="text-[10px] text-gray-400 dark:text-darkbg-muted block">अनुमानित</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between text-xs">
                  <span className="text-emerald-700 dark:text-emerald-400 font-black flex items-center gap-1 text-[11px]">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>थोक मांग सक्रिय</span>
                  </span>

                  <button
                    type="button"
                    onClick={() => setActiveTab('buyers')}
                    className="text-purple-800 dark:text-purple-300 hover:text-purple-950 dark:hover:text-purple-100 font-black text-xs flex items-center gap-1 touch-btn"
                  >
                    <span>थोक खरीदार देखें</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: BULK BUYER OPPORTUNITIES */}
      {activeTab === 'buyers' && (
        <div className="space-y-4 animate-in fade-in">
          <h3 className="text-base font-black text-gray-900 dark:text-white">
            🤝 संस्थागत व थोक खरीदार मांग (Institutional Demand)
          </h3>

          <div className="space-y-3">
            {bulkBuyers.map((buyer, idx) => (
              <div
                key={buyer.id || idx}
                className="bg-white dark:bg-darkbg-surface p-4 sm:p-5 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <h4 className="text-base font-black text-gray-950 dark:text-white">{buyer.buyer_name}</h4>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-emerald-200 dark:border-emerald-800">
                      <ShieldCheck className="w-3 h-3" />
                      <span>सत्यापित खरीदार</span>
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 font-medium">
                    🌾 मांग: <strong>{buyer.commodity_name_hi}</strong> ({buyer.required_quantity} क्विंटल) • अधिकतम भाव: <strong>₹{Number(buyer.max_price).toLocaleString('en-IN')}/क्विंटल</strong>
                  </p>
                  <p className="text-[11px] text-gray-400 dark:text-darkbg-muted">
                    📍 {buyer.district} • {buyer.payment_terms}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs font-black bg-purple-50 dark:bg-darkbg-card text-purple-900 dark:text-purple-300 border border-purple-200 dark:border-darkbg-border px-3 py-2 rounded-2xl">
                    मैच: {buyer.match_potential}
                  </span>
                  <button
                    type="button"
                    onClick={() => alert(`FPO अनुबंध प्रस्ताव खरीदार (${buyer.buyer_name}) को भेजा गया!`)}
                    className="px-4 py-2 bg-purple-800 hover:bg-purple-900 text-white font-black rounded-2xl text-xs shadow-md touch-btn flex items-center space-x-1 transition"
                  >
                    <span>प्रस्ताव भेजें 💼</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: MEMBER FARMERS DIRECTORY */}
      {activeTab === 'members' && (
        <div className="bg-white dark:bg-darkbg-surface p-5 sm:p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-xs space-y-4 animate-in fade-in transition-colors">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-black text-gray-900 dark:text-white">
              👥 FPO सदस्य किसान डायरेक्टरी (Member Farmers)
            </h3>
            <span className="text-xs text-purple-800 dark:text-purple-300 font-black bg-purple-50 dark:bg-darkbg-card px-3 py-1 rounded-full border border-purple-200 dark:border-darkbg-border">
              {members.length} सक्रिय सदस्य
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((member) => (
              <div
                key={member.id}
                className="bg-gray-50 dark:bg-darkbg-card p-4 rounded-2xl border border-gray-200 dark:border-darkbg-border flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <h5 className="text-sm font-black text-gray-950 dark:text-white">{member.name}</h5>
                  <p className="text-gray-500 dark:text-darkbg-muted font-medium flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    <span>{member.village}, {member.district}</span>
                  </p>
                  <p className="text-gray-600 dark:text-gray-300 font-semibold">
                    भूमि: {member.land_area_acres} एकड़ • मुख्य उपज: {member.primary_crop}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[11px] font-mono text-gray-500 dark:text-darkbg-muted block">{member.phone}</span>
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full inline-block mt-1 border border-emerald-200 dark:border-emerald-800">
                    सक्रिय सदस्य ✅
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
