'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MarketData, DailyInsight } from '@/types/fintech';
import { GoogleA2AAgentIdentity } from '@/types/google-a2a';

// Create a query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
    },
  },
});

interface AppContextType {
  agents: GoogleA2AAgentIdentity[];
  marketData: MarketData[];
  dailyInsights: DailyInsight[];
  isConnected: boolean;
  loading: boolean;
  error: string | null;
  connectToAgents: () => Promise<void>;
  requestMarketData: (symbols: string[]) => Promise<void>;
  requestDailyInsights: (symbols: string[]) => Promise<void>;
  clearError: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [agents, setAgents] = useState<GoogleA2AAgentIdentity[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [dailyInsights, setDailyInsights] = useState<DailyInsight[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectToAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate agent discovery for Google A2A SDK
      const availableAgents: GoogleA2AAgentIdentity[] = [
        {
          id: 'market-research-agent',
          name: 'Market Research Agent',
          type: 'market_research' as any,
          version: '1.0.0',
          capabilities: ['news_analysis', 'market_sentiment']
        },
        {
          id: 'price-analysis-agent',
          name: 'Price Analysis Agent',
          type: 'price_analysis' as any,
          version: '1.0.0',
          capabilities: ['technical_analysis', 'price_prediction']
        },
        {
          id: 'macro-research-agent',
          name: 'Macro Research Agent',
          type: 'macro_research' as any,
          version: '1.0.0',
          capabilities: ['economic_analysis', 'policy_research']
        },
        {
          id: 'insights-agent',
          name: 'Insights Agent',
          type: 'insights_reporter' as any,
          version: '1.0.0',
          capabilities: ['report_generation', 'cross_analysis']
        }
      ];
      
      setAgents(availableAgents);
      setIsConnected(true);
      
      console.log('Connected to Google A2A agents:', availableAgents);
    } catch (err) {
      console.error('Failed to connect to agents:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to agents');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const requestMarketData = async (symbols: string[]) => {
    if (!isConnected) {
      setError('Not connected to agents');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Simulate market data request for Google A2A SDK
      const mockMarketData: MarketData[] = symbols.map(symbol => ({
        symbol,
        name: `${symbol} Corporation`,
        price: Math.random() * 1000 + 100,
        change: (Math.random() - 0.5) * 10,
        changePercent: (Math.random() - 0.5) * 5,
        volume: Math.floor(Math.random() * 1000000),
        timestamp: new Date(),
        source: 'Google A2A SDK'
      }));
      
      setMarketData(mockMarketData);
    } catch (err) {
      console.error('Failed to request market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  const requestDailyInsights = async (symbols: string[]) => {
    if (!isConnected) {
      setError('Not connected to agents');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Simulate daily insights request for Google A2A SDK
      const mockInsights: DailyInsight[] = symbols.map(symbol => ({
        id: `insight_${symbol}_${Date.now()}`,
        date: new Date(),
        title: `Daily Market Insight for ${symbol}`,
        summary: `AI-powered analysis for ${symbol} shows positive momentum with strong technical indicators.`,
        sections: [
          {
            title: 'Technical Analysis',
            content: 'Strong upward trend with support at key levels',
            type: 'technical_analysis' as any
          }
        ],
        keyPoints: [
          'Technical analysis indicates upward trend',
          'Volume patterns support bullish outlook',
          'Market sentiment analysis shows positive momentum'
        ],
        marketSentiment: 'positive' as any,
        actionItems: ['Monitor support levels', 'Consider position sizing'],
        generatedBy: ['Google A2A SDK'],
        deliveryMethod: 'in_app' as any
      }));
      
      setDailyInsights(mockInsights);
    } catch (err) {
      console.error('Failed to request daily insights:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  // Initialize connection on mount
  useEffect(() => {
    const initializeApp = async () => {
      // Try to connect to agents in the background
      try {
        await connectToAgents();
      } catch (err) {
        console.log('Initial connection failed, user can retry manually');
      }
    };

    initializeApp();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Cleanup for Google A2A SDK
      console.log('Cleaning up Google A2A SDK connections');
    };
  }, []);

  const value: AppContextType = {
    agents,
    marketData,
    dailyInsights,
    isConnected,
    loading,
    error,
    connectToAgents,
    requestMarketData,
    requestDailyInsights,
    clearError
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppProvider>
        {children}
      </AppProvider>
    </QueryClientProvider>
  );
} 