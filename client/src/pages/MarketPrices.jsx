import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { MarketService } from '../services/marketService';
import CommoditySelector from '../components/common/CommoditySelector';
import PriceCard from '../components/common/PriceCard';
import PriceForecastChart from '../components/common/PriceForecastChart';
import LoadingSpinner from '../components/common/LoadingSpinner';
import MandiMap from '../components/common/MandiMap';
import { TrendingUp, Award, MapPin, Sparkles, Filter, Map } from 'lucide-react';

export default function MarketPrices() {
  const { t, lang } = useLanguage();
  const [searchParams] = useSearchParams();

  const [commodities, setCommodities] = useState([]);
  const [mandis, setMandis] = useState([]);
  const [selectedCommodity, setSelectedCommodity] = useState(null);
  const [selectedMandi, setSelectedMandi] = useState('');
  const [prices, setPrices] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'map'

  // Load commodities and mandis on mount
  useEffect(() => {
    async function loadMasterData() {
      try {
        const [commList, mandiList] = await Promise.all([
          MarketService.getCommodities(),
          MarketService.getMandis()
        ]);
        setCommodities(commList || []);
        setMandis(mandiList || []);

        if (commList && commList.length > 0) {
          setSelectedCommodity(commList[0].id);
        }
      } catch (err) {
        console.error('Failed to load market master data', err);
      } finally {
        setLoading(false);
      }
    }
    loadMasterData();
  }, []);

  // Fetch prices & comparison when selected commodity or mandi changes
  useEffect(() => {
    if (!selectedCommodity) return;

    async function loadPriceData() {
      setLoading(true);
      try {
        const [pricesList, compResult] = await Promise.all([
          MarketService.getPrices(selectedCommodity, selectedMandi || null),
          MarketService.comparePrices(selectedCommodity)
        ]);
        setPrices(pricesList || []);
        setComparison(compResult || null);
      } catch (err) {
        console.error('Failed to load prices', err);
      } finally {
        setLoading(false);
      }
    }
    loadPriceData();
  }, [selectedCommodity, selectedMandi]);

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto py-2 sm:py-4">
      {/* Page Title & Context */}
      <div className="bg-white dark:bg-darkbg-surface p-4 sm:p-5 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🌾</span>
            <h2 className="text-lg sm:text-xl font-black text-gray-950 dark:text-white tracking-tight">
              {t('market_title')}
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-darkbg-muted font-medium mt-0.5">
            {t('market_subtitle')}
          </p>
        </div>

        {/* View mode toggle (List vs Map) */}
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-darkbg-card p-1 rounded-2xl border border-gray-200 dark:border-darkbg-border shrink-0 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              viewMode === 'list'
                ? 'bg-white dark:bg-krishi-700 text-krishi-800 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-darkbg-muted hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            📋 सूची (List)
          </button>
          <button
            type="button"
            onClick={() => setViewMode('map')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              viewMode === 'map'
                ? 'bg-white dark:bg-krishi-700 text-krishi-800 dark:text-white shadow-xs'
                : 'text-gray-600 dark:text-darkbg-muted hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>🗺️ नक्शा (Map)</span>
          </button>
        </div>
      </div>

      {/* 🌾 1. Commodity Selector (Icon Grid) */}
      <div className="bg-white dark:bg-darkbg-surface p-4 sm:p-5 rounded-3xl border border-gray-200 dark:border-darkbg-border shadow-sm transition-colors">
        <CommoditySelector
          commodities={commodities}
          selectedId={selectedCommodity}
          onSelect={(id) => setSelectedCommodity(id)}
        />
      </div>

      {/* 🌟 2. Mandi Price Spread Comparison Alert */}
      {comparison && comparison.price_gap_per_quintal > 0 && (
        <div className="bg-gradient-to-r from-emerald-600 to-krishi-800 dark:from-darkbg-card dark:to-darkbg-surface text-white p-4 sm:p-5 rounded-3xl shadow-md space-y-2 border border-emerald-500 dark:border-emerald-600/50 transition-colors">
          <div className="flex items-center space-x-1.5 text-kisan-gold text-xs font-black uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>{t('price_difference_alert')} (Market Opportunity)</span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
            <div>
              <p className="text-sm sm:text-base font-bold leading-snug">
                🏆 {comparison.highest_mandi?.name} में सबसे अधिक भाव{' '}
                <span className="underline font-black text-kisan-gold">
                  ₹{Number(comparison.highest_mandi?.price || 0).toLocaleString('en-IN')}/{t('quintal')}
                </span>
              </p>
              <p className="text-xs text-krishi-100 dark:text-darkbg-muted mt-0.5">
                न्यूनतम मंडी ({comparison.lowest_mandi?.name}: ₹{comparison.lowest_mandi?.price}) से{' '}
                <strong className="text-white font-black">+₹{comparison.price_gap_per_quintal}/क्विंटल</strong> का भारी अंतर!
              </p>
            </div>

            <div className="bg-white/10 dark:bg-darkbg-card/80 backdrop-blur-md px-3.5 py-2 rounded-2xl text-center shrink-0 border border-white/20 dark:border-darkbg-border">
              <span className="text-[10px] text-krishi-100 dark:text-darkbg-muted block uppercase font-bold">संभावित अतिरिक्त लाभ</span>
              <span className="text-lg font-black text-kisan-gold">
                +₹{(comparison.price_gap_per_quintal * 50).toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-krishi-100 dark:text-darkbg-muted block font-semibold">(50 क्विंटल पर)</span>
            </div>
          </div>
        </div>
      )}

      {/* 🔍 3. Filter by Mandi */}
      <div className="flex items-center space-x-2 bg-white dark:bg-darkbg-surface p-3 sm:p-3.5 rounded-2xl border border-gray-200 dark:border-darkbg-border shadow-sm transition-colors">
        <Filter className="w-4 h-4 text-gray-400 dark:text-gray-500 shrink-0 ml-1" />
        <select
          value={selectedMandi}
          onChange={(e) => setSelectedMandi(e.target.value)}
          className="w-full bg-transparent text-xs sm:text-sm font-bold text-gray-800 dark:text-gray-200 outline-none cursor-pointer"
        >
          <option value="" className="dark:bg-darkbg-card">{t('select_mandi')}</option>
          {mandis.map(m => (
            <option key={m.id} value={m.id} className="dark:bg-darkbg-card">
              {lang === 'hi' ? m.name_hi : m.name_en} ({m.state})
            </option>
          ))}
        </select>
      </div>

      {/* View Mode: Map vs List */}
      {viewMode === 'map' ? (
        <MandiMap selectedCommodityId={selectedCommodity} />
      ) : (
        /* 📊 4. Price Cards List */
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-black text-gray-500 dark:text-darkbg-muted uppercase tracking-wider">
              मंडियों के वर्तमान भाव ({prices.length})
            </span>
            <span className="text-[11px] text-gray-400 dark:text-gray-500">
              दैनिक अपडेटेड
            </span>
          </div>

          {loading ? (
            <LoadingSpinner />
          ) : prices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {prices.map((price, idx) => (
                <PriceCard
                  key={price.id || idx}
                  price={price}
                  isBestPrice={idx === 0 && !selectedMandi}
                />
              ))}
            </div>
          ) : (
            <div className="bg-white dark:bg-darkbg-surface p-8 rounded-3xl border border-gray-200 dark:border-darkbg-border text-center space-y-2">
              <span className="text-3xl">🌾</span>
              <p className="text-sm font-bold text-gray-700 dark:text-gray-300">{t('no_prices_found')}</p>
              <p className="text-xs text-gray-500 dark:text-darkbg-muted">कृपया कोई अन्य फसल या मंडी चुनें।</p>
            </div>
          )}
        </div>
      )}

      {/* 📈 5. Phase 3 Price Forecast Chart */}
      <PriceForecastChart commodityId={selectedCommodity} horizonDays={15} />
    </div>
  );
}
