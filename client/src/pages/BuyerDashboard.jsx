import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { TradingService } from '../services/tradingService';
import { MarketService } from '../services/marketService';
import OrderTracker from '../components/common/OrderTracker';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { PlusCircle, ShieldCheck, MapPin, Truck, Sparkles, DollarSign, Package, CheckCircle2, XCircle, MessageSquare, AlertCircle } from 'lucide-react';

export default function BuyerDashboard() {
  const { t, lang } = useLanguage();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState('lots'); // 'lots', 'requirements', 'offers', 'orders'
  const [commodities, setCommodities] = useState([]);
  const [requirements, setRequirements] = useState([]);
  const [availableLots, setAvailableLots] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Requirement Modal State
  const [reqModalOpen, setReqModalOpen] = useState(false);
  const [newReq, setNewReq] = useState({
    commodity_id: '',
    quantity_min: '50',
    quantity_max: '200',
    price_max: '2450',
    quality_grade: 'A',
    pickup_available: true,
    delivery_radius_km: 150
  });

  // Make Offer Modal State
  const [offerModalOpen, setOfferModalOpen] = useState(false);
  const [selectedLot, setSelectedLot] = useState(null);
  const [offerPrice, setOfferPrice] = useState('2450');
  const [pickupOffered, setPickupOffered] = useState(true);
  const [offerNotes, setOfferNotes] = useState('सीधे आपके खेत से उठाएंगे (Direct farm pickup)');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState(null);

  const loadAllData = async () => {
    try {
      const [commList, reqList, lotsList, offersList, ordersList] = await Promise.all([
        MarketService.getCommodities(),
        TradingService.getMyRequirements(),
        TradingService.getAllActiveLots(),
        TradingService.getMyOffers(),
        TradingService.getOrders()
      ]);
      setCommodities(commList || []);
      if (commList && commList.length > 0 && !newReq.commodity_id) {
        setNewReq(prev => ({ ...prev, commodity_id: commList[0].id }));
      }
      setRequirements(reqList || []);
      setAvailableLots(lotsList || []);
      setMyOffers(offersList || []);
      setOrders(ordersList || []);
    } catch (err) {
      console.error('Failed to load buyer portal data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleCreateRequirement = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await TradingService.createRequirement(newReq);
      setReqModalOpen(false);
      setFeedbackMsg({ type: 'success', text: 'खरीद आवश्यकता सफलतापूर्वक दर्ज हुई!' });
      loadAllData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenOfferModal = (lot) => {
    setSelectedLot(lot);
    setOfferPrice(lot.expected_price ? String(lot.expected_price) : '2450');
    setOfferModalOpen(true);
  };

  const handleSendOffer = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await TradingService.createOffer({
        lot_id: selectedLot.id,
        offered_price: Number(offerPrice),
        pickup_offered: pickupOffered,
        notes: offerNotes
      });
      setOfferModalOpen(false);
      setFeedbackMsg({ type: 'success', text: `फसल #${selectedLot.id.slice(0, 6)} पर ₹${offerPrice}/क्विंटल का डिजिटल प्रस्ताव भेजा गया!` });
      loadAllData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAcceptCounterOffer = async (offerId) => {
    setSubmitting(true);
    try {
      await TradingService.acceptOffer(offerId);
      setFeedbackMsg({ type: 'success', text: 'काउंटर प्रस्ताव स्वीकार कर लिया गया है! डिजिटल ऑर्डर तैयार हो गया है।' });
      await loadAllData();
      setActiveTab('orders');
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectOffer = async (offerId) => {
    setSubmitting(true);
    try {
      await TradingService.rejectOffer(offerId);
      setFeedbackMsg({ type: 'info', text: 'प्रस्ताव अस्वीकार कर दिया गया है।' });
      await loadAllData();
    } catch (err) {
      setFeedbackMsg({ type: 'error', text: err.response?.data?.message || err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-2 sm:py-4 space-y-4 sm:space-y-6">
      {/* Buyer Welcome Header */}
      <div className="bg-white dark:bg-darkbg-surface p-4 sm:p-5 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 flex items-center justify-center text-2xl shrink-0">
            💼
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <h2 className="text-lg font-black text-gray-900 dark:text-white leading-tight">
                {user?.business_name || user?.name || 'शर्मा ट्रेडर्स'}
              </h2>
              <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-emerald-300 dark:border-emerald-800">
                <ShieldCheck className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                सत्यापित खरीदार
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">
              📍 {user?.district || 'इंदौर'} • {user?.buyer_type === 'processor' ? 'प्रोसेसर' : 'मंडी व्यापारी (Trader)'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setReqModalOpen(true)}
          className="bg-krishi-600 hover:bg-krishi-700 active:scale-95 text-white font-black px-4 py-2.5 rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow touch-btn shrink-0 transition"
        >
          <PlusCircle className="w-4 h-4" />
          <span>{t('post_requirement_btn')}</span>
        </button>
      </div>

      {feedbackMsg && (
        <div className={`p-3.5 rounded-2xl text-xs font-bold ${
          feedbackMsg.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800' :
          'bg-red-50 dark:bg-red-950/60 text-red-800 dark:text-red-200 border border-red-300 dark:border-red-800'
        }`}>
          {feedbackMsg.text}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-darkbg-border overflow-x-auto hide-scrollbar">
        {[
          { id: 'lots', label: `🌾 उपलब्ध फसलें (${availableLots.length})` },
          { id: 'requirements', label: `📋 मेरी आवश्यकताएं (${requirements.length})` },
          { id: 'offers', label: `💼 भेजे गए प्रस्ताव (${myOffers.length})` },
          { id: 'orders', label: `🚚 ऑर्डर ट्रैकिंग (${orders.length})` }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`py-3 px-3.5 sm:px-4 font-black text-xs sm:text-sm whitespace-nowrap border-b-2 transition touch-btn ${
              activeTab === tab.id
                ? 'border-krishi-600 dark:border-kisan-gold text-krishi-700 dark:text-kisan-gold bg-white dark:bg-darkbg-surface rounded-t-2xl'
                : 'border-transparent text-gray-500 dark:text-darkbg-muted hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <>
          {/* TAB 1: BROWSE FARMER LOTS */}
          {activeTab === 'lots' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-gray-500 dark:text-darkbg-muted uppercase tracking-wider">
                  किसानों द्वारा बिक्री हेतु उपलब्ध फसलें
                </span>
              </div>

              {availableLots.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {availableLots.map(lot => (
                    <div
                      key={lot.id}
                      className="bg-white dark:bg-darkbg-surface p-4 sm:p-5 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm space-y-3 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-3xl">{lot.commodity_icon || '🌾'}</span>
                          <div>
                            <h3 className="text-base font-black text-gray-900 dark:text-white leading-tight">
                              {lang === 'hi' ? lot.commodity_name_hi : lot.commodity_name_en}
                            </h3>
                            <span className="text-xs text-gray-500 dark:text-darkbg-muted font-semibold">
                              {lot.farmer_name} • {lot.farmer_district || 'भोपाल'}
                            </span>
                          </div>
                        </div>
                        <span className="text-xs bg-krishi-100 dark:bg-krishi-900/60 text-krishi-800 dark:text-krishi-300 font-black px-2.5 py-0.5 rounded-full border border-krishi-200 dark:border-krishi-800">
                          Grade {lot.quality_grade}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 dark:bg-darkbg-card p-3 rounded-2xl border border-gray-100 dark:border-darkbg-border">
                        <div>
                          <span className="text-gray-400 dark:text-darkbg-muted text-[10px] font-bold block">मात्रा</span>
                          <span className="text-base font-black text-gray-900 dark:text-white">{lot.quantity} {lot.unit || 'क्विंटल'}</span>
                        </div>
                        <div>
                          <span className="text-gray-400 dark:text-darkbg-muted text-[10px] font-bold block">अपेक्षित भाव</span>
                          <span className="text-base font-black text-krishi-700 dark:text-kisan-gold">₹{lot.expected_price || 2500}/क्विंटल</span>
                        </div>
                      </div>

                      {lot.notes && (
                        <p className="text-xs text-gray-600 dark:text-gray-300 italic bg-gray-50 dark:bg-darkbg-card p-2 rounded-xl">"{lot.notes}"</p>
                      )}

                      <button
                        type="button"
                        onClick={() => handleOpenOfferModal(lot)}
                        className="w-full py-2.5 bg-krishi-600 hover:bg-krishi-700 active:scale-98 text-white font-black rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-1 shadow touch-btn transition"
                      >
                        <DollarSign className="w-4 h-4" />
                        <span>{t('make_offer_btn')}</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-darkbg-surface p-8 rounded-3xl border border-gray-200 dark:border-darkbg-border text-center text-xs text-gray-500 dark:text-darkbg-muted">
                  अभी कोई नई फसल बिक्री हेतु उपलब्ध नहीं है।
                </div>
              )}
            </div>
          )}

          {/* TAB 2: BUYER REQUIREMENTS */}
          {activeTab === 'requirements' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-black text-gray-500 dark:text-darkbg-muted uppercase tracking-wider">
                  सक्रिय खरीद मांग
                </span>
              </div>

              {requirements.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {requirements.map(req => (
                    <div key={req.id} className="bg-white dark:bg-darkbg-surface p-4 sm:p-5 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm space-y-2.5 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{req.commodity_icon || '🌾'}</span>
                          <h4 className="text-sm font-black text-gray-900 dark:text-white">
                            {lang === 'hi' ? req.commodity_name_hi : req.commodity_name_en}
                          </h4>
                        </div>
                        <span className="text-xs bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-300 dark:border-amber-800">
                          Grade {req.quality_grade}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 dark:bg-darkbg-card p-2.5 rounded-2xl border border-gray-100 dark:border-darkbg-border">
                        <div>
                          <span className="text-gray-400 dark:text-darkbg-muted block text-[10px]">मांग मात्रा</span>
                          <span className="font-black text-gray-900 dark:text-white">{req.quantity_min || 10}-{req.quantity_max || 200} क्विंटल</span>
                        </div>
                        <div>
                          <span className="text-gray-400 dark:text-darkbg-muted block text-[10px]">अधिकतम भाव</span>
                          <span className="font-black text-krishi-700 dark:text-kisan-gold">₹{req.price_max}/क्विंटल</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-500 dark:text-darkbg-muted font-medium">
                        {req.pickup_available ? '🚚 खेत से पिकअप उपलब्ध' : 'डिपो डिलीवरी'} • {req.delivery_radius_km} km दायरा
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-white dark:bg-darkbg-surface p-8 rounded-3xl border border-gray-200 dark:border-darkbg-border text-center text-xs text-gray-500 dark:text-darkbg-muted">
                  आपने अभी तक कोई खरीद आवश्यकता दर्ज नहीं की है।
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SENT OFFERS */}
          {activeTab === 'offers' && (
            <div className="space-y-3">
              {myOffers.length > 0 ? (
                <div className="space-y-3">
                  {myOffers.map(o => {
                    const isCountered = o.status === 'countered';
                    const isAccepted = o.status === 'accepted';
                    const isRejected = o.status === 'rejected';
                    const counterTotal = isCountered && o.counter_price ? Number(o.counter_price) * Number(o.lot_quantity || 1) : null;

                    return (
                      <div
                        key={o.id}
                        className={`bg-white dark:bg-darkbg-surface p-4 sm:p-5 rounded-3xl border shadow-sm space-y-3 transition-colors ${
                          isCountered
                            ? 'border-amber-300 dark:border-amber-700/60 bg-amber-50/10 dark:bg-amber-950/10'
                            : isAccepted
                            ? 'border-emerald-300 dark:border-emerald-800'
                            : isRejected
                            ? 'border-gray-200 dark:border-darkbg-border opacity-75'
                            : 'border-gray-200 dark:border-darkbg-border'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="text-2xl">{o.commodity_icon || '🌾'}</span>
                              <h4 className="text-sm font-black text-gray-900 dark:text-white">
                                {lang === 'hi' ? o.commodity_name_hi : o.commodity_name_en} ({o.lot_quantity} क्विंटल)
                              </h4>
                              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full ${
                                isAccepted ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                                isCountered ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-pulse' :
                                isRejected ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800' :
                                'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                              }`}>
                                {isAccepted ? 'स्वीकृत (ACCEPTED)' :
                                 isCountered ? 'किसान का काउंटर मिला (COUNTERED)' :
                                 isRejected ? 'अस्वीकृत (REJECTED)' :
                                 'लंबित (PENDING)'}
                              </span>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-darkbg-muted mt-1">
                              किसान: <strong>{o.farmer_name}</strong> ({o.farmer_district || 'भोपाल'})
                            </p>
                          </div>

                          <div className="text-left sm:text-right">
                            <span className="text-xs text-gray-400 dark:text-darkbg-muted font-bold block">
                              {isCountered ? 'आपका मूल प्रस्ताव' : 'प्रस्तावित राशि'}
                            </span>
                            <span className="text-sm sm:text-base font-black text-gray-900 dark:text-white">
                              ₹{Number(o.offered_price).toLocaleString('en-IN')}/क्विंटल (कुल: ₹{Number(o.total_amount).toLocaleString('en-IN')})
                            </span>
                          </div>
                        </div>

                        {/* 🌾 Farmer Counter Offer Notification Banner & Accept/Reject Actions */}
                        {isCountered && o.counter_price && (
                          <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-700/60 p-3.5 rounded-2xl space-y-2.5">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                              <div>
                                <span className="text-[10px] text-amber-800 dark:text-amber-300 uppercase font-black tracking-wider block">
                                  💬 किसान का नया काउंटर प्रस्ताव (Farmer's Counter Offer)
                                </span>
                                <div className="flex items-baseline space-x-2 mt-0.5">
                                  <span className="text-lg font-black text-amber-950 dark:text-amber-100">
                                    ₹{Number(o.counter_price).toLocaleString('en-IN')}/क्विंटल
                                  </span>
                                  <span className="text-xs text-amber-800 dark:text-amber-300 font-bold">
                                    (संशोधित कुल राशि: ₹{Number(counterTotal).toLocaleString('en-IN')})
                                  </span>
                                </div>
                              </div>

                              <span className="text-[11px] text-amber-900 dark:text-amber-200 font-semibold bg-amber-200/60 dark:bg-amber-900/60 px-2.5 py-1 rounded-lg self-start sm:self-auto">
                                किसान ने ₹{Number(o.counter_price).toLocaleString('en-IN')}/q का भाव माँगा है
                              </span>
                            </div>

                            <div className="flex items-center gap-2 pt-1 border-t border-amber-200/60 dark:border-amber-800/60">
                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => handleAcceptCounterOffer(o.id)}
                                className="flex-1 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-1.5 shadow touch-btn disabled:opacity-60 transition"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                <span>काउंटर स्वीकार करें (Accept ₹{Number(o.counter_price).toLocaleString('en-IN')})</span>
                              </button>

                              <button
                                type="button"
                                disabled={submitting}
                                onClick={() => handleRejectOffer(o.id)}
                                className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold py-2 px-3 rounded-xl text-xs flex items-center justify-center space-x-1 transition touch-btn disabled:opacity-60"
                              >
                                <XCircle className="w-4 h-4" />
                                <span>अस्वीकार करें (Reject)</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white dark:bg-darkbg-surface p-8 rounded-3xl border border-gray-200 dark:border-darkbg-border text-center text-xs text-gray-500 dark:text-darkbg-muted">
                  अभी तक कोई प्रस्ताव नहीं भेजा गया है।
                </div>
              )}
            </div>
          )}

          {/* TAB 4: BUYER ORDERS & STATUS UPDATE */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              {orders.length > 0 ? (
                orders.map(order => (
                  <OrderTracker
                    key={order.id}
                    order={order}
                    onOrderUpdated={loadAllData}
                  />
                ))
              ) : (
                <div className="bg-white dark:bg-darkbg-surface p-8 rounded-3xl border border-gray-200 dark:border-darkbg-border text-center text-xs text-gray-500 dark:text-darkbg-muted">
                  अभी कोई सक्रिय ऑर्डर नहीं है।
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Post Requirement Modal */}
      {reqModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkbg-surface max-w-md w-full p-5 sm:p-6 rounded-3xl space-y-4 shadow-2xl border border-gray-200 dark:border-darkbg-border animate-in fade-in transition-colors">
            <h3 className="text-base font-black text-gray-900 dark:text-white">
              {t('post_requirement_btn')}
            </h3>

            <form onSubmit={handleCreateRequirement} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">फसल चुनें</label>
                <select
                  value={newReq.commodity_id}
                  onChange={(e) => setNewReq({ ...newReq, commodity_id: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-xl text-xs font-bold text-gray-900 dark:text-white outline-none"
                >
                  {commodities.map(c => (
                    <option key={c.id} value={c.id} className="dark:bg-darkbg-card">{c.name_hi} ({c.name_en})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">मांग मात्रा (क्विंटल)</label>
                  <input
                    type="number"
                    required
                    value={newReq.quantity_max}
                    onChange={(e) => setNewReq({ ...newReq, quantity_max: e.target.value })}
                    placeholder="200"
                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">अधिकतम भाव (₹/क्विंटल)</label>
                  <input
                    type="number"
                    required
                    value={newReq.price_max}
                    onChange={(e) => setNewReq({ ...newReq, price_max: e.target.value })}
                    placeholder="2450"
                    className="w-full px-3.5 py-2 bg-gray-50 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-xl text-sm font-bold text-gray-900 dark:text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">अपेक्षित गुणवत्ता</label>
                <select
                  value={newReq.quality_grade}
                  onChange={(e) => setNewReq({ ...newReq, quality_grade: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-xl text-xs font-bold text-gray-900 dark:text-white outline-none"
                >
                  <option value="A" className="dark:bg-darkbg-card">Grade A (उत्तम)</option>
                  <option value="B" className="dark:bg-darkbg-card">Grade B (मध्यम)</option>
                  <option value="any" className="dark:bg-darkbg-card">कोई भी (Any)</option>
                </select>
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="pickup"
                  checked={newReq.pickup_available}
                  onChange={(e) => setNewReq({ ...newReq, pickup_available: e.target.checked })}
                  className="w-4 h-4 text-krishi-600 rounded"
                />
                <label htmlFor="pickup" className="text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer">
                  खेत से पिकअप की सुविधा उपलब्ध है (Farm Pickup Available)
                </label>
              </div>

              <div className="flex items-center space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setReqModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-darkbg-card text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs touch-btn"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-krishi-600 hover:bg-krishi-700 text-white font-black rounded-xl text-xs shadow touch-btn disabled:opacity-60 transition"
                >
                  {submitting ? 'दर्ज हो रहा है...' : 'मांग दर्ज करें'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Make Offer Modal */}
      {offerModalOpen && selectedLot && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkbg-surface max-w-md w-full p-5 sm:p-6 rounded-3xl space-y-4 shadow-2xl border border-gray-200 dark:border-darkbg-border animate-in fade-in transition-colors">
            <h3 className="text-base font-black text-gray-900 dark:text-white">
              💰 {t('make_offer_btn')}
            </h3>

            <div className="bg-krishi-50 dark:bg-darkbg-card p-3.5 rounded-2xl border border-krishi-200 dark:border-darkbg-border text-xs">
              <span className="text-gray-500 dark:text-darkbg-muted font-bold block">किसान की फसल:</span>
              <span className="text-sm font-black text-gray-950 dark:text-white">
                {selectedLot.commodity_name_hi} — {selectedLot.quantity} क्विंटल (Grade {selectedLot.quality_grade})
              </span>
              <p className="text-gray-600 dark:text-darkbg-muted mt-0.5">📍 {selectedLot.farmer_district || 'भोपाल'} • अपेक्षित: ₹{selectedLot.expected_price}/क्विंटल</p>
            </div>

            <form onSubmit={handleSendOffer} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
                  प्रस्तावित भाव (₹ / क्विंटल) *
                </label>
                <input
                  type="number"
                  required
                  value={offerPrice}
                  onChange={(e) => setOfferPrice(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-xl text-xl font-black text-gray-950 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none"
                />
              </div>

              <div className="bg-gray-50 dark:bg-darkbg-card p-3 rounded-2xl text-xs flex items-center justify-between border border-gray-100 dark:border-darkbg-border">
                <span className="text-gray-600 dark:text-darkbg-muted font-bold">कुल देय राशि:</span>
                <span className="text-base font-black text-krishi-700 dark:text-kisan-gold">
                  ₹{(Number(offerPrice || 0) * Number(selectedLot.quantity)).toLocaleString('en-IN')}
                </span>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="pickupOffer"
                  checked={pickupOffered}
                  onChange={(e) => setPickupOffered(e.target.checked)}
                  className="w-4 h-4 text-krishi-600 rounded"
                />
                <label htmlFor="pickupOffer" className="text-xs font-bold text-gray-800 dark:text-gray-200 cursor-pointer">
                  खेत से पिकअप हमारी तरफ से (Pickup included)
                </label>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">किसान के लिए संदेश / शर्तें</label>
                <input
                  type="text"
                  value={offerNotes}
                  onChange={(e) => setOfferNotes(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-xl text-xs font-medium text-gray-900 dark:text-white outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setOfferModalOpen(false)}
                  className="flex-1 py-2.5 bg-gray-100 dark:bg-darkbg-card text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs touch-btn"
                >
                  रद्द करें
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-krishi-600 hover:bg-krishi-700 text-white font-black rounded-xl text-xs shadow touch-btn disabled:opacity-60 transition"
                >
                  {submitting ? 'भेजा जा रहा है...' : 'प्रस्ताव भेजें ✅'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
