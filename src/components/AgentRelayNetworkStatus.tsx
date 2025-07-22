'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface AgentProfile {
  agentId: string;
  name: string;
  capabilities: string[];
  specialties: string[];
  reputation: number;
  cost: string;
  endpoint: string;
  publicKey: string;
  lastSeen: number;
  relays: string[];
}

interface RelayStatus {
  url: string;
  connected: boolean;
  latency: number;
  agentCount: number;
  lastPing: number;
}

interface NetworkStatus {
  isRunning: boolean;
  connectedRelays: number;
  totalRelays: number;
  knownAgents: number;
  activeRequests: number;
  taskCoordinations: number;
  uptime: number;
}

interface AgentRelayNetworkData {
  networkStatus: NetworkStatus;
  knownAgents: AgentProfile[];
  relayStatus: RelayStatus[];
  activeRequests: any[];
  taskCoordinations: any[];
}

export default function AgentRelayNetworkStatus() {
  const [networkData, setNetworkData] = useState<AgentRelayNetworkData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNetworkStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/agent-relay-network/status');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform the data to ensure arrays are converted to counts
      const transformedData = {
        ...data.data,
        networkStatus: {
          isRunning: data.data.isRunning,
          connectedRelays: data.data.connectedRelays || 0,
          totalRelays: data.data.totalRelays || 3,
          knownAgents: Array.isArray(data.data.knownAgents) ? data.data.knownAgents.length : (data.data.knownAgents || 0),
          activeRequests: Array.isArray(data.data.activeRequests) ? data.data.activeRequests.length : (data.data.activeRequests || 0),
          taskCoordinations: Array.isArray(data.data.taskCoordinations) ? data.data.taskCoordinations.length : (data.data.taskCoordinations || 0),
          uptime: data.data.uptime || 0
        },
        knownAgents: data.data.knownAgents || [],
        relayStatus: data.data.relayStatus || [],
        activeRequests: data.data.activeRequests || [],
        taskCoordinations: data.data.taskCoordinations || []
      };
      
      setNetworkData(transformedData);
      setError(null);
    } catch (error) {
      console.error('Error fetching Agent Relay Network status:', error);
      setError(error instanceof Error ? error.message : 'Unknown error');
      
      // Fallback to mock data for demonstration
      setNetworkData(getMockNetworkData());
    } finally {
      setIsLoading(false);
    }
  };

  const getMockNetworkData = (): AgentRelayNetworkData => {
    return {
      networkStatus: {
        isRunning: true,
        connectedRelays: 3,
        totalRelays: 3,
        knownAgents: 4,
        activeRequests: 2,
        taskCoordinations: 1,
        uptime: 1800000 // 30 minutes
      },
      knownAgents: [
        {
          agentId: 'market-research-agent',
          name: 'Market Research Agent',
          capabilities: ['market_analysis', 'sentiment_analysis'],
          specialties: ['market_trends', 'news_analysis'],
          reputation: 0.85,
          cost: '$0.01',
          endpoint: 'http://localhost:8081',
          publicKey: 'arn-market-123',
          lastSeen: Date.now() - 60000,
          relays: ['local-relay-1', 'local-relay-2']
        },
        {
          agentId: 'macro-research-agent',
          name: 'Macro Research Agent',
          capabilities: ['macro_analysis', 'economic_indicators'],
          specialties: ['economic_trends', 'policy_analysis'],
          reputation: 0.78,
          cost: '$0.02',
          endpoint: 'http://localhost:8082',
          publicKey: 'arn-macro-456',
          lastSeen: Date.now() - 45000,
          relays: ['local-relay-1', 'local-relay-3']
        },
        {
          agentId: 'price-analysis-agent',
          name: 'Price Analysis Agent',
          capabilities: ['technical_analysis', 'price_analysis'],
          specialties: ['chart_patterns', 'indicators'],
          reputation: 0.92,
          cost: '$0.005',
          endpoint: 'http://localhost:8083',
          publicKey: 'arn-price-789',
          lastSeen: Date.now() - 30000,
          relays: ['local-relay-2', 'local-relay-3']
        },
        {
          agentId: 'insights-agent',
          name: 'Insights Agent',
          capabilities: ['report_generation', 'coordination'],
          specialties: ['synthesis', 'recommendations'],
          reputation: 0.88,
          cost: '$0.03',
          endpoint: 'http://localhost:8084',
          publicKey: 'arn-insights-abc',
          lastSeen: Date.now() - 15000,
          relays: ['local-relay-1', 'local-relay-2', 'local-relay-3']
        }
      ],
      relayStatus: [
        {
          url: 'local-relay-1',
          connected: true,
          latency: 45,
          agentCount: 3,
          lastPing: Date.now() - 5000
        },
        {
          url: 'local-relay-2',
          connected: true,
          latency: 62,
          agentCount: 3,
          lastPing: Date.now() - 8000
        },
        {
          url: 'local-relay-3',
          connected: true,
          latency: 38,
          agentCount: 3,
          lastPing: Date.now() - 3000
        }
      ],
      activeRequests: [],
      taskCoordinations: []
    };
  };

  useEffect(() => {
    fetchNetworkStatus();
    const interval = setInterval(fetchNetworkStatus, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const formatUptime = (uptime: number) => {
    const minutes = Math.floor(uptime / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const formatLastSeen = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getReputationColor = (reputation: number) => {
    if (reputation >= 0.8) return 'text-green-600';
    if (reputation >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 50) return 'text-green-600';
    if (latency < 100) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !networkData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-red-600">Agent Relay Network Error</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-500 mb-4">Failed to load network status: {error}</p>
          <Button onClick={fetchNetworkStatus}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  if (!networkData) {
    return null;
  }

  const { networkStatus, knownAgents, relayStatus } = networkData;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Agent Relay Network</h2>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${networkStatus.isRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-sm text-gray-600">
            {networkStatus.isRunning ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Network Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{networkStatus.knownAgents}</div>
            <div className="text-sm text-gray-600">Known Agents</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{networkStatus.connectedRelays}</div>
            <div className="text-sm text-gray-600">Connected Relays</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{networkStatus.activeRequests}</div>
            <div className="text-sm text-gray-600">Active Requests</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{networkStatus.taskCoordinations}</div>
            <div className="text-sm text-gray-600">Task Coordinations</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-indigo-600">{formatUptime(networkStatus.uptime)}</div>
            <div className="text-sm text-gray-600">Uptime</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4 text-center">
            <Button 
              onClick={fetchNetworkStatus}
              size="sm"
              className="w-full"
            >
              Refresh
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Known Agents */}
        <Card>
          <CardHeader>
            <CardTitle>Discovered Agents</CardTitle>
            <CardDescription>
              Agents available in the relay network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {knownAgents.map((agent) => (
                <div key={agent.agentId} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{agent.name}</h4>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{agent.cost}</Badge>
                      <span className={`text-sm font-medium ${getReputationColor(agent.reputation)}`}>
                        {(agent.reputation * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Capabilities:</strong> {agent.capabilities.join(', ')}
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-2">
                    <strong>Specialties:</strong> {agent.specialties.join(', ')}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Last seen: {formatLastSeen(agent.lastSeen)}</span>
                    <span>Relays: {agent.relays.length}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Relay Status */}
        <Card>
          <CardHeader>
            <CardTitle>Relay Network Status</CardTitle>
            <CardDescription>
              Health and performance of relay nodes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {relayStatus.map((relay) => (
                <div key={relay.url} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{relay.url}</h4>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${relay.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                      <span className="text-sm">
                        {relay.connected ? 'Connected' : 'Disconnected'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Latency: </span>
                      <span className={getLatencyColor(relay.latency)}>
                        {relay.latency}ms
                      </span>
                    </div>
                    
                    <div>
                      <span className="text-gray-600">Agents: </span>
                      <span className="font-medium">{relay.agentCount}</span>
                    </div>
                  </div>
                  
                  <div className="text-xs text-gray-500 mt-2">
                    Last ping: {formatLastSeen(relay.lastPing)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="text-yellow-800">
              <strong>Note:</strong> Showing mock data due to API error: {error}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 