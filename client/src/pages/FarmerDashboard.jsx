import React from 'react';
import FarmerHome from '../components/farmer/FarmerHome';
import MarketIntelligence from '../components/farmer/MarketIntelligence';

export default function FarmerDashboard() {
  return (
    <div className="py-2 sm:py-4 space-y-6">
      <FarmerHome />

      <MarketIntelligence />
    </div>
  );
}
