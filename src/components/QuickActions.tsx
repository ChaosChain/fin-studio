'use client';

import { useState } from 'react';
import { useApp } from '@/app/providers';

interface QuickActionsProps {
  selectedSymbols: string[];
  onSymbolsChange: (symbols: string[]) => void;
}

export function QuickActions({ selectedSymbols, onSymbolsChange }: QuickActionsProps) {
  const { requestMarketData, requestDailyInsights, loading } = useApp();
  const [customSymbol, setCustomSymbol] = useState('');

  const handleAddSymbol = () => {
    if (customSymbol && !selectedSymbols.includes(customSymbol.toUpperCase())) {
      onSymbolsChange([...selectedSymbols, customSymbol.toUpperCase()]);
      setCustomSymbol('');
    }
  };

  const handleRemoveSymbol = (symbol: string) => {
    onSymbolsChange(selectedSymbols.filter(s => s !== symbol));
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-medium mb-3">Selected Symbols</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {selectedSymbols.map((symbol) => (
            <span
              key={symbol}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400"
            >
              {symbol}
              <button
                onClick={() => handleRemoveSymbol(symbol)}
                className="ml-2 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customSymbol}
            onChange={(e) => setCustomSymbol(e.target.value)}
            placeholder="Add symbol (e.g., NVDA)"
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-slate-800 text-gray-900 dark:text-white text-sm"
          />
          <button
            onClick={handleAddSymbol}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            Add
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <button
          onClick={() => requestMarketData(selectedSymbols)}
          disabled={loading || selectedSymbols.length === 0}
          className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="mr-2">📊</span>
          Get Market Data
        </button>

        <button
          onClick={() => requestDailyInsights(selectedSymbols)}
          disabled={loading || selectedSymbols.length === 0}
          className="flex items-center justify-center px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="mr-2">🧠</span>
          Generate Insights
        </button>
      </div>
    </div>
  );
} 