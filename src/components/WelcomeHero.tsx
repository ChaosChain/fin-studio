'use client';

import { useApp } from '@/app/providers';

export function WelcomeHero() {
  const { connectToAgents, loading } = useApp();

  return (
    <div className="text-center py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-6xl font-bold gradient-text mb-6">
          Welcome to Fin Studio
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
          Advanced investment analysis platform powered by AI agents using the A2A (Agent-to-Agent) protocol for seamless communication and collaboration.
        </p>
        
        <div className="glass-card rounded-xl p-8 mb-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-6">Our AI Agents</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-left">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">📊</span>
                <h3 className="font-semibold text-lg">Market Research Agent</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Analyzes market trends, news sentiment, and provides comprehensive market insights using advanced AI.
              </p>
            </div>
            
            <div className="text-left">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">🌍</span>
                <h3 className="font-semibold text-lg">Macro Research Agent</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Tracks economic indicators, central bank policies, and global macroeconomic trends.
              </p>
            </div>
            
            <div className="text-left">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">📈</span>
                <h3 className="font-semibold text-lg">Price Analysis Agent</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Performs technical analysis, fetches real-time market data, and identifies trading opportunities.
              </p>
            </div>
            
            <div className="text-left">
              <div className="flex items-center mb-3">
                <span className="text-2xl mr-3">📝</span>
                <h3 className="font-semibold text-lg">Insights Agent</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Generates daily insights, coordinates with other agents, and delivers personalized reports.
              </p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-8 mb-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-semibold mb-4">A2A Protocol Integration</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            This platform implements Google Cloud's Agent-to-Agent (A2A) protocol, enabling seamless communication 
            between AI agents for enhanced collaboration and more intelligent analysis.
          </p>
          <div className="flex flex-wrap justify-center gap-3 mb-6">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
              Real-time Communication
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
              Agent Discovery
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
              Task Coordination
            </span>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
              Secure by Default
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <button
            onClick={connectToAgents}
            disabled={loading}
            className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
          >
            {loading ? (
              <>
                <div className="loading-spinner h-5 w-5 mr-3"></div>
                Connecting to Agents...
              </>
            ) : (
              <>
                <span className="mr-3">🚀</span>
                Connect to AI Agents
              </>
            )}
          </button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Make sure the agent manager is running on port 8080</p>
            <p className="mt-1">
              <code className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-xs">
                npm run agents:start
              </code>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 