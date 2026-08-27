import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { MarketService } from '../services/marketService';
import LotCreationWizard from '../components/farmer/LotCreationWizard';
import LoadingSpinner from '../components/common/LoadingSpinner';

export default function CreateLot() {
  const { t } = useLanguage();
  const [commodities, setCommodities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCommodities() {
      try {
        const commList = await MarketService.getCommodities();
        setCommodities(commList);
      } catch (err) {
        console.error('Failed to load commodities', err);
      } finally {
        setLoading(false);
      }
    }
    loadCommodities();
  }, []);

  if (loading) {
    return <LoadingSpinner message="फसल सूची लोड हो रही है..." />;
  }

  return (
    <div className="py-2 sm:py-4">
      <LotCreationWizard commodities={commodities} />
    </div>
  );
}
