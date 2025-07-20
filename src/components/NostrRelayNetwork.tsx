'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface RelayStatus {
  url: string;
  connected: boolean;
  latency?: number;
  agentCount: number;
  lastPing?: number;
}

interface NostrAgent {
  agentId: string;
  name: string;
  publicKey: string;
  capabilities: string[];
  reputation: number;
  lastSeen: number;
}

interface NetworkStatus {
  isRunning: boolean;
  knownAgents: NostrAgent[];
  connectedRelays: number;
  totalRelays: number;
  relayStatus: RelayStatus[];
  uptime: number;
}

export default function NostrRelayNetwork() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNetworkStatus = async () => {
      try {
        const response = await fetch('/api/agent-relay-network/status');
        const result = await response.json();
        
        if (result.success && result.meta.dataSource === 'nostr') {
          setNetworkStatus(result.data);
          setError(null);
        } else {
          setError('Nostr ARN not active or no data available');
        }
      } catch (err) {
        setError('Failed to fetch network status');
        console.error('Network status fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchNetworkStatus();
    const interval = setInterval(fetchNetworkStatus, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

  const getRelayStatusColor = (connected: boolean, latency?: number) => {
    if (!connected) return 'bg-red-500';
    if (latency && latency < 200) return 'bg-green-500';
    if (latency && latency < 500) return 'bg-yellow-500';
    return 'bg-orange-500';
  };

  const getRelayStatusText = (connected: boolean, latency?: number) => {
    if (!connected) return 'Disconnected';
    if (latency && latency < 200) return 'Excellent';
    if (latency && latency < 500) return 'Good';
    return 'Fair';
  };

  const formatUptime = (uptime: number) => {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m ${seconds % 60}s`;
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
            Nostr Relay Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !networkStatus) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            Nostr Relay Network
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-500">
            {error || 'No Nostr network data available'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Network Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${networkStatus.isRunning ? 'bg-green-500' : 'bg-red-500'}`}></div>
            Nostr Relay Network
            <Badge variant={networkStatus.isRunning ? 'default' : 'destructive'}>
              {networkStatus.isRunning ? 'Active' : 'Inactive'}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{networkStatus.knownAgents.length}</div>
              <div className="text-sm text-gray-500">Active Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {networkStatus.connectedRelays}/{networkStatus.totalRelays}
              </div>
              <div className="text-sm text-gray-500">Connected Relays</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round((networkStatus.connectedRelays / networkStatus.totalRelays) * 100)}%
              </div>
              <div className="text-sm text-gray-500">Network Health</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{formatUptime(networkStatus.uptime)}</div>
              <div className="text-sm text-gray-500">Uptime</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Relay Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle>Relay Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {networkStatus.relayStatus.map((relay, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${getRelayStatusColor(relay.connected, relay.latency)}`}></div>
                  <div>
                    <div className="font-medium">{relay.url.replace('wss://', '').replace('/', '')}</div>
                    <div className="text-sm text-gray-500">
                      {relay.agentCount} agents • {getRelayStatusText(relay.connected, relay.latency)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">
                    {relay.latency ? `${relay.latency}ms` : relay.connected ? 'Connected' : 'Offline'}
                  </div>
                  <div className="text-sm text-gray-500">
                    {relay.lastPing ? `${Math.round((Date.now() - relay.lastPing) / 1000)}s ago` : 'No ping'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Network Topology Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Network Topology</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-64 bg-gray-50 rounded-lg overflow-hidden">
            {/* Central Hub */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                ARN
              </div>
            </div>

            {/* Relay Nodes */}
            {networkStatus.relayStatus.map((relay, index) => {
              const angle = (index * 2 * Math.PI) / networkStatus.relayStatus.length;
              const radius = 80;
              const x = 50 + (radius * Math.cos(angle)) / 2; // Convert to percentage
              const y = 50 + (radius * Math.sin(angle)) / 2;

              return (
                <div key={index}>
                  {/* Connection Line */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line
                      x1="50%"
                      y1="50%"
                      x2={`${x}%`}
                      y2={`${y}%`}
                      stroke={relay.connected ? '#10b981' : '#ef4444'}
                      strokeWidth="2"
                      strokeDasharray={relay.connected ? '0' : '5,5'}
                    />
                  </svg>

                  {/* Relay Node */}
                  <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2"
                    style={{ left: `${x}%`, top: `${y}%` }}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        relay.connected ? 'bg-green-500' : 'bg-red-500'
                      }`}
                      title={relay.url}
                    >
                      R{index + 1}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Agent Indicators */}
            {networkStatus.knownAgents.slice(0, 6).map((agent, index) => {
              const angle = (index * 2 * Math.PI) / 6 + Math.PI / 6; // Offset from relays
              const radius = 120;
              const x = 50 + (radius * Math.cos(angle)) / 2;
              const y = 50 + (radius * Math.sin(angle)) / 2;

              return (
                <div
                  key={agent.agentId}
                  className="absolute transform -translate-x-1/2 -translate-y-1/2"
                  style={{ left: `${x}%`, top: `${y}%` }}
                >
                  <div
                    className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-white text-xs"
                    title={agent.name}
                  >
                    A
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Agent List */}
      <Card>
        <CardHeader>
          <CardTitle>Connected Agents</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {networkStatus.knownAgents.map((agent) => (
              <div key={agent.agentId} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                    {agent.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-medium">{agent.name}</div>
                    <div className="text-sm text-gray-500">
                      {agent.publicKey.slice(0, 8)}...{agent.publicKey.slice(-4)}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant="outline" className="mb-1">
                    {Math.round(agent.reputation * 100)}% rep
                  </Badge>
                  <div className="text-sm text-gray-500">
                    {agent.capabilities.length} capabilities
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 