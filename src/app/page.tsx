'use client';

import { useEffect, useState } from 'react';
import { useApp } from './providers';
import { AgentStatus } from '@/components/AgentStatus';
import { MarketOverview } from '@/components/MarketOverview';
import { InsightsFeed } from '@/components/InsightsFeed';
import { QuickActions } from '@/components/QuickActions';
import { WelcomeHero } from '@/components/WelcomeHero';
import { ConnectionStatus } from '@/components/ConnectionStatus';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { AgentWorkflow } from '@/components/AgentWorkflow';

export default function HomePage() {
  const { isConnected, agents, marketData, dailyInsights, loading, error } = useApp();
  const [selectedSymbols, setSelectedSymbols] = useState<string[]>(['AAPL', 'GOOGL', 'MSFT', 'TSLA']);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold gradient-text mb-2">
                  Fin Studio
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-lg">
                  AI-Powered Investment Analysis Platform
                </p>
              </div>
              <div className="flex items-center gap-4">
                <a
                  href="/dashboard"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-purple-600 bg-purple-100 rounded-lg hover:bg-purple-200 transition-colors"
                >
                  🤖 Agent Dashboard
                </a>
                <a
                  href="/demo"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
                >
                  💳 Payment Demo
                </a>
              </div>
              <ConnectionStatus />
            </div>
          </div>

          {/* Welcome Section */}
          {!isConnected && (
            <WelcomeHero />
          )}

          {/* Main Dashboard */}
          {isConnected && (
            <div className="space-y-8">
              {/* Agent Status Overview */}
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-4">Agent Status</h2>
                <AgentStatus agents={agents} />
              </div>

              {/* Agent Workflow Demo */}
              <AgentWorkflow />

              {/* Quick Actions */}
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
                <QuickActions 
                  selectedSymbols={selectedSymbols} 
                  onSymbolsChange={setSelectedSymbols} 
                />
              </div>

              {/* Market Overview */}
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-4">Market Overview</h2>
                <MarketOverview 
                  marketData={marketData} 
                  loading={loading} 
                  symbols={selectedSymbols}
                />
              </div>

              {/* Insights Feed */}
              <div className="glass-card rounded-xl p-6">
                <h2 className="text-2xl font-semibold mb-4">Latest Insights</h2>
                <InsightsFeed 
                  insights={dailyInsights} 
                  loading={loading} 
                />
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="fixed bottom-4 right-4 max-w-md">
              <div className="notification-error border rounded-lg p-4 shadow-lg">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Loading Overlay */}
          {loading && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="glass-card rounded-xl p-8 text-center">
                <div className="loading-spinner h-12 w-12 mx-auto mb-4"></div>
                <p className="text-lg font-semibold">Processing...</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  Agents are analyzing your request
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
} 