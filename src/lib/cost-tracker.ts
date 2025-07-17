// Cost tracking system for OpenAI API usage
export interface TokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
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
  requests: RequestCost[];
}

export interface RequestCost {
  requestId: string;
  timestamp: Date;
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
  sessionStart: Date;
  sessionEnd?: Date;
}

export class CostTracker {
  private static instance: CostTracker;
  private agentCosts: Map<string, AgentCost> = new Map();
  private sessionStart: Date = new Date();
  
  // GPT-4.1 pricing (as of 2025)
  private readonly GPT41_INPUT_COST_PER_TOKEN = 0.000002; // $2.00 per 1,000,000 tokens
  private readonly GPT41_OUTPUT_COST_PER_TOKEN = 0.000008; // $8.00 per 1,000,000 tokens
  
  // GPT-4 pricing (legacy)
  private readonly GPT4_INPUT_COST_PER_TOKEN = 0.00001; // $0.01 per 1,000 tokens
  private readonly GPT4_OUTPUT_COST_PER_TOKEN = 0.00003; // $0.03 per 1,000 tokens
  
  // GPT-4o pricing (newer model)
  private readonly GPT4O_INPUT_COST_PER_TOKEN = 0.000005; // $5 per 1,000,000 tokens
  private readonly GPT4O_OUTPUT_COST_PER_TOKEN = 0.000015; // $15 per 1,000,000 tokens

  private constructor() {}

  public static getInstance(): CostTracker {
    if (!CostTracker.instance) {
      CostTracker.instance = new CostTracker();
    }
    return CostTracker.instance;
  }

  public trackRequest(
    agentId: string,
    agentName: string,
    requestId: string,
    action: string,
    model: string,
    usage: TokenUsage,
    duration: number
  ): RequestCost {
    console.log('💰 Cost Tracker - trackRequest called:', {
      agentId,
      agentName,
      action,
      model,
      usage,
      duration
    });
    
    // Determine pricing based on model
    let inputCostPerToken: number;
    let outputCostPerToken: number;
    
    if (model.includes('gpt-4.1')) {
      inputCostPerToken = this.GPT41_INPUT_COST_PER_TOKEN;
      outputCostPerToken = this.GPT41_OUTPUT_COST_PER_TOKEN;
    } else if (model.includes('gpt-4o')) {
      inputCostPerToken = this.GPT4O_INPUT_COST_PER_TOKEN;
      outputCostPerToken = this.GPT4O_OUTPUT_COST_PER_TOKEN;
    } else {
      // Default to GPT-4 pricing for other models
      inputCostPerToken = this.GPT4_INPUT_COST_PER_TOKEN;
      outputCostPerToken = this.GPT4_OUTPUT_COST_PER_TOKEN;
    }

    const inputCost = usage.input_tokens * inputCostPerToken;
    const outputCost = usage.output_tokens * outputCostPerToken;
    const totalCost = inputCost + outputCost;

    console.log('💰 Cost Tracker - Cost calculation:', {
      model,
      inputCostPerToken,
      outputCostPerToken,
      inputCost,
      outputCost,
      totalCost
    });

    const requestCost: RequestCost = {
      requestId,
      timestamp: new Date(),
      action,
      model,
      inputTokens: usage.input_tokens,
      outputTokens: usage.output_tokens,
      totalTokens: usage.total_tokens,
      inputCost,
      outputCost,
      totalCost,
      duration
    };

    // Update agent costs
    let agentCost = this.agentCosts.get(agentId);
    if (!agentCost) {
      agentCost = {
        agentId,
        agentName,
        requestCount: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTokens: 0,
        totalCost: 0,
        averageCostPerRequest: 0,
        requests: []
      };
      this.agentCosts.set(agentId, agentCost);
      console.log('💰 Cost Tracker - Created new agent cost entry:', agentId);
    }

    agentCost.requestCount++;
    agentCost.totalInputTokens += usage.input_tokens;
    agentCost.totalOutputTokens += usage.output_tokens;
    agentCost.totalTokens += usage.total_tokens;
    agentCost.totalCost += totalCost;
    agentCost.averageCostPerRequest = agentCost.totalCost / agentCost.requestCount;
    agentCost.requests.push(requestCost);

    console.log('💰 Cost Tracker - Updated agent cost:', {
      agentId,
      requestCount: agentCost.requestCount,
      totalCost: agentCost.totalCost,
      totalTokens: agentCost.totalTokens
    });

    return requestCost;
  }

  public getAgentCost(agentId: string): AgentCost | undefined {
    return this.agentCosts.get(agentId);
  }

  public getAllAgentCosts(): AgentCost[] {
    return Array.from(this.agentCosts.values());
  }

