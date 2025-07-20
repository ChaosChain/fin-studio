'use client';

import NostrRelayNetwork from '@/components/NostrRelayNetwork';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RefreshCw, Network, Zap, Shield } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function NetworkPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastRefresh, setLastRefresh] = useState(Date.now());

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
    setLastRefresh(Date.now());
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setLastRefresh(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Link href="/demo">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Demo
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Nostr Agent Relay Network</h1>
              <p className="text-gray-600">Real-time decentralized network monitoring</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="text-sm text-gray-500">
              Updated {formatTimeAgo(lastRefresh)}
            </div>
            <Button onClick={handleRefresh} variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Key Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Network className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Decentralized</h3>
                  <p className="text-sm text-gray-600">No single point of failure</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Real-time</h3>
                  <p className="text-sm text-gray-600">Live agent discovery</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">Cryptographic</h3>
                  <p className="text-sm text-gray-600">secp256k1 signatures</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Network Visualization */}
      <div key={refreshKey}>
        <NostrRelayNetwork />
      </div>

      {/* Technical Information */}
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Technical Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-3">Protocol Features</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-2 h-2 p-0 bg-green-500"></Badge>
                  WebSocket connections to multiple relays
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-2 h-2 p-0 bg-green-500"></Badge>
                  Cryptographic agent identity (secp256k1)
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-2 h-2 p-0 bg-green-500"></Badge>
                  Event-driven communication
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-2 h-2 p-0 bg-green-500"></Badge>
                  Automatic relay failover
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-3">Event Types</h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-2 h-2 p-0 bg-blue-500"></Badge>
                  Agent Announcements (Kind 30078)
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-2 h-2 p-0 bg-blue-500"></Badge>
                  Service Requests (Kind 30079)
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-2 h-2 p-0 bg-blue-500"></Badge>
                  Agent Discovery (Kind 30080)
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="w-2 h-2 p-0 bg-blue-500"></Badge>
                  Task Coordination (Kind 30081)
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold mb-2">🌍 Global Network</h4>
            <p className="text-sm text-gray-600">
              Your agents are part of the global Nostr ecosystem, connecting to public relays worldwide.
              This enables censorship-resistant, decentralized AI agent coordination that no single entity can control.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 