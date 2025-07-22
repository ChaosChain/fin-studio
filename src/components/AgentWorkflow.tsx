'use client';

import { useState } from 'react';
import { useApp } from '@/app/providers';
import { PDFReportGenerator } from './PDFReportGenerator';
import { CostReport, CostSummary, RequestCost } from '@/components/CostReport';
import { PaymentDialog } from './PaymentDialog';
import { ChatInterface } from './ChatInterface';
import { X402PaymentRequirements } from '@/types/payment';

interface WorkflowStep {
  id: string;
  agent: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  componentType?: string;
  result?: any;
  duration?: number;
}

export function AgentWorkflow() {
  const { a2aClient, isConnected } = useApp();
  const [workflow, setWorkflow] = useState<WorkflowStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSymbols, setCurrentSymbols] = useState<string[]>([]);
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null);
  const [showCostReport, setShowCostReport] = useState(false);
  const [collectedCosts, setCollectedCosts] = useState<any[]>([]);
  const [hasPaidForReport, setHasPaidForReport] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentRequirements, setPaymentRequirements] = useState<X402PaymentRequirements | null>(null);

  const AGENT_WALLET_ADDRESS = process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000';

  const aggregateCosts = (costs: RequestCost[]): CostSummary => {
    console.log('🔍 Frontend - Aggregating costs:', costs);
    
    if (!costs || costs.length === 0) {
      return {
        totalCost: 0,
        totalRequests: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        agentCosts: [],
        costBreakdown: {
          inputCost: 0,
          outputCost: 0
        },
        sessionStart: new Date(),
        sessionEnd: new Date()
      };
    }

    const totalCost = costs.reduce((sum, cost) => sum + cost.totalCost, 0);
    const totalInputTokens = costs.reduce((sum, cost) => sum + cost.inputTokens, 0);
    const totalOutputTokens = costs.reduce((sum, cost) => sum + cost.outputTokens, 0);
    const totalTokens = totalInputTokens + totalOutputTokens;

    const inputCost = costs.reduce((sum, cost) => sum + cost.inputCost, 0);
    const outputCost = costs.reduce((sum, cost) => sum + cost.outputCost, 0);

    const agentCosts = costs.map((cost, index) => ({
      agentId: `agent-${index}`,
      agentName: `Agent ${index + 1}`,
      requestCount: 1,
      totalInputTokens: cost.inputTokens,
      totalOutputTokens: cost.outputTokens,
      totalTokens: cost.totalTokens || cost.inputTokens + cost.outputTokens,
      totalCost: cost.totalCost,
      averageCostPerRequest: cost.totalCost,
      requests: [cost]
    }));

    return {
      totalCost,
      totalRequests: costs.length,
      totalInputTokens,
      totalOutputTokens,
      totalTokens,
      agentCosts,
      costBreakdown: {
        inputCost,
        outputCost
      },
      sessionStart: new Date(),
      sessionEnd: new Date()
    };
  };

  const handleAnalysisRequest = (symbols: string[], intent: string, analysisType: string) => {
    if (!a2aClient || !isConnected) return;
    
    setCurrentSymbols(symbols);
    runFullWorkflow(symbols);
  };

  const runFullWorkflow = async (symbols: string[]) => {
    if (!a2aClient || !isConnected) return;

    setIsRunning(true);
    setCollectedCosts([]); // Reset costs for new workflow

    // Define two causality flows for demo
    const causalityFlows: WorkflowStep[][] = [
      // Flow 1: sentiment -> macro -> technical -> insights
      [
        { id: '1', agent: 'market-research-agent', action: 'analyze_market_sentiment', status: 'pending' as const, componentType: 'sentiment' },
        { id: '2', agent: 'macro-research-agent', action: 'analyze_economic_indicators', status: 'pending' as const, componentType: 'macro' },
        { id: '3', agent: 'price-analysis-agent', action: 'get_market_data', status: 'pending' as const, componentType: 'technical' },
        { id: '4', agent: 'insights-agent', action: 'generate_daily_insight', status: 'pending' as const, componentType: 'insights' }
      ],
      // Flow 2: technical -> sentiment -> macro -> insights
      [
        { id: '1', agent: 'price-analysis-agent', action: 'get_market_data', status: 'pending' as const, componentType: 'technical' },
        { id: '2', agent: 'market-research-agent', action: 'analyze_market_sentiment', status: 'pending' as const, componentType: 'sentiment' },
        { id: '3', agent: 'macro-research-agent', action: 'analyze_economic_indicators', status: 'pending' as const, componentType: 'macro' },
        { id: '4', agent: 'insights-agent', action: 'generate_daily_insight', status: 'pending' as const, componentType: 'insights' }
      ]
    ];
    
    // Alternate between flows or choose randomly
    const selectedFlow = Math.random() > 0.5 ? 0 : 1;
    const steps: WorkflowStep[] = causalityFlows[selectedFlow];
    
    console.log(`🔄 Using Causality Flow ${selectedFlow + 1}: ${steps.map(s => s.componentType).join(' → ')}`);
    

    setWorkflow(steps);
    const sessionStart = new Date();

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const startTime = Date.now();

      // Update step to running
      setWorkflow(prev => prev.map(s =>
        s.id === step.id ? { ...s, status: 'running' } : s
      ));

      try {
        console.log(`🚀 Step ${i + 1}: Executing ${step.action} on ${step.agent}`);

        const result = await a2aClient.sendMessage(step.agent, step.action, { symbols });
        const duration = Date.now() - startTime;

        // Extract cost information if available
        console.log('🔍 Frontend - Checking result for cost info:', {
          hasData: !!result.data,
          hasCostInfo: !!(result.data && result.data.costInfo),
          resultKeys: result.data ? Object.keys(result.data) : [],
          costInfo: result.data?.costInfo
        });

        if (result.data && result.data.costInfo) {
          const costInfo = result.data.costInfo;
          console.log('🔍 Frontend - Adding cost info to collection:', costInfo);
          setCollectedCosts(prev => {
            const newCosts = [...prev, costInfo];
            console.log('🔍 Frontend - Updated collected costs:', newCosts);
            return newCosts;
          });
          console.log(`💰 Frontend - Cost tracked: ${costInfo.totalCost.toFixed(6)} (${costInfo.totalTokens} tokens)`);
        } else {
          console.log('⚠️ Frontend - No cost info found in result');
        }

        // Update step to completed
        setWorkflow(prev => prev.map(s =>
          s.id === step.id ? {
            ...s,
            status: 'completed',
            result: result.data,
            duration
          } : s
        ));

        console.log(`✅ Step ${i + 1} completed in ${duration}ms:`, result);

        // Wait a bit before next step for visual effect
        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error) {
        console.error(`❌ Step ${i + 1} failed:`, error);

        setWorkflow(prev => prev.map(s =>
          s.id === step.id ? {
            ...s,
            status: 'error',
            duration: Date.now() - startTime
          } : s
        ));
        break;
      }
    }

    setIsRunning(false);

    // Generate cost summary after workflow completion
    setCollectedCosts(currentCosts => {
      console.log('🔍 Frontend - Generating cost summary with costs:', currentCosts);
      const costData = aggregateCosts(currentCosts);
      costData.sessionStart = sessionStart;
      costData.sessionEnd = new Date();
      console.log('🔍 Frontend - Generated cost summary:', costData);
      setCostSummary(costData);
      setShowCostReport(true);
      console.log('🔍 Frontend - Set showCostReport to true');
      return currentCosts;
    });
  };

  const getAgentIcon = (agentId: string) => {
    const icons: Record<string, string> = {
      'market-research-agent': '📊',
      'macro-research-agent': '🌍',
      'price-analysis-agent': '📈',
      'insights-agent': '📝'
    };
    return icons[agentId] || '🤖';
  };

  const getAgentName = (agentId: string) => {
    const names: Record<string, string> = {
      'market-research-agent': 'Market Research',
      'macro-research-agent': 'Macro Research',
      'price-analysis-agent': 'Price Analysis',
      'insights-agent': 'Insights Generator'
    };
    return names[agentId] || agentId;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-gray-500';
      case 'running': return 'text-blue-500';
      case 'completed': return 'text-green-500';
      case 'error': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'completed': return '✅';
      case 'error': return '❌';
      default: return '⏳';
    }
  };

  // Payment requirements for $1 USDC on Base Sepolia
  const getReportPaymentRequirements = (): X402PaymentRequirements => ({
    scheme: 'exact',
    network: 'base-sepolia',
    maxAmountRequired: (1 * 1000000).toString(), // $1 USDC in 6 decimals
    resource: '/report/download',
    description: 'Download AI Agent Report',
    mimeType: 'application/pdf',
    payTo: AGENT_WALLET_ADDRESS as `0x${string}`, // Use env variable here
    maxTimeoutSeconds: 300,
    asset: '0x036CbD53842c5426634e7929541eC2318f3dCF7e', // USDC on Base Sepolia
    extra: { name: 'USD Coin', version: '2' }
  });

  // Handler to trigger payment dialog
  const handleRequirePayment = () => {
    setPaymentRequirements(getReportPaymentRequirements());
    setIsPaymentDialogOpen(true);
  };

  // Handler for successful payment
  const handlePaymentSuccess = (txHash: string) => {
    setHasPaidForReport(true);
    setIsPaymentDialogOpen(false);
  };

  // Handler for payment error
  const handlePaymentError = (error: string) => {
    setIsPaymentDialogOpen(false);
    alert(`Payment failed: ${error}`);
  };

  return (
    <div className="glass-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Agent Communication Workflow</h2>
      </div>

      {/* Chat Interface Section */}
      <div className="mb-6">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
            💬 Chat with AI Analysis Assistant
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Ask me to analyze specific stocks or cryptocurrencies using natural language
          </p>
        </div>
        <div className="h-64">
          <ChatInterface 
            onAnalysisRequest={handleAnalysisRequest}
            isAnalyzing={isRunning}
            disabled={!isConnected}
          />
        </div>
      </div>

      {workflow.length === 0 && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          <p className="text-lg mb-2">Ready to demonstrate agent communication</p>
          <p className="text-sm">Ask the AI assistant about specific stocks or crypto to see agents collaborate in real-time</p>
        </div>
      )}

      {workflow.length > 0 && (
        <div className="space-y-4">
          {/* Show selected symbols */}
          {currentSymbols.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                Analyzing: {currentSymbols.join(', ')}
              </p>
            </div>
          )}

          {workflow.map((step, index) => (
            <div key={step.id} className="flex items-center space-x-4 p-4 bg-white/50 dark:bg-slate-800/50 rounded-lg">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 text-white flex items-center justify-center text-sm font-bold">
                {index + 1}
              </div>

              <div className="flex-shrink-0 text-2xl">
                {getAgentIcon(step.agent)}
              </div>

              <div className="flex-grow">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{getAgentName(step.agent)}</h3>
                  <div className={`flex items-center space-x-2 ${getStatusColor(step.status)}`}>
                    <span>{getStatusIcon(step.status)}</span>
                    <span className="text-sm capitalize">{step.status}</span>
                    {step.duration && (
                      <span className="text-xs text-gray-500">({step.duration}ms)</span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{step.action.replace(/_/g, ' ')}</p>
                
                {step.result && (
                  <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded text-xs">
                    <p className="font-medium">Result:</p>
                    <p className="truncate">{JSON.stringify(step.result).substring(0, 100)}...</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cost Report Section */}
      {showCostReport && costSummary && (
        <div className="mt-8 space-y-4">
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold mb-4">💰 Workflow Cost Analysis</h3>
            <CostReport 
              costSummary={costSummary} 
              isVisible={showCostReport}
            />
          </div>
          
          {costSummary && hasPaidForReport && (
            <div className="mt-4">
              <PDFReportGenerator 
                workflow={workflow}
                symbols={currentSymbols}
              />
            </div>
          )}
        </div>
      )}

      {/* Payment Dialog */}
      {paymentRequirements && (
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={() => setIsPaymentDialogOpen(false)}
          paymentRequirements={paymentRequirements}
          agentName="Analysis Report"
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}
    </div>
  );
} 