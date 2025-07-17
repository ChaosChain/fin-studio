import express from 'express';
import cors from 'cors';
import { AgentIdentity } from '../../types/a2a';

interface AgentEndpoint {
  id: string;
  name: string;
  port: number;
  url: string;
}

export class A2AHttpGateway {
  private app: express.Application;
  private agents: Map<string, AgentEndpoint>;

  constructor() {
    this.app = express();
    this.agents = new Map();
    this.setupMiddleware();
    this.setupRoutes();
  }

  private setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
  }

  private setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'healthy', agents: Array.from(this.agents.values()) });
    });

    // Discover agents
    this.app.get('/agents', (req, res) => {
      const agentList = Array.from(this.agents.values()).map(agent => ({
        id: agent.id,
        name: agent.name,
        type: agent.id.replace('-agent', '').replace('-', '_'),
        version: '1.0.0',
        capabilities: this.getAgentCapabilities(agent.id)
      }));
      res.json({ agents: agentList });
    });

    // Send message to agent
    this.app.post('/message/:agentId', async (req, res) => {
      try {
        const { agentId } = req.params;
        const { action, data } = req.body;
        
        // Simulate agent processing
        const response = await this.simulateAgentResponse(agentId, action, data);
        res.json(response);
      } catch (error) {
        console.error('Error sending message:', error);
        res.status(500).json({ error: 'Failed to send message' });
      }
    });
  }

  private getAgentCapabilities(agentId: string): string[] {
    const capabilityMap: Record<string, string[]> = {
      'market-research-agent': ['market_analysis', 'news_sentiment', 'trend_analysis'],
      'macro-research-agent': ['economic_indicators', 'policy_analysis', 'global_trends'],
      'price-analysis-agent': ['technical_analysis', 'price_data', 'chart_patterns'],
      'insights-agent': ['daily_insights', 'report_generation', 'coordination']
    };
    return capabilityMap[agentId] || [];
  }

  private async simulateAgentResponse(agentId: string, action: string, data: any) {
    try {
      // Get agent endpoint - use HTTP ports (WebSocket port + 1000)
      const agent = this.agents.get(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      // Use HTTP port (WebSocket port + 1000)
      const httpPort = agent.port + 1000;
      const httpUrl = `http://localhost:${httpPort}`;

      console.log(`🔗 Gateway - Forwarding to ${agentId} at ${httpUrl}`);
      
      // Call the actual agent via HTTP
      const response = await fetch(`${httpUrl}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          data
        })
      });

      if (!response.ok) {
        throw new Error(`Agent ${agentId} request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log(`✅ Gateway - Response from ${agentId}:`, result);
      
      return {
        success: true,
        agent: agentId,
        action,
        timestamp: new Date().toISOString(),
        data: result
      };
    } catch (error) {
      console.error(`❌ Gateway - Error calling agent ${agentId}:`, error);
      
      // Fallback to simulation if agent is not available
      console.log(`⚠️ Gateway - Falling back to simulation for ${agentId}`);
      return this.fallbackSimulation(agentId, action, data);
    }
  }

  private fallbackSimulation(agentId: string, action: string, data: any) {
    // Simulate processing delay
    const timestamp = new Date().toISOString();
    const symbols = data?.symbols || ['AAPL', 'GOOGL', 'MSFT', 'TSLA'];

    switch (agentId) {
      case 'market-research-agent':
    return {
      success: true,
      agent: 'market-research-agent',
      action,
      timestamp,
      data: {
        symbols,
        analysis: {
          sentiment: 'positive',
          trends: ['AI adoption increasing', 'Tech sector showing strength', 'Market optimism rising'],
          news_summary: 'Major tech companies showing strong performance with AI integration driving growth.',
          confidence: 0.85
        }
      }
    };
      case 'macro-research-agent':
    return {
      success: true,
      agent: 'macro-research-agent',
      action,
      timestamp,
      data: {
        indicators: {
          gdp_growth: 2.1,
          inflation: 3.2,
          unemployment: 3.7,
          interest_rates: 5.25
        },
        analysis: 'Economic indicators show steady growth with controlled inflation. Fed policy remains supportive.',
        outlook: 'positive'
      }
    };
      case 'price-analysis-agent':
                 const mockData = symbols.map((symbol: string) => ({
      symbol,
      name: this.getCompanyName(symbol),
      price: 150 + Math.random() * 200,
      change: (Math.random() - 0.5) * 10,
      changePercent: (Math.random() - 0.5) * 5,
      volume: Math.floor(Math.random() * 100000000),
      timestamp: new Date(),
      source: 'price-analysis-agent'
    }));

    return {
      success: true,
      agent: 'price-analysis-agent',
      action,
      timestamp,
      data: {
        symbols,
        marketData: mockData,
        technicalAnalysis: {
          trend: 'bullish',
          support: 145,
          resistance: 175,
          rsi: 65,
          recommendation: 'hold'
        }
      }
    };
      case 'insights-agent':
    return {
      success: true,
      agent: 'insights-agent',
      action,
      timestamp,
      data: {
        insight: {
          id: `insight-${Date.now()}`,
          title: `Daily Market Insight - ${new Date().toLocaleDateString()}`,
          summary: 'Market showing positive momentum with tech stocks leading gains. AI integration driving investor confidence.',
          date: new Date(),
          sections: [
            {
              title: 'Market Overview',
              content: 'Tech sector continues to outperform with strong AI-driven growth. Major indices showing resilience.',
              type: 'market_overview'
            },
            {
              title: 'Key Recommendations',
              content: 'Consider maintaining positions in AI-focused companies. Monitor for entry points on any pullbacks.',
              type: 'recommendations'
            }
          ],
          keyPoints: [
            'Tech stocks showing strong momentum',
            'AI integration driving growth',
            'Economic indicators remain supportive'
          ],
          marketSentiment: 'positive',
          actionItems: [
            'Monitor tech sector performance',
            'Watch for AI-related announcements',
            'Consider profit-taking on significant gains'
          ],
          generatedBy: ['market-research-agent', 'macro-research-agent', 'price-analysis-agent']
        }
      }
    };
      default:
        throw new Error(`Unknown agent: ${agentId}`);
    }
  }

  private getCompanyName(symbol: string): string {
    const names: Record<string, string> = {
      'AAPL': 'Apple Inc.',
      'GOOGL': 'Alphabet Inc.',
      'MSFT': 'Microsoft Corporation',
      'TSLA': 'Tesla, Inc.',
      'NVDA': 'NVIDIA Corporation',
      'META': 'Meta Platforms, Inc.',
      'AMZN': 'Amazon.com, Inc.'
    };
    return names[symbol] || symbol;
  }

  registerAgent(agent: AgentEndpoint) {
    this.agents.set(agent.id, agent);
    console.log(`Registered agent: ${agent.name} at ${agent.url}`);
  }

  start(port: number = 8080) {
    // Register our agents
    this.registerAgent({
      id: 'market-research-agent',
      name: 'Market Research Agent',
      port: 8081,
      url: 'http://localhost:8081'
    });

    this.registerAgent({
      id: 'macro-research-agent',
      name: 'Macro Research Agent',
      port: 8082,
      url: 'http://localhost:8082'
    });

    this.registerAgent({
      id: 'price-analysis-agent',
      name: 'Price Analysis Agent',
      port: 8083,
      url: 'http://localhost:8083'
    });

    this.registerAgent({
      id: 'insights-agent',
      name: 'Insights Agent',
      port: 8084,
      url: 'http://localhost:8084'
    });

    this.app.listen(port, () => {
      console.log(`🚀 A2A HTTP Gateway running on http://localhost:${port}`);
      console.log(`📊 Registered ${this.agents.size} agents`);
      console.log(`🔗 Health check: http://localhost:${port}/health`);
    });
  }
} 