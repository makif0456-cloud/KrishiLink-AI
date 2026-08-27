import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '../../contexts/AuthContext';
import { TradingService } from '../../services/tradingService';
import CommoditySelector from '../common/CommoditySelector';
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck, MapPin, Scale, Sparkles, AlertTriangle } from 'lucide-react';

export default function LotCreationWizard({ commodities = [] }) {
  const { t, lang } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [commodityId, setCommodityId] = useState(commodities[0]?.id || 'b0000000-0000-0000-0000-000000000001');
  const [quantity, setQuantity] = useState('100');
  const [qualityGrade, setQualityGrade] = useState('A');
  const [expectedPrice, setExpectedPrice] = useState('2500');
  const [village, setVillage] = useState(user?.village || 'बैरसिया');
  const [district, setDistrict] = useState(user?.district || 'भोपाल');
  const [state, setState] = useState(user?.state || 'Madhya Pradesh');
  const [notes, setNotes] = useState('ताजा सूखा और साफ दाना (Clean & dry harvested produce)');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectedCrop = (commodities || []).find(c => c.id === commodityId) || commodities[0] || { name_hi: 'गेहूं', name_en: 'Wheat', icon: '🌾' };

  const handleNext = () => {
    setError(null);
    if (step === 2 && (!quantity || Number(quantity) <= 0)) {
      setError('कृपया मान्य मात्रा दर्ज करें (Please enter a valid quantity)');
      return;
    }
    setStep(prev => Math.min(prev + 1, 5));
  };

  const handlePrev = () => {
    setError(null);
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    try {
      const createdLot = await TradingService.createLot({
        commodity_id: commodityId,
        quantity: Number(quantity),
        unit: 'quintal',
        quality_grade: qualityGrade,
        expected_price: expectedPrice ? Number(expectedPrice) : null,
        latitude: district.includes('भोपाल') ? 23.6341 : 26.8467,
        longitude: district.includes('भोपाल') ? 77.4338 : 80.9462,
        notes
      });
      navigate(`/my-lots/${createdLot.id}`);
    } catch (err) {
      setError(err.response?.data?.message || err.message || t('error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
      {/* Step Progress Bar */}
      <div className="bg-white dark:bg-darkbg-surface p-4 sm:p-5 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm space-y-2.5 transition-colors">
        <div className="flex items-center justify-between text-xs font-black text-gray-700 dark:text-gray-200">
          <span>{t('wizard_title')}</span>
          <span className="bg-krishi-100 dark:bg-krishi-900/60 text-krishi-800 dark:text-krishi-300 px-2.5 py-0.5 rounded-full font-mono border border-krishi-200 dark:border-krishi-800">
            स्टेप {step} / 5
          </span>
        </div>
        
        {/* Visual Progress Line */}
        <div className="w-full bg-gray-100 dark:bg-darkbg-card h-2.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-krishi-600 to-krishi-500 h-full transition-all duration-300 rounded-full"
            style={{ width: `${(step / 5) * 100}%` }}
          ></div>
        </div>

        {/* Step indicators */}
        <div className="grid grid-cols-5 text-center text-[10px] font-bold text-gray-400 dark:text-darkbg-muted pt-1">
          <span className={step >= 1 ? 'text-krishi-700 dark:text-kisan-gold font-black' : ''}>1. फसल</span>
          <span className={step >= 2 ? 'text-krishi-700 dark:text-kisan-gold font-black' : ''}>2. मात्रा</span>
          <span className={step >= 3 ? 'text-krishi-700 dark:text-kisan-gold font-black' : ''}>3. गुणवत्ता</span>
          <span className={step >= 4 ? 'text-krishi-700 dark:text-kisan-gold font-black' : ''}>4. जगह</span>
          <span className={step >= 5 ? 'text-krishi-700 dark:text-kisan-gold font-black' : ''}>5. पुष्टि</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs p-4 rounded-2xl border border-red-200 dark:border-red-800 font-bold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Wizard Body Card */}
      <div className="bg-white dark:bg-darkbg-surface p-5 sm:p-6 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-md space-y-5 min-h-[380px] flex flex-col justify-between transition-colors">
        {/* STEP 1: SELECT COMMODITY */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                1. {t('step1_title')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">{t('step1_desc')}</p>
            </div>

            <CommoditySelector
              commodities={commodities}
              selectedId={commodityId}
              onSelect={(id) => setCommodityId(id)}
            />
          </div>
        )}

        {/* STEP 2: QUANTITY & PRICE */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                2. {t('step2_title')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">{t('step2_desc')}</p>
            </div>

            {/* Selected Crop Pill */}
            <div className="flex items-center space-x-2.5 bg-krishi-50 dark:bg-darkbg-card border border-krishi-200 dark:border-darkbg-border p-3 rounded-2xl">
              <span className="text-2xl">{selectedCrop.icon || '🌾'}</span>
              <div>
                <span className="text-[11px] text-gray-500 dark:text-darkbg-muted font-bold block">चुनी गई फसल:</span>
                <span className="text-sm font-black text-krishi-900 dark:text-white">
                  {lang === 'hi' ? selectedCrop.name_hi : selectedCrop.name_en}
                </span>
              </div>
            </div>

            {/* Large Quantity Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                मात्रा दर्ज करें (Quintals) *
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="100"
                  className="w-full px-4 py-3.5 bg-gray-50 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-2xl text-2xl font-black text-gray-950 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none transition"
                />
                <span className="bg-gray-100 dark:bg-darkbg-card text-gray-800 dark:text-gray-200 font-extrabold text-sm px-4 py-4 rounded-2xl border border-gray-200 dark:border-darkbg-border shrink-0">
                  क्विंटल
                </span>
              </div>
            </div>

            {/* Expected Price Input */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                अपेक्षित भाव (₹/क्विंटल) — वैकल्पिक
              </label>
              <input
                type="number"
                value={expectedPrice}
                onChange={(e) => setExpectedPrice(e.target.value)}
                placeholder="2500"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-2xl text-base font-bold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none transition"
              />
            </div>
          </div>
        )}

        {/* STEP 3: QUALITY GRADE */}
        {step === 3 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                3. {t('step3_title')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">{t('step3_desc')}</p>
            </div>

            {/* Quality Cards */}
            <div className="space-y-2.5">
              {[
                { id: 'A', title: t('grade_a_title'), desc: t('grade_a_desc'), stars: '⭐⭐⭐' },
                { id: 'B', title: t('grade_b_title'), desc: t('grade_b_desc'), stars: '⭐⭐' },
                { id: 'C', title: t('grade_c_title'), desc: t('grade_c_desc'), stars: '⭐' }
              ].map(g => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setQualityGrade(g.id)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between text-left transition touch-btn active:scale-98 ${
                    qualityGrade === g.id
                      ? 'bg-krishi-50 dark:bg-darkbg-card border-krishi-600 dark:border-krishi-400 shadow-sm ring-1 ring-krishi-400/40'
                      : 'bg-white dark:bg-darkbg-surface border-gray-200 dark:border-darkbg-border hover:bg-gray-50 dark:hover:bg-darkbg-card'
                  }`}
                >
                  <div className="flex-1 pr-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-base font-black text-gray-900 dark:text-white">{g.title}</span>
                      <span className="text-xs">{g.stars}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">{g.desc}</p>
                  </div>
                  {qualityGrade === g.id && (
                    <CheckCircle2 className="w-6 h-6 text-krishi-600 dark:text-kisan-gold shrink-0" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: LOCATION */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                4. {t('step4_title')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">{t('step4_desc')}</p>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">गांव / स्थान</label>
                <input
                  type="text"
                  value={village}
                  onChange={(e) => setVillage(e.target.value)}
                  placeholder="बैरसिया / खन्ना / लखनऊ"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">जिला</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="भोपाल / लखनऊ"
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">राज्य</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-4 py-2.5 bg-gray-50 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-xl text-sm font-bold text-gray-900 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">विवरण / नोट्स (वैकल्पिक)</label>
                <textarea
                  rows="2"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-darkbg-card border border-gray-300 dark:border-darkbg-border rounded-xl text-xs font-medium text-gray-900 dark:text-white focus:bg-white dark:focus:bg-darkbg-surface focus:border-krishi-600 outline-none"
                ></textarea>
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: REVIEW & CONFIRM */}
        {step === 5 && (
          <div className="space-y-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                5. {t('step5_title')}
              </h3>
              <p className="text-xs text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">{t('step5_desc')}</p>
            </div>

            {/* Summary Review Card */}
            <div className="bg-krishi-50/80 dark:bg-darkbg-card border border-krishi-300 dark:border-darkbg-border rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-krishi-200 dark:border-darkbg-border">
                <div className="flex items-center space-x-2.5">
                  <span className="text-3xl">{selectedCrop.icon || '🌾'}</span>
                  <div>
                    <span className="text-xs text-gray-500 dark:text-darkbg-muted font-bold block">फसल का नाम</span>
                    <span className="text-base font-black text-gray-900 dark:text-white">
                      {lang === 'hi' ? selectedCrop.name_hi : selectedCrop.name_en}
                    </span>
                  </div>
                </div>
                <span className="bg-krishi-600 text-white font-black text-xs px-3 py-1 rounded-full shadow-xs">
                  Grade {qualityGrade}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white dark:bg-darkbg-surface p-3 rounded-xl border border-gray-200 dark:border-darkbg-border">
                  <span className="text-gray-500 dark:text-darkbg-muted font-bold block">कुल मात्रा</span>
                  <span className="text-base font-black text-gray-900 dark:text-white">{quantity} क्विंटल</span>
                </div>
                <div className="bg-white dark:bg-darkbg-surface p-3 rounded-xl border border-gray-200 dark:border-darkbg-border">
                  <span className="text-gray-500 dark:text-darkbg-muted font-bold block">अपेक्षित भाव</span>
                  <span className="text-base font-black text-krishi-700 dark:text-kisan-gold">₹{expectedPrice}/क्विंटल</span>
                </div>
              </div>

              <div className="bg-white dark:bg-darkbg-surface p-3 rounded-xl border border-gray-200 dark:border-darkbg-border flex items-center space-x-2 text-xs text-gray-700 dark:text-gray-300">
                <MapPin className="w-4 h-4 text-krishi-600 dark:text-kisan-gold shrink-0" />
                <span>स्थान: <strong>{village}, {district} ({state})</strong></span>
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls Navigation Buttons */}
        <div className="pt-4 border-t border-gray-100 dark:border-darkbg-border flex items-center justify-between gap-3">
          {step > 1 ? (
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-3 bg-gray-100 dark:bg-darkbg-card hover:bg-gray-200 dark:hover:bg-darkbg-hover text-gray-800 dark:text-gray-200 font-bold rounded-xl text-sm flex items-center space-x-1 touch-btn"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>{t('back')}</span>
            </button>
          ) : (
            <div></div>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-3.5 bg-krishi-600 hover:bg-krishi-700 active:bg-krishi-800 text-white font-black rounded-2xl text-sm flex items-center space-x-2 shadow-md touch-btn ml-auto"
            >
              <span>{t('next')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleSubmit}
              className="px-6 py-4 bg-gradient-to-r from-krishi-600 to-krishi-700 hover:from-krishi-700 hover:to-krishi-800 active:scale-98 text-white font-black rounded-2xl text-sm sm:text-base flex items-center justify-center space-x-2 shadow-lg touch-btn w-full sm:w-auto ml-auto disabled:opacity-60 transition"
            >
              <span>{loading ? 'दर्ज हो रहा है...' : t('submit_lot_btn')}</span>
              <CheckCircle2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
