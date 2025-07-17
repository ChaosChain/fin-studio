'use client';

import { useState } from 'react';
import { useApp } from '@/app/providers';
import { PDFReportGenerator } from './PDFReportGenerator';
import { CostReport, CostSummary, RequestCost } from '@/components/CostReport';
import { PaymentDialog } from './PaymentDialog';
import { X402PaymentRequirements } from '@/types/payment';

interface WorkflowStep {
  id: string;
  agent: string;
  action: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  result?: any;
  duration?: number;
}

export function AgentWorkflow() {
  const { a2aClient, isConnected } = useApp();
  const [workflow, setWorkflow] = useState<WorkflowStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [currentSymbols, setCurrentSymbols] = useState<string[]>([]);
  const [stockInput, setStockInput] = useState('');
  const [inputError, setInputError] = useState('');
  const [costSummary, setCostSummary] = useState<CostSummary | null>(null);
  const [showCostReport, setShowCostReport] = useState(false);
  const [collectedCosts, setCollectedCosts] = useState<any[]>([]);
  const [hasPaidForReport, setHasPaidForReport] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [paymentRequirements, setPaymentRequirements] = useState<X402PaymentRequirements | null>(null);

  const AGENT_WALLET_ADDRESS = process.env.NEXT_PUBLIC_AGENT_WALLET_ADDRESS || '0x0000000000000000000000000000000000000000';

  const parseStockSymbols = (input: string): string[] => {
    // Remove extra spaces, convert to uppercase, and split by comma or space
    const symbols = input
      .trim()
      .toUpperCase()
      .replace(/\s+/g, ' ')
      .split(/[,\s]+/)
      .filter(symbol => symbol.length > 0);

    return symbols;
  };

  const validateStockSymbols = (symbols: string[]): boolean => {
    if (symbols.length === 0) {
      setInputError('Please enter at least one stock symbol');
      return false;
    }

    if (symbols.length > 10) {
      setInputError('Maximum 10 stock symbols allowed');
      return false;
    }

    // Basic validation: symbols should be 1-5 characters, all letters
    const invalidSymbols = symbols.filter(symbol =>
      !/^[A-Z]{1,5}$/.test(symbol)
    );

    if (invalidSymbols.length > 0) {
      setInputError(`Invalid symbols: ${invalidSymbols.join(', ')}. Use 1-5 letter symbols only.`);
      return false;
    }

    setInputError('');
    return true;
  };

  const aggregateCosts = (costs: any[]): CostSummary => {
    const agentCostMap = new Map<string, any>();

    costs.forEach(cost => {
      // Handle RequestCost structure (which has requestId instead of agentId)
      const agentId = cost.requestId ? cost.requestId.split('-')[0] : 'unknown';
      const agentName = getAgentName(agentId);

      if (!agentCostMap.has(agentId)) {
        agentCostMap.set(agentId, {
          agentId,
          agentName,
          requestCount: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalTokens: 0,
          totalCost: 0,
          averageCostPerRequest: 0,
          requests: []
        });
      }

      const agent = agentCostMap.get(agentId);
      agent.requestCount++;
      agent.totalInputTokens += cost.inputTokens || 0;
      agent.totalOutputTokens += cost.outputTokens || 0;
      agent.totalTokens += cost.totalTokens || 0;
      agent.totalCost += cost.totalCost || 0;
      agent.averageCostPerRequest = agent.totalCost / agent.requestCount;
      agent.requests.push(cost);
    });

    const agentCosts = Array.from(agentCostMap.values());
    const totalCost = agentCosts.reduce((sum, agent) => sum + agent.totalCost, 0);
    const totalRequests = agentCosts.reduce((sum, agent) => sum + agent.requestCount, 0);
    const totalInputTokens = agentCosts.reduce((sum, agent) => sum + agent.totalInputTokens, 0);
    const totalOutputTokens = agentCosts.reduce((sum, agent) => sum + agent.totalOutputTokens, 0);
    const totalTokens = agentCosts.reduce((sum, agent) => sum + agent.totalTokens, 0);

    const inputCost = costs.reduce((sum, cost) => sum + (cost.inputCost || 0), 0);
    const outputCost = costs.reduce((sum, cost) => sum + (cost.outputCost || 0), 0);

    return {
      totalCost,
      totalRequests,
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

  const runFullWorkflow = async () => {
    if (!a2aClient || !isConnected) return;

    const symbols = parseStockSymbols(stockInput);

    if (!validateStockSymbols(symbols)) {
      return;
    }

    setIsRunning(true);
    setCurrentSymbols(symbols);
    setCollectedCosts([]); // Reset costs for new workflow

    const steps: WorkflowStep[] = [
      { id: '1', agent: 'market-research-agent', action: 'analyze_market_sentiment', status: 'pending' },
      { id: '2', agent: 'macro-research-agent', action: 'analyze_economic_indicators', status: 'pending' },
      { id: '3', agent: 'price-analysis-agent', action: 'get_market_data', status: 'pending' },
      { id: '4', agent: 'insights-agent', action: 'generate_daily_insight', status: 'pending' }
    ];

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

  const handleQuickSelect = (symbols: string) => {
    setStockInput(symbols);
    setInputError('');
  };

  // Payment requirements for $1 USDC on Base Sepolia
  const getReportPaymentRequirements = (): X402PaymentRequirements => ({
    scheme: 'exact',
    network: 'base-sepolia',
    maxAmountRequired: (1 * 1000000).toString(), // $1 USDC in 6 decimals
    resource: '/report/download',
    description: 'Download AI Agent Report',
    mimeType: 'application/pdf',
    payTo: AGENT_WALLET_ADDRESS, // Use env variable here
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

      {/* Stock Input Section */}
      <div className="mb-6 space-y-4">
        <div>
          <label htmlFor="stock-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Enter Stock Symbols
          </label>
          <input
            id="stock-input"
            type="text"
            value={stockInput}
            onChange={(e) => setStockInput(e.target.value)}
            placeholder="e.g., AAPL, GOOGL, MSFT or TSLA NVDA"
            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            disabled={isRunning}
          />
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Separate multiple symbols with commas or spaces (max 10 symbols)
          </p>
          {inputError && (
            <p className="text-sm text-red-500 mt-1">{inputError}</p>
          )}
        </div>

        {/* Quick Select Examples */}
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Select:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleQuickSelect('AAPL')}
              className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full hover:bg-blue-200 dark:hover:bg-blue-800"
              disabled={isRunning}
            >
              AAPL (Apple)
            </button>
            <button
              onClick={() => handleQuickSelect('GOOGL, MSFT, AAPL')}
              className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full hover:bg-green-200 dark:hover:bg-green-800"
              disabled={isRunning}
            >
              Big Tech (GOOGL, MSFT, AAPL)
            </button>
            <button
              onClick={() => handleQuickSelect('TSLA, NVDA, AMD')}
              className="px-3 py-1 text-sm bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800"
              disabled={isRunning}
            >
              Growth Stocks (TSLA, NVDA, AMD)
            </button>
            <button
              onClick={() => handleQuickSelect('SPY, QQQ, IWM')}
              className="px-3 py-1 text-sm bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 rounded-full hover:bg-orange-200 dark:hover:bg-orange-800"
              disabled={isRunning}
            >
              ETFs (SPY, QQQ, IWM)
            </button>
          </div>
        </div>

        {/* Run Button */}
        <button
          onClick={runFullWorkflow}
          disabled={!isConnected || isRunning || !stockInput.trim()}
          className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
        >
          {isRunning ? (
            <>
              <div className="loading-spinner h-4 w-4"></div>
              <span>Running Workflow...</span>
            </>
          ) : (
            <>
              <span>🚀</span>
              <span>Run A2A Workflow</span>
            </>
          )}
        </button>
      </div>

      {workflow.length === 0 && (
        <div className="text-center py-8 text-gray-600 dark:text-gray-400">
          <p className="text-lg mb-2">Ready to demonstrate agent communication</p>
          <p className="text-sm">Enter stock symbols above and click "Run A2A Workflow" to see agents collaborate in real-time</p>
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
                <div className="flex items-center space-x-2">
                  <h3 className="font-medium">{getAgentName(step.agent)}</h3>
                  <span className="text-sm text-gray-600 dark:text-gray-400">→</span>
                  <span className="text-sm font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {step.action}
                  </span>
                </div>

                {step.duration && (
                  <p className="text-xs text-gray-500 mt-1">
                    Completed in {step.duration}ms
                  </p>
                )}

                {step.result && step.status === 'completed' && (
                  <div className="mt-2 p-2 bg-green-50 dark:bg-green-900/20 rounded text-xs">
                    <p className="font-medium text-green-800 dark:text-green-400">Agent Response:</p>
                    <p className="text-green-700 dark:text-green-300 mt-1">
                      {typeof step.result === 'object' ?
                        `Success: ${Object.keys(step.result).join(', ')}` :
                        step.result.toString()
                      }
                    </p>
                  </div>
                )}
              </div>

              <div className={`flex-shrink-0 flex items-center space-x-2 ${getStatusColor(step.status)}`}>
                <span className="text-lg">{getStatusIcon(step.status)}</span>
                <span className="text-sm font-medium capitalize">{step.status}</span>
              </div>
            </div>
          ))}

          {/* PDF Export - only show after successful completion */}
          {workflow.length > 0 && workflow.every(step => step.status === 'completed') && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              {hasPaidForReport ? (
                <PDFReportGenerator
                  workflow={workflow}
                  symbols={currentSymbols}
                />
              ) : (
                <button
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 flex items-center space-x-2 transition-all duration-200 transform hover:scale-105"
                  onClick={handleRequirePayment}
                >
                  <span>💳</span>
                  <span>Pay $1 USDC to Download Report</span>
                </button>
              )}
            </div>
          )}

          {/* Cost Report - only show after successful completion */}
          {workflow.length > 0 && workflow.every(step => step.status === 'completed') && (
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <CostReport
                costSummary={costSummary}
                isVisible={showCostReport}
              />
            </div>
          )}
        </div>
      )}
      {/* PaymentDialog for report download */}
      {paymentRequirements && (
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={() => setIsPaymentDialogOpen(false)}
          paymentRequirements={paymentRequirements}
          agentName="Report Download"
          onPaymentSuccess={handlePaymentSuccess}
          onPaymentError={handlePaymentError}
        />
      )}
    </div>
  );
} 