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
import { PaymentDialog } from './PaymentDialog';
import { X402PaymentRequirements } from '@/types/payment';

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
  
  // Payment-related state
  const [hasPaidForReport, setHasPaidForReport] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentRequirements, setPaymentRequirements] = useState<X402PaymentRequirements | null>(null);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [agentWallets, setAgentWallets] = useState<any[]>([]);
  const [paymentRecord, setPaymentRecord] = useState<any>(null);

  // State for payment overview
  const [showPaymentOverview, setShowPaymentOverview] = React.useState(false);
  const [isExecutingPayments, setIsExecutingPayments] = React.useState(false);
  const [currentPaymentIndex, setCurrentPaymentIndex] = React.useState(0);

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
        
        // Step 4: Generate agent wallets for individual payments
        console.log('🔑 Phase 4: Generating Agent Wallets for Individual Payments');
        try {
          const walletResponse = await fetch(`/api/payment/report-access?taskId=${data.analysis.taskId}`);
          if (walletResponse.ok) {
            const walletData = await walletResponse.json();
            console.log(`✅ Generated ${walletData.agentWallets?.length || 0} agent wallets for payments`);
          }
        } catch (error) {
          console.error('⚠️ Failed to generate agent wallets:', error);
        }
        
        // Don't show final report automatically - require payment first
        // setTimeout(() => {
        //   setShowFinalReport(true);
        // }, 2000);
        
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

  // State for agent payment queue
  const [agentPaymentQueue, setAgentPaymentQueue] = React.useState<any[]>([]);
  const [currentAgentIndex, setCurrentAgentIndex] = React.useState(0);
  const [completedPayments, setCompletedPayments] = React.useState<any[]>([]);

  // Get agent distribution for individual payments
  const getAgentDistribution = async () => {
    if (!analysisResult?.taskId) {
      console.error('No task ID available for agent distribution');
      return [];
    }
    
    try {
      const response = await fetch(`/api/payment/report-access?taskId=${analysisResult.taskId}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await response.json();
      if (data.success && data.agentWallets) {
        // Calculate distribution for each agent
        const workerAgents = data.agentWallets.filter((w: any) => 
          !w.agentId.includes('verifier')
        );
        const verifierAgents = data.agentWallets.filter((w: any) => 
          w.agentId.includes('verifier')
        );
        
        const distribution = [];
        
        // Worker agents get 70% total (17.5% each)
        for (const agent of workerAgents) {
          distribution.push({
            agentId: agent.agentId,
            walletAddress: agent.walletAddress,
            amount: 0.175, // 17.5% in USDC
            percentage: 0.175
          });
        }
        
        // Verifier agents get 25% total (6.25% each)
        for (const agent of verifierAgents) {
          distribution.push({
            agentId: agent.agentId,
            walletAddress: agent.walletAddress,
            amount: 0.0625, // 6.25% in USDC
            percentage: 0.0625
          });
        }
        
        return distribution;
      }
      return [];
    } catch (error) {
      console.error('Failed to get agent distribution:', error);
      return [];
    }
  };

  // Get payment requirements for specific agent
  const getAgentPaymentRequirements = (agent: any): X402PaymentRequirements => ({
    scheme: 'exact',
    network: 'base-sepolia',
    maxAmountRequired: (agent.amount * 1000000).toString(), // Agent's distributed amount in 6 decimals
    resource: `/report/access/agent/${agent.agentId}`,
    description: `Pay ${agent.agentId} (${(agent.percentage * 100).toFixed(2)}%)`,
    mimeType: 'application/json',
    payTo: agent.walletAddress as `0x${string}`,
    maxTimeoutSeconds: 300,
    asset: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base Sepolia
    extra: { name: 'USD Coin', version: '2' }
  });

  // Handle payment requirement for report access  
  const handleRequirePaymentForReport = async () => {
    if (!analysisResult) return;
    
    setPaymentProcessing(true);
    
    try {
      // Get agent distribution
      const distribution = await getAgentDistribution();
      if (distribution.length === 0) {
        throw new Error('No agents available for payment');
      }
      
      // Set up payment queue and show overview
      setAgentPaymentQueue(distribution);
      setCurrentAgentIndex(0);
      setCompletedPayments([]);
      setCurrentPaymentIndex(0);
      setShowPaymentOverview(true);
      
    } catch (error) {
      console.error('Failed to setup agent payments:', error);
      alert(`Failed to setup agent payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setPaymentProcessing(false);
    }
  };

  // Execute all agent payments automatically after user approval
  const executeAllAgentPayments = async () => {
    if (!analysisResult || agentPaymentQueue.length === 0) return;
    
    setIsExecutingPayments(true);
    setCurrentPaymentIndex(0);
    
    const newCompletedPayments = [];
    
    try {
      for (let i = 0; i < agentPaymentQueue.length; i++) {
        const agent = agentPaymentQueue[i];
        setCurrentPaymentIndex(i);
        
        console.log(`🔄 Processing real on-chain payment ${i + 1}/${agentPaymentQueue.length}: ${agent.agentId}`);
        
        // Create x402 payment requirements for this agent
        const requirements = getAgentPaymentRequirements(agent);
        
        try {
          // Make real on-chain payment using the payment processing API
          const response = await fetch('/api/payment/process', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              amount: agent.amount,
              network: 'base-sepolia',
              agentId: agent.agentId,
              requirements: requirements
            })
          });
          
          const result = await response.json();
          
          if (!response.ok || !result.success) {
            throw new Error(result.error || `Payment failed for ${agent.agentId}`);
          }
          
          // Record this real payment
          const payment = {
            ...agent,
            txHash: result.txHash,
            timestamp: new Date().toISOString(),
            approvalTxHash: result.approvalTxHash,
            preApprovalTxHash: result.preApprovalTxHash,
            authorizationTxHash: result.authorizationTxHash,
            captureTxHash: result.captureTxHash,
            realTransaction: true
          };
          
          newCompletedPayments.push(payment);
          console.log(`✅ Real on-chain payment completed: ${agent.agentId}`);
          console.log(`   📝 TX Hash: ${result.txHash}`);
          console.log(`   🔗 View on BaseScan: https://sepolia.basescan.org/tx/${result.txHash}`);
          
        } catch (error) {
          console.error(`❌ Payment failed for ${agent.agentId}:`, error);
          // For failed payments, we could either stop the process or continue
          // For now, let's stop to ensure all payments are successful
          throw new Error(`Payment failed for ${agent.agentId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        
        // Small delay between payments to avoid overwhelming the blockchain
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // All payments completed - finalize
      setCompletedPayments(newCompletedPayments);
      
      // Send completion data to server
      const response = await fetch('/api/payment/report-access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId: analysisResult.taskId,
          userAddress: '0x0000000000000000000000000000000000000000',
          amount: 1,
          individualTransactions: true,
          completedPayments: newCompletedPayments
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log('🎉 All agent payments completed and verified!');
        setHasPaidForReport(true);
        setShowPaymentOverview(false);
        // Auto-show report after successful payment
        setTimeout(() => {
          setShowFinalReport(true);
        }, 1000);
      } else {
        throw new Error(data.error || 'Payment verification failed');
      }
      
    } catch (error) {
      console.error('Payment execution failed:', error);
      alert(`Payment execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsExecutingPayments(false);
      setCurrentPaymentIndex(0);
    }
  };

  // Handle successful agent payment - continue with next agent or complete
  const handlePaymentSuccess = async (txHash: string) => {
    // This method is no longer used with the new payment overview flow
    // Keeping for backward compatibility
    if (!analysisResult) return;
    
    setIsPaymentDialogOpen(false);
    
    try {
      const currentAgent = agentPaymentQueue[currentAgentIndex];
      if (!currentAgent) return;
      
      // Record this payment
      const newPayment = {
        ...currentAgent,
        txHash: txHash,
        timestamp: new Date().toISOString()
      };
      
      const updatedCompletedPayments = [...completedPayments, newPayment];
      setCompletedPayments(updatedCompletedPayments);
      
      console.log(`✅ Payment ${currentAgentIndex + 1}/${agentPaymentQueue.length} completed:`, newPayment);
      
      // Check if more agents to pay
      const nextIndex = currentAgentIndex + 1;
      if (nextIndex < agentPaymentQueue.length) {
        // Continue with next agent
        setCurrentAgentIndex(nextIndex);
        const nextAgent = agentPaymentQueue[nextIndex];
        
        // Small delay before next payment
        setTimeout(() => {
          setPaymentRequirements(getAgentPaymentRequirements(nextAgent));
          setIsPaymentDialogOpen(true);
        }, 1000);
        
      } else {
        // All agents paid - finalize
        setPaymentProcessing(true);
        
        try {
          // Send completion data to server
          const response = await fetch('/api/payment/report-access', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              taskId: analysisResult.taskId,
              userAddress: '0x0000000000000000000000000000000000000000',
              amount: 1,
              individualTransactions: true,
              completedPayments: updatedCompletedPayments
            }),
          });

          const data = await response.json();
          
          if (data.success) {
            setHasPaidForReport(true);
            setShowFinalReport(true);
            setPaymentRecord(data.payment);
            setAgentWallets(data.agentWallets);
            console.log('✅ All agent payments completed:', data.payment);
          }
        } catch (error) {
          console.error('Failed to finalize payments:', error);
          alert(`Failed to finalize payments: ${error instanceof Error ? error.message : 'Unknown error'}`);
        } finally {
          setPaymentProcessing(false);
        }
      }
      
    } catch (error) {
      console.error('Payment processing error:', error);
      alert(`Payment processing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle payment error
  const handlePaymentError = (error: string) => {
    setIsPaymentDialogOpen(false);
    console.error('Payment failed:', error);
    alert(`Payment failed: ${error}`);
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
              hasPaidForReport ? (
                <Button 
                  variant="outline"
                  onClick={() => setShowFinalReport(true)}
                  className="min-w-[160px]"
                >
                  📊 View Final Report
                </Button>
              ) : (
                <Button 
                  variant="default"
                  onClick={handleRequirePaymentForReport}
                  disabled={paymentProcessing}
                  className="min-w-[300px] bg-green-600 hover:bg-green-700"
                >
                  {paymentProcessing ? '🔄 Setting up agent payments...' : 
                   agentPaymentQueue.length > 0 ? 
                   `💰 Pay Agent ${currentAgentIndex + 1}/${agentPaymentQueue.length}` :
                   '💰 Pay Each Agent Individually'
                  }
                </Button>
              )
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
          <CardTitle>🔄 ChaosChain Workflow with Payment Distribution</CardTitle>
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
                          <div className="text-center p-4 border rounded-lg border-green-200 bg-green-50">
                <div className="text-2xl mb-2">5️⃣</div>
                <h3 className="font-semibold mb-2 text-green-800">Multiple Agent Transactions</h3>
                <p className="text-sm text-green-700">
                  User sends separate on-chain transactions to each agent address (multiple TXs)
                </p>
              </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Distribution Information */}
      {paymentRecord && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              💰 Multiple On-Chain Transactions Complete
              <Badge className="ml-2 bg-green-600">{paymentRecord.totalAgents} Agents → {paymentRecord.transactionCount} TXs</Badge>
            </CardTitle>
            <p className="text-sm text-green-700">
              {paymentRecord.paymentMethod === 'multiple_agent_transactions' 
                ? `You sent ${paymentRecord.transactionCount} separate on-chain transactions to ${paymentRecord.totalAgents} agent addresses.`
                : `You paid each agent directly based on their contribution: ${paymentRecord.transactionCount} separate transactions.`
              }
            </p>
          </CardHeader>
          <CardContent>
            {/* Multiple Transaction Summary */}
            <div className="mb-6 p-4 bg-white rounded-lg border">
              <h4 className="font-semibold mb-3 text-gray-800">💳 Multiple Transaction Method</h4>
              {paymentRecord.initialTransaction && (
                <div className="mb-3 p-2 bg-blue-50 rounded border">
                  <div className="text-sm font-medium text-blue-800">Initial Payment Transaction</div>
                  <div className="text-xs text-blue-600">TX: {paymentRecord.initialTransaction.substring(0, 20)}...</div>
                </div>
              )}
              <div className="flex items-center justify-center space-x-2 mb-3">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center text-lg font-bold mb-1">👤</div>
                  <div className="text-xs text-gray-600">User</div>
                </div>
                <div className="text-2xl text-gray-400">→</div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-green-500 text-white rounded-full flex items-center justify-center text-lg font-bold mb-1">🤖</div>
                  <div className="text-xs text-gray-600">{paymentRecord.totalAgents} Agents</div>
                </div>
              </div>
              <div className="text-center text-sm text-gray-700">
                <strong>Method:</strong> {paymentRecord.transactionCount} separate on-chain transactions to individual agent addresses
              </div>
            </div>

            {/* Agent Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2 text-green-800">Worker Agents (70%)</h4>
                <div className="space-y-2">
                  {paymentRecord.distribution
                    .filter((d: any) => d.agentId.includes('agent') && !d.agentId.includes('verifier'))
                    .map((dist: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                        <div>
                          <div className="text-sm font-medium">{dist.agentId}</div>
                          <div className="text-xs text-gray-500">{dist.walletAddress.substring(0, 12)}...</div>
                          <div className="text-xs text-blue-600">TX: {dist.transaction?.substring(0, 10)}...</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-600">${dist.amount.toFixed(6)}</div>
                          <div className="text-xs text-gray-500">{(dist.percentage * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2 text-green-800">Verifier Agents (25%)</h4>
                <div className="space-y-2">
                  {paymentRecord.distribution
                    .filter((d: any) => d.agentId.includes('verifier'))
                    .map((dist: any, index: number) => (
                      <div key={index} className="flex justify-between items-center p-2 bg-white rounded border">
                        <div>
                          <div className="text-sm font-medium">{dist.agentId}</div>
                          <div className="text-xs text-gray-500">{dist.walletAddress.substring(0, 12)}...</div>
                          <div className="text-xs text-blue-600">TX: {dist.transaction?.substring(0, 10)}...</div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-green-600">${dist.amount.toFixed(6)}</div>
                          <div className="text-xs text-gray-500">{(dist.percentage * 100).toFixed(2)}%</div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
            
            {/* Transaction Summary */}
            <div className="mt-4 p-3 bg-blue-50 rounded">
              <div className="grid grid-cols-2 gap-4 mb-2">
                <div className="text-sm text-blue-800">
                  <strong>Agent Transactions:</strong> {paymentRecord.transactionCount}
                </div>
                <div className="text-sm text-blue-800">
                  <strong>Platform Fee:</strong> ${paymentRecord.platformFee?.amount?.toFixed(6)} (5%)
                </div>
                <div className="text-sm text-blue-800">
                  <strong>Total to Agents:</strong> ${(paymentRecord.totalAmount * 0.95).toFixed(6)}
                </div>
                <div className="text-sm text-blue-800">
                  <strong>Agent Addresses:</strong> {paymentRecord.totalAgents}
                </div>
                {paymentRecord.initialTransaction && (
                  <div className="col-span-2 text-sm text-blue-800">
                    <strong>Initial TX:</strong> {paymentRecord.initialTransaction.substring(0, 20)}...
                  </div>
                )}
              </div>
              <div className="text-xs text-blue-600">
                Payment ID: {paymentRecord.timestamp}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Overview Dialog */}
      {showPaymentOverview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">💰 Agent Payment Overview</h2>
                  <p className="text-gray-600 mt-1">Review and approve payments to all contributing agents</p>
                </div>
                <button
                  onClick={() => setShowPaymentOverview(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                  disabled={isExecutingPayments}
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="p-6">
              {/* Payment Summary */}
              <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Payment Summary</h3>
                    <p className="text-sm text-gray-600">
                      {agentPaymentQueue.length} agents • {agentPaymentQueue.length} separate transactions • $1.00 total
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">$1.00</div>
                    <div className="text-sm text-gray-500">USDC</div>
                  </div>
                </div>
              </div>

              {/* Agent List */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Agent Payment Breakdown</h3>
                <div className="space-y-2">
                  {agentPaymentQueue.map((agent, index) => (
                    <div 
                      key={agent.agentId}
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        isExecutingPayments && index === currentPaymentIndex
                          ? 'bg-blue-50 border-blue-200 shadow-md'
                          : isExecutingPayments && index < currentPaymentIndex
                          ? 'bg-green-50 border-green-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          isExecutingPayments && index === currentPaymentIndex
                            ? 'bg-blue-500 text-white animate-pulse'
                            : isExecutingPayments && index < currentPaymentIndex
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-300 text-gray-600'
                        }`}>
                          {isExecutingPayments && index < currentPaymentIndex ? '✓' : index + 1}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {agent.agentId.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                          </div>
                          <div className="text-sm text-gray-500">
                            {agent.walletAddress.substring(0, 12)}...{agent.walletAddress.substring(30)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">${agent.amount.toFixed(4)}</div>
                        <div className="text-sm text-gray-500">{(agent.percentage * 100).toFixed(2)}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Progress */}
              {isExecutingPayments && (
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    <div>
                      <div className="font-medium text-blue-800">
                        🔗 Processing Real On-Chain Payment {currentPaymentIndex + 1} of {agentPaymentQueue.length}
                      </div>
                      <div className="text-sm text-blue-600">
                        {currentPaymentIndex < agentPaymentQueue.length 
                          ? `💳 Sending USDC to ${agentPaymentQueue[currentPaymentIndex]?.agentId} on Base Sepolia...`
                          : '🎉 Finalizing all payments...'
                        }
                      </div>
                      <div className="text-xs text-blue-500 mt-1">
                        ⚠️ Real blockchain transactions - may take 5-15 seconds each
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(currentPaymentIndex / agentPaymentQueue.length) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  <p>🔗 <strong>Real On-Chain Transactions:</strong> Each agent receives USDC directly</p>
                  <p>⚡ <strong>Base Sepolia Network:</strong> Payments executed automatically in sequence</p>
                  <p>📊 <strong>Transaction Details:</strong> View all TXs on BaseScan after completion</p>
                  <p className="text-xs text-amber-600 mt-1">
                    ⚠️ Requires OPERATOR_PRIVATE_KEY in environment for real transactions
                  </p>
                </div>
                <div className="space-x-3">
                  <button
                    onClick={() => setShowPaymentOverview(false)}
                    disabled={isExecutingPayments}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={executeAllAgentPayments}
                    disabled={isExecutingPayments}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {isExecutingPayments ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>Processing Real Payments...</span>
                      </>
                    ) : (
                      <>
                        <span>🚀</span>
                        <span>Execute Real On-Chain Payments</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment Dialog - Legacy (for backward compatibility) */}
      {isPaymentDialogOpen && paymentRequirements && (
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={() => setIsPaymentDialogOpen(false)}
          paymentRequirements={paymentRequirements}
          agentName={agentPaymentQueue.length > 0 && currentAgentIndex < agentPaymentQueue.length 
            ? `${agentPaymentQueue[currentAgentIndex]?.agentId} (${currentAgentIndex + 1}/${agentPaymentQueue.length})`
            : 'Agent Payment'
          }
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}

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