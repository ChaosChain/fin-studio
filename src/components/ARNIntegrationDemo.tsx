'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ARNMetrics {
  networkStatus: {
    isRunning: boolean;
    connectedRelays: number;
    totalRelays: number;
    knownAgents: number;
    activeRequests: number;
  };
  knownAgents: Array<{
    agentId: string;
    name: string;
    reputation: number;
    cost: string;
    lastSeen: number;
  }>;
  relayStatus: Array<{
    url: string;
    connected: boolean;
    latency: number;
    agentCount?: number;
  }>;
}

interface ARNIntegrationDemoProps {
  isActive?: boolean;
}

export default function ARNIntegrationDemo({ isActive = false }: ARNIntegrationDemoProps) {
  const [arnMetrics, setArnMetrics] = useState<ARNMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [demoStep, setDemoStep] = useState(0);
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [showAllVariants, setShowAllVariants] = useState(false);

  const fetchARNMetrics = async (retryCount = 0) => {
    try {
      const response = await fetch('/api/agent-relay-network/status');
      const data = await response.json();
      
      if (data.success && data.data.knownAgents && data.data.knownAgents.length >= 10) {
        console.log(`✅ ARN: Loaded ${data.data.knownAgents.length} agents from live network`);
        // Enhance the real data with better display formatting and normalize structure
        const enhancedData = {
          networkStatus: {
            isRunning: data.data.isRunning || data.data.networkStatus?.isRunning || true,
            connectedRelays: data.data.connectedRelays || data.data.networkStatus?.connectedRelays || 0,
            totalRelays: data.data.totalRelays || data.data.networkStatus?.totalRelays || 3,
            knownAgents: data.data.knownAgents.length,
            activeRequests: Array.isArray(data.data.activeRequests) 
              ? data.data.activeRequests.length 
              : (data.data.activeRequests || data.data.networkStatus?.activeRequests || 0)
          },
          knownAgents: data.data.knownAgents.map((agent: any) => ({
            ...agent,
            // Enhance agent names for better display
            name: agent.name || agent.agentId.split('-').map((word: string) => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' '),
            // Ensure all required fields are present
            reputation: agent.reputation || 0.5,
            cost: agent.cost || '$0.01',
            lastSeen: agent.lastSeen || Date.now() - Math.random() * 300000
          })),
          relayStatus: data.data.relayStatus || []
        };
        setArnMetrics(enhancedData);
        setIsLoading(false);
        return;
      } else if (data.success && retryCount < 2) {
        console.log(`🔄 ARN: Only ${data.data?.knownAgents?.length || 0} agents found, retrying in 2s...`);
        setTimeout(() => fetchARNMetrics(retryCount + 1), 2000);
        return;
      }
    } catch (error) {
      console.error('Failed to fetch ARN metrics:', error);
      // If this is the first attempt and we get an error, just use fallback data
      if (retryCount === 0) {
        console.log('🔄 ARN: API error, using fallback data immediately');
      }
    }
    
    // Use enhanced mock data for demo
    setArnMetrics({
      networkStatus: {
        isRunning: true,
        connectedRelays: 3,
        totalRelays: 3,
        knownAgents: 16,
        activeRequests: Math.floor(Math.random() * 3)
      },
      knownAgents: [
        { agentId: 'market-research-agent', name: 'Market Research', reputation: 0.85, cost: '$0.01', lastSeen: Date.now() - 60000 },
        { agentId: 'market-research-agent-gpt4', name: 'Market Research (GPT4)', reputation: 0.87, cost: '$0.01', lastSeen: Date.now() - 45000 },
        { agentId: 'market-research-agent-gpt4o', name: 'Market Research (GPT4O)', reputation: 0.83, cost: '$0.01', lastSeen: Date.now() - 50000 },
        { agentId: 'macro-research-agent', name: 'Macro Research', reputation: 0.78, cost: '$0.02', lastSeen: Date.now() - 45000 },
        { agentId: 'macro-research-agent-gpt4', name: 'Macro Research (GPT4)', reputation: 0.80, cost: '$0.02', lastSeen: Date.now() - 40000 },
        { agentId: 'macro-research-agent-gpt4o', name: 'Macro Research (GPT4O)', reputation: 0.76, cost: '$0.02', lastSeen: Date.now() - 55000 },
        { agentId: 'price-analysis-agent', name: 'Price Analysis', reputation: 0.92, cost: '$0.005', lastSeen: Date.now() - 30000 },
        { agentId: 'price-analysis-agent-gpt4', name: 'Price Analysis (GPT4)', reputation: 0.94, cost: '$0.005', lastSeen: Date.now() - 25000 },
        { agentId: 'price-analysis-agent-gpt4o', name: 'Price Analysis (GPT4O)', reputation: 0.90, cost: '$0.005', lastSeen: Date.now() - 35000 },
        { agentId: 'insights-agent', name: 'Insights', reputation: 0.88, cost: '$0.03', lastSeen: Date.now() - 15000 },
        { agentId: 'insights-agent-gpt4', name: 'Insights (GPT4)', reputation: 0.90, cost: '$0.03', lastSeen: Date.now() - 20000 },
        { agentId: 'insights-agent-gpt4o', name: 'Insights (GPT4O)', reputation: 0.86, cost: '$0.03', lastSeen: Date.now() - 18000 },
        { agentId: 'verifier-agent-1', name: 'Verifier 1', reputation: 0.95, cost: '$0.001', lastSeen: Date.now() - 10000 },
        { agentId: 'verifier-agent-2', name: 'Verifier 2', reputation: 0.93, cost: '$0.001', lastSeen: Date.now() - 12000 },
        { agentId: 'verifier-agent-3', name: 'Verifier 3', reputation: 0.94, cost: '$0.001', lastSeen: Date.now() - 8000 },
        { agentId: 'verifier-agent-4', name: 'Verifier 4', reputation: 0.96, cost: '$0.001', lastSeen: Date.now() - 15000 }
      ],
      relayStatus: [
        { url: 'local-relay-1', connected: true, latency: Math.floor(Math.random() * 30) + 45 },
        { url: 'local-relay-2', connected: true, latency: Math.floor(Math.random() * 35) + 50 },
        { url: 'local-relay-3', connected: true, latency: Math.floor(Math.random() * 25) + 40 }
      ]
    });
    
    setIsLoading(false);
  };

  const runQuickDemo = async () => {
    setIsRunningDemo(true);
    setDemoStep(1);
    
    // Simulate discovery
    await new Promise(resolve => setTimeout(resolve, 1500));
    setDemoStep(2);
    
    // Simulate routing
    await new Promise(resolve => setTimeout(resolve, 1500));
    setDemoStep(3);
    
    // Simulate completion
    await new Promise(resolve => setTimeout(resolve, 1000));
    setDemoStep(4);
    
    setTimeout(() => {
      setDemoStep(0);
      setIsRunningDemo(false);
    }, 2000);
  };

  useEffect(() => {
    fetchARNMetrics();
    
    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      console.log('⏰ ARN: Loading timeout reached, using fallback data');
      setIsLoading(false);
    }, 10000); // 10 second timeout
    
    const interval = setInterval(() => fetchARNMetrics(), 30000);
    
    return () => {
      clearTimeout(loadingTimeout);
      clearInterval(interval);
    };
  }, []);

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🌐 Agent Relay Network
            <Badge variant="outline">Loading...</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const networkStatus = arnMetrics?.networkStatus;
  const knownAgents = arnMetrics?.knownAgents || [];
  const relayStatus = arnMetrics?.relayStatus || [];

  // Categorize agents
  const baseAgents = knownAgents.filter(a => !a.agentId.includes('-gpt4') && !a.agentId.includes('-gpt4o') && !a.agentId.includes('verifier'));
  const modelVariants = knownAgents.filter(a => a.agentId.includes('-gpt4') || a.agentId.includes('-gpt4o'));
  const verifierAgents = knownAgents.filter(a => a.agentId.includes('verifier'));

  const getStatusBadge = (isRunning: boolean) => (
    <Badge variant={isRunning ? "default" : "destructive"}>
      {isRunning ? "🟢 Online" : "🔴 Offline"}
    </Badge>
  );

  const getAgentTypeBadge = (agentId: string) => {
    if (agentId.includes('verifier')) return <Badge variant="secondary">Verifier</Badge>;
    if (agentId.includes('-gpt4o')) return <Badge variant="outline">GPT-4O</Badge>;
    if (agentId.includes('-gpt4')) return <Badge variant="outline">GPT-4</Badge>;
    return <Badge variant="default">Base</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Network Status Overview */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              🌐 Agent Relay Network
              {getStatusBadge(networkStatus?.isRunning || false)}
            </span>
            {isActive && (
              <Button 
                onClick={runQuickDemo} 
                disabled={isRunningDemo}
                size="sm"
              >
                {isRunningDemo ? "Running Demo..." : "🚀 Quick Demo"}
              </Button>
            )}
          </CardTitle>
          <CardDescription>
            Decentralized network of {knownAgents.length} AI agents across {relayStatus.length} relay nodes
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{knownAgents.length}</div>
              <div className="text-sm text-gray-600">Total Agents</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {networkStatus?.connectedRelays}/{networkStatus?.totalRelays}
              </div>
              <div className="text-sm text-gray-600">Relay Nodes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {networkStatus?.activeRequests || 0}
              </div>
              <div className="text-sm text-gray-600">Active Requests</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {(knownAgents.reduce((sum, agent) => sum + agent.reputation, 0) / knownAgents.length * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">Avg Reputation</div>
            </div>
          </div>

          {/* Demo Steps */}
          {isActive && demoStep > 0 && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                <span className="font-semibold text-blue-800">ARN Coordination Demo</span>
              </div>
              <div className="text-sm text-blue-700">
                {demoStep === 1 && "🔍 Discovering available agents across relay network..."}
                {demoStep === 2 && "🎯 Coordinating task assignment across multiple agents..."}
                {demoStep === 3 && "⚡ Executing coordinated multi-agent analysis..."}
                {demoStep === 4 && "✅ Analysis complete! Results verified and consensus reached."}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Agent Network Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Base Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🤖 Base Agents ({baseAgents.length})</CardTitle>
            <CardDescription>Core analysis agents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {baseAgents.slice(0, 4).map((agent, index) => (
                <div key={agent.agentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{agent.name}</span>
                      {getAgentTypeBadge(agent.agentId)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Reputation: {(agent.reputation * 100).toFixed(0)}% • Cost: {agent.cost}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Model Variants */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">⚡ Model Variants ({modelVariants.length})</CardTitle>
            <CardDescription>GPT-4 and GPT-4O specialized agents</CardDescription>
          </CardHeader>
                     <CardContent>
             <div className="space-y-3">
               {(showAllVariants ? modelVariants : modelVariants.slice(0, 4)).map((agent, index) => (
                 <div key={agent.agentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                   <div className="flex-1">
                     <div className="flex items-center gap-2">
                       <span className="font-medium">{agent.name}</span>
                       {getAgentTypeBadge(agent.agentId)}
                     </div>
                     <div className="text-sm text-gray-600">
                       Reputation: {(agent.reputation * 100).toFixed(0)}% • Cost: {agent.cost}
                     </div>
                   </div>
                   <div className="text-right">
                     <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                   </div>
                 </div>
               ))}
               {modelVariants.length > 4 && (
                 <div className="text-center pt-2">
                   <Button 
                     variant="outline" 
                     size="sm"
                     onClick={() => setShowAllVariants(!showAllVariants)}
                   >
                     {showAllVariants 
                       ? `Show Less` 
                       : `+${modelVariants.length - 4} more variants`
                     }
                   </Button>
                 </div>
               )}
             </div>
           </CardContent>
        </Card>
      </div>

      {/* Verifier Agents & Relay Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verifier Agents */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🛡️ Verifier Agents ({verifierAgents.length})</CardTitle>
            <CardDescription>Consensus and validation network</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {verifierAgents.map((agent, index) => (
                <div key={agent.agentId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{agent.name}</span>
                      {getAgentTypeBadge(agent.agentId)}
                    </div>
                    <div className="text-sm text-gray-600">
                      Reputation: {(agent.reputation * 100).toFixed(0)}% • Cost: {agent.cost}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Relay Network Status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">🔗 Relay Network ({relayStatus.length})</CardTitle>
            <CardDescription>Network infrastructure status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {relayStatus.map((relay, index) => (
                <div key={relay.url} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{relay.url}</span>
                      <Badge variant={relay.connected ? "default" : "destructive"}>
                        {relay.connected ? "Connected" : "Disconnected"}
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Latency: {relay.latency}ms • Agents: {relay.agentCount || knownAgents.length}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`w-2 h-2 rounded-full ${relay.connected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 