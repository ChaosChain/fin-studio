'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConsensusVisualizer } from './ConsensusVisualizer';
import DKGVisualizer from './DKGVisualizer';
import VerifierNetworkVisualizer from './VerifierNetworkVisualizer';
import FinalReport from './FinalReport';
import ARNIntegrationDemo from './ARNIntegrationDemo';

interface AnalysisResult {
  taskId: string;
  status: string;
  results: Record<string, any>;
  reputation: Record<string, any>;
}

interface SystemMetrics {
  dkg: {
    totalNodes: number;
    nodesByAgent: Record<string, number>;
    nodesByTask: Record<string, number>;
  };
  reputation: {
    totalAgents: number;
    averageReputation: number;
    topPerformers: string[];
    specialtyDistribution: Record<string, number>;
  };
  topAgents: Array<{
    id: string;
    name: string;
    score: number;
    totalTasks: number;
    acceptanceRate: number;
    specialties: string[];
  }>;
}

export default function ChaosChainDemo() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [consensusData, setConsensusData] = useState<any[]>([]);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [selectedSymbol, setSelectedSymbol] = useState('AAPL');
  const [dkgRefreshTrigger, setDkgRefreshTrigger] = useState(0);
  const [showFinalReport, setShowFinalReport] = useState(false);
  const [showAgentRelayNetwork, setShowAgentRelayNetwork] = useState(true); // Always show ARN
  const [arnMetrics, setArnMetrics] = useState<any>(null);
  const [arnActive, setArnActive] = useState(false);

  const runComprehensiveAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      // Step 1: Show ARN agent discovery phase
      console.log('🔍 Phase 1: Agent Discovery via Relay Network');
      setArnActive(true);
      
      // Brief delay to show ARN activation
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Step 2: Discover and coordinate agents through ARN
      console.log('🎯 Phase 2: Task Coordination via ARN');
      const arnResponse = await fetch('/api/agent-relay-network/status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'coordinate_task',
          payload: {
            taskType: 'comprehensive_analysis',
            symbols: [selectedSymbol],
            analysisType: 'comprehensive'
          }
        }),
      });
      
      const arnData = await arnResponse.json();
      if (arnData.success) {
        console.log('✅ ARN Task Coordination Success');
        // Refresh ARN metrics
        await getAgentRelayNetworkStatus();
      }
      
      // Step 3: Execute comprehensive analysis with ARN-coordinated agents
      console.log('⚡ Phase 3: Executing Analysis with ARN-Coordinated Agents');
      const response = await fetch('/api/comprehensive-analysis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          symbols: [selectedSymbol],
          analysisType: 'comprehensive',
          useARN: true, // Always use ARN - it's now core functionality
          arnTaskId: arnData.data?.taskId
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        setAnalysisResult(data.analysis);
        setSystemMetrics(data.metrics);
        setConsensusData(data.consensusData || []);
        // Trigger DKG visualizer refresh
        setDkgRefreshTrigger(prev => prev + 1);
        
        // Show final report after a brief delay to let visualizations update
        setTimeout(() => {
          setShowFinalReport(true);
        }, 2000);
        
        console.log('🎉 Comprehensive Analysis Complete with ARN Integration');
      } else {
        console.error('Analysis failed:', data.error);
      }
    } catch (error) {
      console.error('Request failed:', error);
    } finally {
      setIsAnalyzing(false);
      setArnActive(false);
    }
  };

  const getSystemStatus = async () => {
    try {
      const response = await fetch('/api/comprehensive-analysis');
      const data = await response.json();
      
      if (data.success) {
        setSystemStatus(data);
      }
    } catch (error) {
      console.error('Status check failed:', error);
    }
  };

  const getAgentRelayNetworkStatus = async () => {
    try {
      const response = await fetch('/api/agent-relay-network/status');
      const data = await response.json();
      
      if (data.success) {
        // Transform the data to match expected structure
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
          }
        };
        setArnMetrics(transformedData);
      }
    } catch (error) {
      console.error('ARN Status check failed:', error);
    }
  };

  React.useEffect(() => {
    getSystemStatus();
    getAgentRelayNetworkStatus();
  }, []);

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            🔗 ChaosChain MVP Demo
          </CardTitle>
          <p className="text-center text-muted-foreground">
            Showcasing Agent Reputation Networks, Agent Relay Network, Decentralized Knowledge Graph, 
            Proof of Agency, A2A Protocol, and Micro On-Chain Payments
          </p>
        </CardHeader>
      </Card>

      {/* System Status */}
      {systemStatus && (
        <Card>
          <CardHeader>
            <CardTitle>🚀 System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {systemStatus.metrics?.reputation?.totalAgents || 0}
                </div>
                <div className="text-sm text-muted-foreground">Active Agents</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {systemStatus.metrics?.dkg?.totalNodes || 0}
                </div>
                <div className="text-sm text-muted-foreground">DKG Nodes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {systemStatus.metrics?.reputation?.averageReputation?.toFixed(3) || '0.000'}
                </div>
                <div className="text-sm text-muted-foreground">Avg Reputation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {systemStatus?.verifiers?.length || 4}
                </div>
                <div className="text-sm text-muted-foreground">Verifiers</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-600">
                  {arnMetrics?.networkStatus?.connectedRelays || 0}/{arnMetrics?.networkStatus?.totalRelays || 3}
                </div>
                <div className="text-sm text-muted-foreground">Relay Network</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {systemStatus.features?.map((feature: string, index: number) => (
                <Badge key={index} variant="secondary">
                  {feature}
                </Badge>
              ))}
              {/* ARN-integrated features */}
              <Badge variant="default" className="bg-cyan-600">ARN-Coordinated Agents</Badge>
              <Badge variant="secondary">Decentralized Discovery</Badge>
              <Badge variant="secondary">Multi-Relay Routing</Badge>
              <Badge variant="secondary">Fault-Tolerant Network</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle>🎯 Run Comprehensive Analysis</CardTitle>
          <p className="text-sm text-muted-foreground">
            This will demonstrate the full ChaosChain workflow: multi-agent collaboration, 
            DKG creation, PoA signing, verification, consensus, and reputation updates.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <select 
              value={selectedSymbol} 
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="px-3 py-2 border rounded-md"
            >
              <optgroup label="Stocks">
                <option value="AAPL">AAPL (Apple)</option>
                <option value="GOOGL">GOOGL (Google)</option>
                <option value="MSFT">MSFT (Microsoft)</option>
                <option value="TSLA">TSLA (Tesla)</option>
                <option value="NVDA">NVDA (NVIDIA)</option>
                <option value="META">META (Meta)</option>
                <option value="AMZN">AMZN (Amazon)</option>
              </optgroup>
              <optgroup label="Cryptocurrencies">
                <option value="BTC">BTC (Bitcoin)</option>
                <option value="ETH">ETH (Ethereum)</option>
              </optgroup>
            </select>
            <Button 
              onClick={runComprehensiveAnalysis} 
              disabled={isAnalyzing}
              className="min-w-[200px]"
            >
              {isAnalyzing ? '🔄 Analyzing...' : '🚀 Start Analysis'}
            </Button>
            {analysisResult && systemMetrics && (
              <Button 
                variant="outline"
                onClick={() => setShowFinalReport(true)}
                className="min-w-[160px]"
              >
                📊 View Final Report
              </Button>
            )}
            <Button 
              variant="outline"
              onClick={() => setShowAgentRelayNetwork(!showAgentRelayNetwork)}
              className="min-w-[200px]"
            >
              {showAgentRelayNetwork ? '🔼 Hide Relay Network' : '🌐 Show Agent Relay Network'}
            </Button>
          </div>
        </CardContent>
      </Card>

            {/* Agent Relay Network - Core System Component */}
      {showAgentRelayNetwork && (
        <Card className={arnActive ? "border-cyan-500 shadow-lg" : ""}>
          <CardHeader>
            <CardTitle className="flex items-center">
              <span className={`px-2 py-1 rounded text-xs mr-2 ${arnActive ? 'bg-cyan-500 text-white animate-pulse' : 'bg-cyan-100 text-cyan-800'}`}>
                {arnActive ? 'ACTIVE' : 'ARN'}
              </span>
              Agent Relay Network
              {arnActive && <span className="ml-2 text-cyan-500">●</span>}
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              {arnActive 
                ? "🔄 Actively coordinating agents for comprehensive analysis" 
                : "Decentralized agent discovery, communication, and task coordination network"
              }
            </p>
          </CardHeader>
          <CardContent>
            <ARNIntegrationDemo isActive={arnActive} />
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysisResult && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Task Results */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">RESULTS</span>
                Analysis Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <strong>Task ID:</strong> 
                  <code className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded">
                    {analysisResult.taskId}
                  </code>
                </div>
                <div>
                  <strong>Status:</strong> 
                  <Badge className="ml-2" variant={analysisResult.status === 'completed' ? 'default' : 'secondary'}>
                    {analysisResult.status}
                  </Badge>
                </div>
                
                <div className="mt-4">
                  <strong>Component Results:</strong>
                  <div className="mt-2 space-y-2">
                    {Object.entries(analysisResult.results).map(([component, data]: [string, any]) => (
                      <div key={component} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                        <span className="capitalize font-medium">{component}</span>
                        <div className="text-sm text-muted-foreground">
                          {data.nodes} nodes • {data.verifications} verifications • 
                          {data.consensus ? ' CONSENSUS' : ' NO CONSENSUS'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Agent Reputation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs mr-2">REPUTATION</span>
                Agent Reputation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(analysisResult.reputation).map(([agentId, data]: [string, any]) => (
                  <div key={agentId} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">{agentId}</span>
                      <Badge variant="outline">
                        Score: {data.reputationScore.toFixed(3)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Tasks: {data.totalTasks} • 
                      Acceptance: {(data.acceptanceRate * 100).toFixed(1)}%
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Consensus Visualization */}
      {consensusData.length > 0 && (
        <ConsensusVisualizer 
          consensusData={consensusData} 
          isActive={isAnalyzing}
        />
      )}

      {/* DKG Visualization */}
      <DKGVisualizer 
        taskId={analysisResult?.taskId} 
        refreshTrigger={dkgRefreshTrigger}
      />

      {/* Verifier Network Visualization */}
      <VerifierNetworkVisualizer 
        consensusData={consensusData} 
        refreshTrigger={dkgRefreshTrigger}
      />

      {/* System Metrics */}
      {systemMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* DKG Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs mr-2">DKG</span>
                Decentralized Knowledge Graph
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Total Nodes:</span>
                  <Badge variant="secondary">{systemMetrics.dkg.totalNodes}</Badge>
                </div>
                
                <div>
                  <strong>Nodes by Agent:</strong>
                  <div className="mt-2 space-y-1">
                    {Object.entries(systemMetrics.dkg.nodesByAgent).map(([agent, count]) => (
                      <div key={agent} className="flex justify-between text-sm">
                        <span>{agent}:</span>
                        <span>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Top Agents */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded text-xs mr-2">TOP</span>
                Top Performing Agents
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemMetrics.topAgents.map((agent, index) => (
                  <div key={agent.id} className="p-3 border rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-medium">#{index + 1} {agent.name}</span>
                      <Badge variant="default">
                        {agent.score.toFixed(3)}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground mb-2">
                      {agent.totalTasks} tasks • {(agent.acceptanceRate * 100).toFixed(1)}% accepted
                    </div>
                    {agent.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {agent.specialties.map((specialty, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Workflow Explanation */}
      <Card>
        <CardHeader>
          <CardTitle>🔄 ChaosChain Workflow</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">1️⃣</div>
              <h3 className="font-semibold mb-2">Agent Discovery</h3>
              <p className="text-sm text-muted-foreground">
                Agents discover each other through the relay network and announce capabilities
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">2️⃣</div>
              <h3 className="font-semibold mb-2">Task Assignment</h3>
              <p className="text-sm text-muted-foreground">
                Task decomposed into components, multiple agents assigned per component
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">3️⃣</div>
              <h3 className="font-semibold mb-2">DKG & PoA</h3>
              <p className="text-sm text-muted-foreground">
                Agents create signed nodes in the Decentralized Knowledge Graph
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">4️⃣</div>
              <h3 className="font-semibold mb-2">Verifier Network</h3>
              <p className="text-sm text-muted-foreground">
                4 independent verifiers perform multi-criteria consensus validation
              </p>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl mb-2">5️⃣</div>
              <h3 className="font-semibold mb-2">Consensus & Payment</h3>
              <p className="text-sm text-muted-foreground">
                Consensus reached, payments released, reputation updated
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Final Report Modal */}
      {showFinalReport && analysisResult && systemMetrics && (
        <FinalReport
          analysisResult={analysisResult}
          consensusData={consensusData}
          systemMetrics={systemMetrics}
          symbol={selectedSymbol}
          onClose={() => setShowFinalReport(false)}
        />
      )}
    </div>
  );
} 