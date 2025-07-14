'use client';

import { MarketData } from '@/types/fintech';

interface MarketOverviewProps {
  marketData: MarketData[];
  loading: boolean;
  symbols: string[];
}

export function MarketOverview({ marketData, loading, symbols }: MarketOverviewProps) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="loading-spinner h-8 w-8 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading market data...</p>
      </div>
    );
  }

  if (marketData.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400 mb-4">No market data available</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Request market data for symbols: {symbols.join(', ')}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {marketData.map((data) => (
          <div key={data.symbol} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-semibold text-lg">{data.symbol}</h3>
              <span className={`text-sm font-medium ${data.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                {data.change >= 0 ? '+' : ''}{data.changePercent.toFixed(2)}%
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Price</span>
                <span className="text-sm font-medium">${data.price.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Change</span>
                <span className={`text-sm font-medium ${data.change >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {data.change >= 0 ? '+' : ''}${data.change.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Volume</span>
                <span className="text-sm font-medium">{data.volume.toLocaleString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 