  public getCostSummary(): CostSummary {
    const agentCosts = this.getAllAgentCosts();
    
    const totalCost = agentCosts.reduce((sum, agent) => sum + agent.totalCost, 0);
    const totalRequests = agentCosts.reduce((sum, agent) => sum + agent.requestCount, 0);
    const totalInputTokens = agentCosts.reduce((sum, agent) => sum + agent.totalInputTokens, 0);
    const totalOutputTokens = agentCosts.reduce((sum, agent) => sum + agent.totalOutputTokens, 0);
    const totalTokens = agentCosts.reduce((sum, agent) => sum + agent.totalTokens, 0);
    
    const inputCost = agentCosts.reduce((sum, agent) => {
      return sum + agent.requests.reduce((reqSum, req) => reqSum + req.inputCost, 0);
    }, 0);
    
    const outputCost = agentCosts.reduce((sum, agent) => {
      return sum + agent.requests.reduce((reqSum, req) => reqSum + req.outputCost, 0);
    }, 0);

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
      sessionStart: this.sessionStart,
      sessionEnd: new Date()
    };
  }

  public reset(): void {
    this.agentCosts.clear();
    this.sessionStart = new Date();
  }

  public formatCost(cost: number): string {
    return `$${cost.toFixed(6)}`;
  }

  public formatTokens(tokens: number): string {
    return tokens.toLocaleString();
  }

  public generateReport(): string {
    const summary = this.getCostSummary();
    const duration = summary.sessionEnd ? 
      (summary.sessionEnd.getTime() - summary.sessionStart.getTime()) / 1000 : 0;

    let report = `\n=== OpenAI API Cost Report ===\n`;
    report += `Session Duration: ${duration.toFixed(1)}s\n`;
    report += `Total Requests: ${summary.totalRequests}\n`;
    report += `Total Cost: ${this.formatCost(summary.totalCost)}\n`;
    report += `Total Tokens: ${this.formatTokens(summary.totalTokens)}\n`;
    report += `  - Input Tokens: ${this.formatTokens(summary.totalInputTokens)} (${this.formatCost(summary.costBreakdown.inputCost)})\n`;
    report += `  - Output Tokens: ${this.formatTokens(summary.totalOutputTokens)} (${this.formatCost(summary.costBreakdown.outputCost)})\n\n`;

    report += `=== Agent Breakdown ===\n`;
    
    // Sort agents by cost (highest first)
    const sortedAgents = summary.agentCosts.sort((a, b) => b.totalCost - a.totalCost);
    
    for (const agent of sortedAgents) {
      report += `\n${agent.agentName}:\n`;
      report += `  Requests: ${agent.requestCount}\n`;
      report += `  Total Cost: ${this.formatCost(agent.totalCost)}\n`;
      report += `  Avg Cost/Request: ${this.formatCost(agent.averageCostPerRequest)}\n`;
      report += `  Input Tokens: ${this.formatTokens(agent.totalInputTokens)}\n`;
      report += `  Output Tokens: ${this.formatTokens(agent.totalOutputTokens)}\n`;
      report += `  Total Tokens: ${this.formatTokens(agent.totalTokens)}\n`;
      
      // Show individual requests
      if (agent.requests.length > 0) {
        report += `  Recent Requests:\n`;
        const recentRequests = agent.requests.slice(-3); // Show last 3 requests
        for (const req of recentRequests) {
          report += `    ${req.action}: ${this.formatCost(req.totalCost)} (${this.formatTokens(req.totalTokens)} tokens, ${req.duration}ms)\n`;
        }
      }
    }

    return report;
  }
}

// Utility function to extract token usage from OpenAI response
export function extractTokenUsage(response: any): TokenUsage {
  if (!response.usage) {
    console.warn('⚠️ No usage data found in OpenAI response');
    return {
      input_tokens: 0,
      output_tokens: 0,
      total_tokens: 0
    };
  }

  return {
    input_tokens: response.usage.prompt_tokens || 0,
    output_tokens: response.usage.completion_tokens || 0,
    total_tokens: response.usage.total_tokens || 0
  };
}

// Global cost tracker instance
export const costTracker = CostTracker.getInstance();

// Utility function to log API call details for debugging
export function logApiCallDetails(
  agentName: string,
  action: string,
  model: string,
  prompt: string,
  response: any,
  duration: number
) {
  const usage = extractTokenUsage(response);
  const cost = costTracker.trackRequest(
    agentName.toLowerCase().replace(/\s+/g, '-'),
    agentName,
    `${agentName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}`,
    action,
    model,
    usage,
    duration
  );

  console.log(`💰 ${agentName} - API Call Details:`, {
    action,
    model,
    promptLength: prompt.length,
    responseLength: response.choices?.[0]?.message?.content?.length || 0,
    usage,
    cost: costTracker.formatCost(cost.totalCost),
    duration: `${duration}ms`
  });

  return cost;
} 