import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { TradingService } from '../../services/tradingService';
import { ShieldCheck, CheckCircle2, XCircle, MessageSquare, Truck, ArrowRight, ExternalLink, AlertCircle, RefreshCw } from 'lucide-react';

export default function OfferComparisonView({ offers = [], onOfferUpdated }) {
  const { t, lang } = useLanguage();
  const navigate = useNavigate();

  // Modals & Action State
  const [confirmAcceptModal, setConfirmAcceptModal] = useState(null); // offer object
  const [confirmRejectModal, setConfirmRejectModal] = useState(null); // offer object
  const [counterModalOpen, setCounterModalOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [counterPrice, setCounterPrice] = useState('');
  const [loadingOfferId, setLoadingOfferId] = useState(null);
  const [actionMessage, setActionMessage] = useState(null);
  const [createdOrder, setCreatedOrder] = useState(null);

  const handleAcceptConfirm = async () => {
    if (!confirmAcceptModal) return;
    const offerId = confirmAcceptModal.id;
    setLoadingOfferId(offerId);
    setActionMessage(null);
    try {
      const res = await TradingService.acceptOffer(offerId);
      const order = res?.order || null;
      setCreatedOrder(order);
      setActionMessage({
        type: 'success',
        text: 'प्रस्ताव सफलतापूर्वक स्वीकार कर लिया गया है! डिजिटल ऑर्डर तैयार हो गया है।'
      });
      setConfirmAcceptModal(null);
      if (onOfferUpdated) onOfferUpdated();
    } catch (err) {
      console.error('Accept offer failed:', err);
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'प्रस्ताव स्वीकार करने में त्रुटि हुई'
      });
    } finally {
      setLoadingOfferId(null);
    }
  };

  const handleRejectConfirm = async () => {
    if (!confirmRejectModal) return;
    const offerId = confirmRejectModal.id;
    setLoadingOfferId(offerId);
    setActionMessage(null);
    try {
      await TradingService.rejectOffer(offerId);
      setActionMessage({
        type: 'info',
        text: 'प्रस्ताव अस्वीकार कर दिया गया है।'
      });
      setConfirmRejectModal(null);
      if (onOfferUpdated) onOfferUpdated();
    } catch (err) {
      console.error('Reject offer failed:', err);
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'प्रस्ताव अस्वीकार करने में त्रुटि हुई'
      });
    } finally {
      setLoadingOfferId(null);
    }
  };

  const handleOpenCounter = (offer) => {
    setSelectedOffer(offer);
    setCounterPrice(offer?.offered_price ? String(Number(offer.offered_price) + 50) : '2500');
    setCounterModalOpen(true);
  };

  const handleSendCounter = async () => {
    if (!counterPrice || Number(counterPrice) <= 0 || !selectedOffer) return;
    setLoadingOfferId(selectedOffer.id);
    try {
      await TradingService.counterOffer(selectedOffer.id, counterPrice);
      setCounterModalOpen(false);
      setActionMessage({
        type: 'success',
        text: `काउंटर भाव ₹${Number(counterPrice).toLocaleString('en-IN')}/क्विंटल सफलतापूर्वक भेजा गया!`
      });
      if (onOfferUpdated) onOfferUpdated();
    } catch (err) {
      console.error('Counter offer failed:', err);
      setActionMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || 'काउंटर ऑफर भेजने में त्रुटि हुई'
      });
    } finally {
      setLoadingOfferId(null);
    }
  };

  if (!offers || offers.length === 0) {
    return (
      <div className="bg-white dark:bg-darkbg-surface p-8 rounded-3xl border border-gray-200 dark:border-darkbg-border text-center space-y-2 transition-colors">
        <span className="text-4xl">📬</span>
        <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">{t('no_offers_yet')}</h4>
        <p className="text-xs text-gray-500 dark:text-darkbg-muted">
          खरीदारों द्वारा भेजा जाने वाला प्रत्येक डिजिटल प्रस्ताव यहां तुरंत दिखाई देगा।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white flex items-center gap-1.5">
          <span>💼</span> {t('offers_received_title')} ({offers.length})
        </h3>
      </div>

      {actionMessage && (
        <div className={`p-4 rounded-2xl text-xs font-bold space-y-2 ${
          actionMessage.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-900 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800' :
          actionMessage.type === 'error' ? 'bg-red-50 dark:bg-red-950/60 text-red-900 dark:text-red-200 border border-red-300 dark:border-red-800' :
          'bg-gray-100 dark:bg-darkbg-card text-gray-900 dark:text-gray-200 border border-gray-300 dark:border-darkbg-border'
        }`}>
          <div className="flex items-center space-x-2">
            {actionMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />}
            <span>{actionMessage.text}</span>
          </div>

          {createdOrder && (
            <div className="pt-2">
              <Link
                to={`/orders/${createdOrder.id}`}
                className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs touch-btn shadow"
              >
                <span>📦 ऑर्डर ट्रैकिंग देखें (View Order)</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Offers List */}
      <div className="space-y-3.5">
        {offers.map((offer, idx) => {
          const isPending = offer?.status === 'pending';
          const isCountered = offer?.status === 'countered';
          const isAccepted = offer?.status === 'accepted';
          const isRejected = offer?.status === 'rejected';
          const isLoadingThis = loadingOfferId === offer?.id;

          return (
            <div
              key={offer?.id || idx}
              className={`p-4 sm:p-5 rounded-3xl bg-white dark:bg-darkbg-surface border transition-all duration-150 relative ${
                isAccepted
                  ? 'border-2 border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 shadow-sm'
                  : isRejected
                  ? 'border-gray-200 dark:border-darkbg-border bg-gray-50/60 dark:bg-darkbg-card/40 opacity-75'
                  : isPending
                  ? 'border-krishi-400 dark:border-krishi-600/70 shadow-sm'
                  : 'border-amber-300 dark:border-amber-700/60 bg-amber-50/20 dark:bg-amber-950/20'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-1.5">
                    <h4 className="text-base font-black text-gray-950 dark:text-white">
                      {offer?.business_name || offer?.buyer_name || 'शर्मा ट्रेडर्स'}
                    </h4>
                    {offer?.buyer_verified && (
                      <ShieldCheck className="w-4 h-4 text-krishi-600 dark:text-kisan-gold shrink-0" title="सत्यापित खरीदार" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">
                    📍 {offer?.buyer_district || 'इंदौर'} • {offer?.payment_terms === 'on_delivery' ? 'डिलीवरी पर तुरंत भुगतान (Payment on Delivery)' : '7 दिन के भीतर भुगतान'}
                  </p>
                </div>

                {/* Status Badge */}
                <div>
                  <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full ${
                    isAccepted ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' :
                    isCountered ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800' :
                    isRejected ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800' :
                    'bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                  }`}>
                    {offer?.status === 'accepted' ? 'स्वीकृत (ACCEPTED)' :
                     offer?.status === 'countered' ? 'काउंटर लंबित (COUNTERED)' :
                     offer?.status === 'rejected' ? 'अस्वीकृत (REJECTED)' :
                     'लंबित (PENDING)'}
                  </span>
                </div>
              </div>

              {/* Offer Numbers */}
              <div className="mt-3 pt-2.5 border-t border-gray-100 dark:border-darkbg-border grid grid-cols-2 gap-2.5 text-xs">
                <div className="bg-gray-50 dark:bg-darkbg-card p-2.5 rounded-2xl border border-gray-100 dark:border-darkbg-border">
                  <span className="text-gray-500 dark:text-darkbg-muted font-bold block text-[10px]">प्रस्तावित भाव</span>
                  <span className="text-lg sm:text-xl font-black text-gray-950 dark:text-white">
                    ₹{Number(offer?.offered_price || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-darkbg-muted font-medium block">/ क्विंटल</span>
                </div>

                <div className="bg-gray-50 dark:bg-darkbg-card p-2.5 rounded-2xl border border-gray-100 dark:border-darkbg-border">
                  <span className="text-gray-500 dark:text-darkbg-muted font-bold block text-[10px]">कुल राशि</span>
                  <span className="text-lg sm:text-xl font-black text-krishi-700 dark:text-kisan-gold">
                    ₹{Number(offer?.total_amount || 0).toLocaleString('en-IN')}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-darkbg-muted font-medium block">
                    {offer?.pickup_offered ? '🚚 पिकअप शामिल' : 'खेत से उठान'}
                  </span>
                </div>
              </div>

              {/* Notes / Counter info */}
              {isCountered && offer?.counter_price && (
                <div className="mt-2.5 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-2.5 rounded-2xl text-xs text-amber-900 dark:text-amber-200 font-bold flex items-center justify-between">
                  <span>आपका काउंटर भाव: ₹{Number(offer.counter_price).toLocaleString('en-IN')}/क्विंटल</span>
                  <span className="text-[10px] bg-amber-200 dark:bg-amber-900/60 px-2 py-0.5 rounded-md">खरीदार के उत्तर की प्रतीक्षा</span>
                </div>
              )}

              {offer?.notes && (
                <p className="mt-2 text-xs text-gray-600 dark:text-gray-300 italic bg-gray-50 dark:bg-darkbg-card p-2.5 rounded-2xl border border-gray-100 dark:border-darkbg-border">
                  "{offer.notes}"
                </p>
              )}

              {/* Action Buttons for Farmer */}
              {(isPending || isCountered) && (
                <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-darkbg-border flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={isLoadingThis}
                    onClick={() => setConfirmAcceptModal(offer)}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 px-3 rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-1.5 shadow touch-btn disabled:opacity-60 transition"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isLoadingThis ? 'स्वीकार हो रहा है...' : '✅ स्वीकार करें (Accept)'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isLoadingThis}
                    onClick={() => handleOpenCounter(offer)}
                    className="bg-amber-500 hover:bg-amber-600 text-gray-950 font-black py-2.5 px-3.5 rounded-2xl text-xs sm:text-sm flex items-center justify-center space-x-1 shadow touch-btn transition"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>💬 काउंटर भाव (Counter)</span>
                  </button>

                  <button
                    type="button"
                    disabled={isLoadingThis}
                    onClick={() => setConfirmRejectModal(offer)}
                    className="bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-bold py-2.5 px-3 rounded-2xl text-xs flex items-center justify-center space-x-1 transition touch-btn disabled:opacity-60"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>❌ अस्वीकार करें (Reject)</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 🟢 Accept Confirmation Modal */}
      {confirmAcceptModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkbg-surface max-w-sm w-full p-5 sm:p-6 rounded-3xl space-y-4 shadow-2xl border border-gray-200 dark:border-darkbg-border animate-in fade-in transition-colors">
            <div className="flex items-center space-x-2 text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="w-6 h-6" />
              <h4 className="text-base font-black text-gray-950 dark:text-white">
                सौदा स्वीकार करें (Accept Offer)
              </h4>
            </div>

            <div className="bg-emerald-50 dark:bg-darkbg-card border border-emerald-200 dark:border-emerald-800 p-3.5 rounded-2xl text-xs space-y-1">
              <span className="text-gray-500 dark:text-darkbg-muted font-bold block">खरीदार:</span>
              <span className="text-sm font-black text-emerald-950 dark:text-white">
                {confirmAcceptModal.business_name || confirmAcceptModal.buyer_name}
              </span>
              <p className="text-emerald-800 dark:text-emerald-300 font-bold">
                भाव: ₹{Number(confirmAcceptModal.status === 'countered' && confirmAcceptModal.counter_price ? confirmAcceptModal.counter_price : confirmAcceptModal.offered_price).toLocaleString('en-IN')}/क्विंटल
              </p>
              <p className="text-gray-600 dark:text-darkbg-muted text-[11px]">
                स्वीकार करने पर डिजिटल ऑर्डर और अनुबंध स्वतः तैयार हो जाएगा।
              </p>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmAcceptModal(null)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-darkbg-card text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs touch-btn"
              >
                रद्द करें (Cancel)
              </button>
              <button
                type="button"
                disabled={loadingOfferId === confirmAcceptModal.id}
                onClick={handleAcceptConfirm}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs shadow-md touch-btn disabled:opacity-60 transition"
              >
                {loadingOfferId === confirmAcceptModal.id ? 'तैयार हो रहा है...' : 'हाँ, स्वीकार करें ✅'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🔴 Reject Confirmation Modal */}
      {confirmRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkbg-surface max-w-sm w-full p-5 sm:p-6 rounded-3xl space-y-4 shadow-2xl border border-gray-200 dark:border-darkbg-border animate-in fade-in transition-colors">
            <div className="flex items-center space-x-2 text-rose-700 dark:text-rose-400">
              <XCircle className="w-6 h-6" />
              <h4 className="text-base font-black text-gray-950 dark:text-white">
                प्रस्ताव अस्वीकार करें (Reject Offer)
              </h4>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300">
              क्या आप <strong>{confirmRejectModal.business_name || confirmRejectModal.buyer_name}</strong> द्वारा भेजे गए ₹{Number(confirmRejectModal.offered_price).toLocaleString('en-IN')}/क्विंटल के प्रस्ताव को अस्वीकार करना चाहते हैं?
            </p>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmRejectModal(null)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-darkbg-card text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs touch-btn"
              >
                वापस जाएं (Back)
              </button>
              <button
                type="button"
                disabled={loadingOfferId === confirmRejectModal.id}
                onClick={handleRejectConfirm}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md touch-btn disabled:opacity-60 transition"
              >
                {loadingOfferId === confirmRejectModal.id ? 'हो रहा है...' : 'अस्वीकार करें ❌'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 💬 Counter Offer Modal */}
      {counterModalOpen && selectedOffer && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-darkbg-surface max-w-sm w-full p-5 sm:p-6 rounded-3xl space-y-4 shadow-2xl border border-gray-200 dark:border-darkbg-border animate-in fade-in transition-colors">
            <h4 className="text-base font-black text-gray-900 dark:text-white">
              💬 काउंटर ऑफर दें (Counter Offer)
            </h4>
            <p className="text-xs text-gray-500 dark:text-darkbg-muted">
              {selectedOffer.business_name || selectedOffer.buyer_name} का भाव: ₹{Number(selectedOffer.offered_price).toLocaleString('en-IN')}/क्विंटल
            </p>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                {t('counter_price_prompt')}
              </label>
              <input
                type="number"
                value={counterPrice}
                onChange={(e) => setCounterPrice(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-xl text-xl font-black text-gray-950 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none"
              />
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setCounterModalOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-darkbg-card text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs touch-btn"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={loadingOfferId === selectedOffer.id}
                onClick={handleSendCounter}
                className="flex-1 py-2.5 bg-krishi-600 hover:bg-krishi-700 text-white font-black rounded-xl text-xs shadow-md touch-btn disabled:opacity-60 transition"
              >
                {loadingOfferId === selectedOffer.id ? 'भेजा जा रहा है...' : t('send_counter_btn')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
