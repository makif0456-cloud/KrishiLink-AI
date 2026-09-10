import React, { useEffect, useState } from 'react';
import { IntelligenceService } from '../services/intelligenceService';

export default function MarketIntelligence() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMarketIntelligence = async () => {
      try {
        setLoading(true);

        const result =
          await IntelligenceService.getMarketIntelligence();

        setData(result);
      } catch (err) {
        console.error(
          'Market intelligence error:',
          err
        );

        setError(
          err.response?.data?.message ||
          'बाजार विश्लेषण प्राप्त नहीं हो सका।'
        );
      } finally {
        setLoading(false);
      }
    };

    loadMarketIntelligence();
  }, []);

  if (loading) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <div className="animate-pulse">
          <div className="mb-4 h-6 w-56 rounded bg-gray-200" />
          <div className="h-4 w-80 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
        <h3 className="font-semibold text-red-700">
          Market Intelligence Error
        </h3>

        <p className="mt-2 text-sm text-red-600">
          {error}
        </p>
      </div>
    );
  }

  if (!data || !data.ranked_crops?.length) {
    return (
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h3 className="text-lg font-semibold">
          📊 Market Intelligence
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          अभी पर्याप्त मंडी डेटा उपलब्ध नहीं है।
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">
          📊 Market Intelligence
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          विभिन्न फसलों और मंडियों के भाव का तुलनात्मक विश्लेषण
        </p>
      </div>


      {/* Top Market */}
      {data.ranked_crops[0] && (
        <div className="rounded-2xl border bg-white p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                🏆 Top Market Opportunity
              </p>

              <h3 className="mt-2 text-2xl font-bold">
                {data.ranked_crops[0].commodity_icon}{' '}
                {data.ranked_crops[0].commodity_name_hi}
              </h3>

              <p className="text-sm text-gray-500">
                {data.ranked_crops[0].commodity_name_en}
              </p>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500">
                Market Score
              </p>

              <p className="text-3xl font-bold">
                {data.ranked_crops[0].market_score}
                <span className="text-sm font-normal">
                  /100
                </span>
              </p>
            </div>

          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">

            <Stat
              label="Average Price"
              value={`₹${data.ranked_crops[0].average_price.toLocaleString('en-IN')}`}
            />

            <Stat
              label="Highest Price"
              value={`₹${data.ranked_crops[0].highest_price.toLocaleString('en-IN')}`}
            />

            <Stat
              label="Lowest Price"
              value={`₹${data.ranked_crops[0].lowest_price.toLocaleString('en-IN')}`}
            />

            <Stat
              label="Mandis"
              value={data.ranked_crops[0].mandi_count}
            />

          </div>

          <div className="mt-5 rounded-xl bg-gray-50 p-4">

            <p className="text-sm font-medium">
              Best Mandi
            </p>

            <p className="mt-1 text-lg font-semibold">
              {data.ranked_crops[0].best_mandi.name_hi}
            </p>

            <p className="text-sm text-gray-500">
              {data.ranked_crops[0].best_mandi.district},{' '}
              {data.ranked_crops[0].best_mandi.state}
            </p>

            <p className="mt-2 font-semibold">
              ₹
              {data.ranked_crops[0].best_mandi.price.toLocaleString(
                'en-IN'
              )}
              /क्विंटल
            </p>

          </div>

        </div>
      )}


      {/* Ranked Crops */}
      <div className="rounded-2xl border bg-white shadow-sm">

        <div className="border-b p-6">
          <h3 className="text-xl font-bold">
            🌾 Crop Market Ranking
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            {data.total_crops_analyzed} crops analyzed across{' '}
            {data.total_market_records_analyzed} market records
          </p>
        </div>


        <div className="divide-y">

          {data.ranked_crops.map((crop) => (
            <div
              key={crop.commodity_id}
              className="p-6 transition hover:bg-gray-50"
            >

              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">

                {/* Crop */}
                <div className="flex items-center gap-4">

                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 font-bold">
                    #{crop.rank}
                  </div>

                  <div className="text-3xl">
                    {crop.commodity_icon}
                  </div>

                  <div>
                    <h4 className="font-semibold">
                      {crop.commodity_name_hi}
                    </h4>

                    <p className="text-sm text-gray-500">
                      {crop.commodity_name_en}
                    </p>
                  </div>

                </div>


                {/* Score */}
                <div className="text-left md:text-right">

                  <p className="text-xs text-gray-500">
                    Market Score
                  </p>

                  <p className="text-2xl font-bold">
                    {crop.market_score}/100
                  </p>

                </div>

              </div>


              {/* Statistics */}
              <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">

                <MiniStat
                  label="Average"
                  value={`₹${crop.average_price.toLocaleString('en-IN')}`}
                />

                <MiniStat
                  label="Highest"
                  value={`₹${crop.highest_price.toLocaleString('en-IN')}`}
                />

                <MiniStat
                  label="Lowest"
                  value={`₹${crop.lowest_price.toLocaleString('en-IN')}`}
                />

                <MiniStat
                  label="Spread"
                  value={`₹${crop.price_spread.toLocaleString('en-IN')}`}
                />

                <MiniStat
                  label="Mandis"
                  value={crop.mandi_count}
                />

              </div>


              {/* Best Mandi */}
              <div className="mt-4 rounded-xl bg-gray-50 p-4">

                <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">

                  <div>
                    <p className="text-xs text-gray-500">
                      Best Mandi
                    </p>

                    <p className="font-semibold">
                      {crop.best_mandi.name_hi}
                    </p>

                    <p className="text-xs text-gray-500">
                      {crop.best_mandi.district},{' '}
                      {crop.best_mandi.state}
                    </p>
                  </div>

                  <div className="text-left md:text-right">

                    <p className="text-xs text-gray-500">
                      Best Price
                    </p>

                    <p className="font-bold">
                      ₹
                      {crop.best_mandi.price.toLocaleString(
                        'en-IN'
                      )}
                      /क्विंटल
                    </p>

                  </div>

                </div>

              </div>


              {/* Analysis */}
              <p className="mt-4 text-sm text-gray-600">
                💡 {crop.price_analysis}
              </p>

            </div>
          ))}

        </div>
      </div>


      {/* Methodology */}
      <div className="rounded-xl border bg-gray-50 p-5">

        <h4 className="font-semibold">
          ℹ️ Analysis Method
        </h4>

        <p className="mt-2 text-sm text-gray-600">
          Market Score में average price, mandi coverage और
          price stability को ध्यान में रखा गया है।
        </p>

        {data.is_demo_data && (
          <p className="mt-3 text-xs text-gray-500">
            {data.disclaimer}
          </p>
        )}

      </div>

    </div>
  );
}


// ------------------------------------------------------------
// Small reusable components
// ------------------------------------------------------------

function Stat({ label, value }) {
  return (
    <div className="rounded-xl bg-gray-50 p-4">
      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold">
        {value}
      </p>
    </div>
  );
}


function MiniStat({ label, value }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-xs text-gray-500">
        {label}
      </p>

      <p className="mt-1 font-semibold">
        {value}
      </p>
    </div>
  );
}
