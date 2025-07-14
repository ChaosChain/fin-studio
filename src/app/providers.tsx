'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { A2AHttpClient } from '@/lib/a2a/http-client';
import { AgentIdentity } from '@/types/a2a';
import { MarketData, DailyInsight } from '@/types/fintech';

interface AppContextType {
  a2aClient: A2AHttpClient | null;
  agents: AgentIdentity[];
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
  const [a2aClient, setA2aClient] = useState<A2AHttpClient | null>(null);
  const [agents, setAgents] = useState<AgentIdentity[]>([]);
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [dailyInsights, setDailyInsights] = useState<DailyInsight[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const connectToAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Initialize A2A client
      const client = new A2AHttpClient('http://localhost:8080');
      
      // Connect to the agent manager
      await client.connect();
      
      // Discover available agents
      const availableAgents = await client.discoverAgents();
      
      setA2aClient(client);
      setAgents(availableAgents);
      setIsConnected(true);
      
      console.log('Connected to agents:', availableAgents);
    } catch (err) {
      console.error('Failed to connect to agents:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to agents');
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  };

  const requestMarketData = async (symbols: string[]) => {
    if (!a2aClient || !isConnected) {
      setError('Not connected to agents');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await a2aClient.sendMessage('price-analysis-agent', 'get_market_data', {
        symbols,
        timeframe: 'current',
        includeExtended: false
      });
      
      if (response.success && response.data?.marketData) {
        setMarketData(response.data.marketData);
      }
    } catch (err) {
      console.error('Failed to request market data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch market data');
    } finally {
      setLoading(false);
    }
  };

  const requestDailyInsights = async (symbols: string[]) => {
    if (!a2aClient || !isConnected) {
      setError('Not connected to agents');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const response = await a2aClient.sendMessage('insights-agent', 'generate_daily_insight', {
        symbols,
        includePortfolio: true,
        deliveryMethod: 'in_app'
      });
      
      if (response.success && response.data?.insight) {
        setDailyInsights(prev => [response.data.insight, ...prev]);
      }
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
      if (a2aClient) {
        a2aClient.disconnect();
      }
    };
  }, [a2aClient]);

  const value: AppContextType = {
    a2aClient,
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
    <AppProvider>
      {children}
    </AppProvider>
  );
} 