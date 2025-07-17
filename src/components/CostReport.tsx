import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, DollarSign, Clock, Zap } from 'lucide-react';

export interface CostSummary {
  totalCost: number;
  totalRequests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  agentCosts: AgentCost[];
  costBreakdown: {
    inputCost: number;
    outputCost: number;
  };
  sessionStart: Date | string;
  sessionEnd?: Date | string;
}

export interface AgentCost {
  agentId: string;
  agentName: string;
  requestCount: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  averageCostPerRequest: number;
  requests: any[];
}

export interface RequestCost {
  requestId: string;
  timestamp: Date | string;
  action: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  duration: number;
}

interface CostReportProps {
  costSummary: CostSummary | null;
  isVisible: boolean;
}

export function CostReport({ costSummary, isVisible }: CostReportProps) {
  console.log('🔍 CostReport - Props:', { costSummary, isVisible });
  if (!isVisible || !costSummary) {
    console.log('🔍 CostReport - Not rendering:', { isVisible, hasCostSummary: !!costSummary });
    return null;
  }

  const formatCost = (cost: number) => `$${cost.toFixed(6)}`;
  const formatTokens = (tokens: number) => tokens.toLocaleString();
  const formatDuration = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

  // Convert date strings to Date objects if needed
  const sessionStart = typeof costSummary.sessionStart === 'string' ? 
    new Date(costSummary.sessionStart) : costSummary.sessionStart;
  const sessionEnd = costSummary.sessionEnd ? 
    (typeof costSummary.sessionEnd === 'string' ? 
      new Date(costSummary.sessionEnd) : costSummary.sessionEnd) : null;

  const sessionDuration = sessionEnd ? 
    (sessionEnd.getTime() - sessionStart.getTime()) / 1000 : 0;

  return (
    <div className="space-y-6 mt-6">
      <div className="flex items-center gap-2">
        <DollarSign className="h-5 w-5 text-green-600" />
        <h3 className="text-lg font-semibold">OpenAI API Cost Report</h3>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCost(costSummary.totalCost)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatTokens(costSummary.totalTokens)}
            </div>
            <div className="text-xs text-gray-500">
              {formatTokens(costSummary.totalInputTokens)} in / {formatTokens(costSummary.totalOutputTokens)} out
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">API Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {costSummary.totalRequests}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-gray-600">Session Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDuration(sessionDuration * 1000)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Cost Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm">Input Tokens ({formatTokens(costSummary.totalInputTokens)})</span>
              <span className="font-mono text-sm">{formatCost(costSummary.costBreakdown.inputCost)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm">Output Tokens ({formatTokens(costSummary.totalOutputTokens)})</span>
              <span className="font-mono text-sm">{formatCost(costSummary.costBreakdown.outputCost)}</span>
            </div>
            <div className="border-t pt-2">
              <div className="flex justify-between items-center font-semibold">
                <span>Total</span>
                <span className="font-mono">{formatCost(costSummary.totalCost)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agent Costs */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Agent Usage</CardTitle>
          <CardDescription>Cost breakdown by agent</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {costSummary.agentCosts
              .sort((a, b) => b.totalCost - a.totalCost)
              .map((agent) => (
                <div key={agent.agentId} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-sm">{agent.agentName}</h4>
                      <p className="text-xs text-gray-500">{agent.requestCount} requests</p>
                    </div>
                    <Badge variant="secondary" className="font-mono text-xs">
                      {formatCost(agent.totalCost)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-gray-500">Avg/Request:</span>
                      <span className="ml-1 font-mono">{formatCost(agent.averageCostPerRequest)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Total Tokens:</span>
                      <span className="ml-1">{formatTokens(agent.totalTokens)}</span>
                    </div>
                  </div>

                  {/* Recent Requests */}
                  {agent.requests.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <h5 className="text-xs font-semibold mb-2">Recent Requests:</h5>
                      <div className="space-y-1">
                        {agent.requests.slice(-3).map((req, idx) => (
                          <div key={idx} className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <Clock className="h-3 w-3 text-gray-400" />
                              <span className="capitalize">{(req.action || req.requestId || 'unknown').replace(/_/g, ' ')}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500">{formatTokens(req.totalTokens || 0)} tokens</span>
                              <span className="font-mono">{formatCost(req.totalCost || 0)}</span>
                              <span className="text-gray-400">{req.duration || 0}ms</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Usage Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Usage Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              <span>
                Output tokens are 3x more expensive than input tokens for GPT-4
              </span>
            </div>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span>
                Cost per request ranges from {formatCost(Math.min(...costSummary.agentCosts.map(a => a.averageCostPerRequest)))} to {formatCost(Math.max(...costSummary.agentCosts.map(a => a.averageCostPerRequest)))}
              </span>
            </div>
            {costSummary.agentCosts.length > 0 && (
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-orange-500" />
                <span>
                  Most expensive agent: {costSummary.agentCosts.sort((a, b) => b.totalCost - a.totalCost)[0].agentName}
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 