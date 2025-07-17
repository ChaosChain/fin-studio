import { EventEmitter } from 'events';
import { config } from 'dotenv';
import { A2AAgent } from '@/lib/a2a/agent';
import { MarketResearchAgent } from './market-research-agent';
import { MacroResearchAgent } from './macro-research-agent';
import { PriceAnalysisAgent } from './price-analysis-agent';
import { InsightsAgent } from './insights-agent';
import { createPaymentMiddleware, DEFAULT_PAYMENT_CONFIG } from '@/lib/payment/payment-middleware';
import {
  AgentIdentity,
  AgentType,
  A2AMessage,
  A2AMessageType,
  A2AAgentStatus,
  A2ARegistry,
  A2ARegistryEntry,
  A2AMetrics
} from '@/types/a2a';
import { PaymentMiddlewareConfig } from '@/types/payment';

// Load environment variables from .env.local
config({ path: '.env.local' });

export class AgentManager extends EventEmitter {
  private agents: Map<string, any>;
  private a2aAgents: Map<string, A2AAgent>;
  private registry: Map<string, A2ARegistryEntry>;
  private messageQueue: A2AMessage[];
  private isRunning: boolean;
  private ports: Map<string, number>;
  private paymentConfig: PaymentMiddlewareConfig;
  private paymentMiddleware: any;

  constructor(paymentConfig?: PaymentMiddlewareConfig) {
    super();
    this.agents = new Map();
    this.a2aAgents = new Map();
    this.registry = new Map();
    this.messageQueue = [];
    this.isRunning = false;
    this.ports = new Map();
    
    // Initialize payment configuration
    this.paymentConfig = paymentConfig || this.getDefaultPaymentConfig();
    this.paymentMiddleware = createPaymentMiddleware(this.paymentConfig);

    // Initialize port assignments
    this.ports.set('market-research-agent', 8081);
    this.ports.set('macro-research-agent', 8082);
    this.ports.set('price-analysis-agent', 8083);
    this.ports.set('insights-agent', 8084);
  }

  async initialize(): Promise<void> {
    console.log('Initializing Fintech Agent Manager...');

    try {
      // Initialize individual agents
      await this.initializeAgents();

      // Set up A2A communication layer
      await this.setupA2ACommunication();

      // Register agents in the registry
      await this.registerAgents();

      // Set up message routing
      this.setupMessageRouting();

      this.isRunning = true;
      console.log('Agent Manager initialized successfully');
      this.emit('initialized');
    } catch (error) {
      console.error('Failed to initialize Agent Manager:', error);
      throw error;
    }
  }

  private async initializeAgents(): Promise<void> {
    console.log('Initializing specialized agents...');

    // Initialize Market Research Agent
    const marketResearchAgent = new MarketResearchAgent();
    this.agents.set('market-research-agent', marketResearchAgent);

    // Initialize Macro Research Agent
    const macroResearchAgent = new MacroResearchAgent();
    this.agents.set('macro-research-agent', macroResearchAgent);

    // Initialize Price Analysis Agent
    const priceAnalysisAgent = new PriceAnalysisAgent();
    this.agents.set('price-analysis-agent', priceAnalysisAgent);

    // Initialize Insights Agent
    const insightsAgent = new InsightsAgent();
    this.agents.set('insights-agent', insightsAgent);

    console.log(`Initialized ${this.agents.size} specialized agents`);
  }

  private async setupA2ACommunication(): Promise<void> {
    console.log('Setting up A2A communication layer...');

    for (const [agentId, agent] of this.agents) {
      const port = this.ports.get(agentId);
      if (!port) {
        throw new Error(`No port assigned for agent: ${agentId}`);
      }

      // Check if agent is already running
      if (this.a2aAgents.has(agentId)) {
        console.log(`Agent ${agentId} is already running, skipping...`);
        continue;
      }

      // Create middleware array with payment middleware
      const middleware = [
        async (message: A2AMessage, next: () => Promise<void>) => {
          await this.paymentMiddleware.handleMessage(message, next);
        }
      ];

      // Create A2A agent wrapper
      const a2aAgent = new A2AAgent({
        identity: agent.getIdentity(),
        handlers: agent.getHandlers(),
        middleware,
        registry: this.createRegistryInterface()
      });

      // Set up event handlers
      a2aAgent.on('started', (data) => {
        console.log(`A2A Agent ${data.identity.name} started on port ${data.port}`);
      });

      a2aAgent.on('message_processed', (data) => {
        this.updateAgentMetrics(agentId, 'message_processed');
      });

      a2aAgent.on('error', (data) => {
        console.error(`A2A Agent ${agentId} error:`, data.error);
        this.updateAgentMetrics(agentId, 'error');
      });

      try {
        // Start the A2A agent
        await a2aAgent.start(port);
        this.a2aAgents.set(agentId, a2aAgent);
      } catch (error) {
        console.error(`Failed to start agent ${agentId} on port ${port}:`, error);
        // Try to find an available port
        const availablePort = await this.findAvailablePort(port);
        if (availablePort !== port) {
          console.log(`Retrying agent ${agentId} on port ${availablePort}`);
          await a2aAgent.start(availablePort);
          this.ports.set(agentId, availablePort);
          this.a2aAgents.set(agentId, a2aAgent);
        } else {
          throw error;
        }
      }
    }

    console.log('A2A communication layer set up successfully');
  }

  private getDefaultPaymentConfig(): PaymentMiddlewareConfig {
    return {
      ...DEFAULT_PAYMENT_CONFIG,
      // Override with environment-specific values if available
      operatorAddress: process.env.OPERATOR_ADDRESS as `0x${string}` || DEFAULT_PAYMENT_CONFIG.operatorAddress,
      operatorPrivateKey: process.env.OPERATOR_PRIVATE_KEY || DEFAULT_PAYMENT_CONFIG.operatorPrivateKey,
      facilitatorUrl: process.env.FACILITATOR_URL || DEFAULT_PAYMENT_CONFIG.facilitatorUrl,
      defaultNetwork: (process.env.NETWORK as 'base' | 'base-sepolia') || DEFAULT_PAYMENT_CONFIG.defaultNetwork
    };
  }

  private async registerAgents(): Promise<void> {
    console.log('Registering agents in registry...');

    for (const [agentId, a2aAgent] of this.a2aAgents) {
      const identity = a2aAgent.getIdentity();
      
      const registryEntry: A2ARegistryEntry = {
        agent: identity,
        status: A2AAgentStatus.ACTIVE,
        lastSeen: new Date(),
        metrics: {
          messagesProcessed: 0,
          averageResponseTime: 0,
          errorRate: 0,
          uptime: 0
        }
      };

      this.registry.set(agentId, registryEntry);
    }

    console.log(`Registered ${this.registry.size} agents in registry`);
  }

  private setupMessageRouting(): void {
    console.log('Setting up message routing...');

    // Set up inter-agent communication
    for (const [agentId, a2aAgent] of this.a2aAgents) {
      a2aAgent.on('outgoing_message', (message: A2AMessage) => {
        this.routeMessage(message);
      });
    }
  }

  private async routeMessage(message: A2AMessage): Promise<void> {
    const targetAgentId = message.target.id;
    const targetAgent = this.a2aAgents.get(targetAgentId);

    if (targetAgent) {
      // Direct agent-to-agent communication
      // In a real implementation, this would use WebSocket or HTTP communication
      console.log(`Routing message from ${message.source.id} to ${targetAgentId}: ${message.payload.action}`);
      
      // For now, emit the message to the target agent
      this.emit('message_routed', { from: message.source.id, to: targetAgentId, message });
    } else {
      console.warn(`Target agent not found: ${targetAgentId}`);
    }
  }

  private createRegistryInterface(): A2ARegistry {
    return {
      register: async (agent: AgentIdentity) => {
        const registryEntry: A2ARegistryEntry = {
          agent,
          status: A2AAgentStatus.ACTIVE,
          lastSeen: new Date(),
          metrics: {
            messagesProcessed: 0,
            averageResponseTime: 0,
            errorRate: 0,
            uptime: 0
          }
        };
        this.registry.set(agent.id, registryEntry);
      },

      unregister: async (agentId: string) => {
        this.registry.delete(agentId);
      },

      discover: async (criteria?: Partial<AgentIdentity>) => {
        const results: AgentIdentity[] = [];
        
        for (const [agentId, entry] of this.registry) {
          if (this.matchesCriteria(entry.agent, criteria)) {
            results.push(entry.agent);
          }
        }
        
        return results;
      },

      getAgent: async (agentId: string) => {
        const entry = this.registry.get(agentId);
        return entry ? entry.agent : null;
      },

      updateStatus: async (agentId: string, status: A2AAgentStatus) => {
        const entry = this.registry.get(agentId);
        if (entry) {
          entry.status = status;
          entry.lastSeen = new Date();
          this.registry.set(agentId, entry);
        }
      }
    };
  }

  private matchesCriteria(agent: AgentIdentity, criteria?: Partial<AgentIdentity>): boolean {
    if (!criteria) return true;

    if (criteria.type && agent.type !== criteria.type) return false;
    if (criteria.name && !agent.name.includes(criteria.name)) return false;
    if (criteria.capabilities && !criteria.capabilities.every(cap => agent.capabilities.includes(cap))) return false;

    return true;
  }

  private updateAgentMetrics(agentId: string, event: 'message_processed' | 'error'): void {
    const entry = this.registry.get(agentId);
    if (entry) {
      if (event === 'message_processed') {
        entry.metrics.messagesProcessed++;
      } else if (event === 'error') {
        entry.metrics.errorRate++;
      }
      entry.lastSeen = new Date();
      this.registry.set(agentId, entry);
    }
  }

  // Public API methods
  async requestMarketAnalysis(symbols: string[], analysisType: string): Promise<any> {
    if (!this.isRunning) {
      throw new Error('Agent Manager not initialized');
    }

    const message: A2AMessage = {
      id: this.generateId(),
      type: A2AMessageType.REQUEST,
      timestamp: new Date(),
      source: {
        id: 'agent-manager',
        name: 'Agent Manager',
        type: AgentType.ORCHESTRATOR,
        version: '1.0.0',
        capabilities: ['orchestration', 'coordination']
      },
      target: { id: 'market-research-agent' } as AgentIdentity,
      payload: {
        action: 'analyze_news',
        data: {
          symbols,
          analysisType,
          timeframe: 'daily'
        }
      }
    };

    return this.sendMessage(message);
  }

  async requestMacroAnalysis(indicators: string[], countries: string[]): Promise<any> {
    if (!this.isRunning) {
      throw new Error('Agent Manager not initialized');
    }

    const message: A2AMessage = {
      id: this.generateId(),
      type: A2AMessageType.REQUEST,
      timestamp: new Date(),
      source: {
        id: 'agent-manager',
        name: 'Agent Manager',
        type: AgentType.ORCHESTRATOR,
        version: '1.0.0',
        capabilities: ['orchestration', 'coordination']
      },
      target: { id: 'macro-research-agent' } as AgentIdentity,
      payload: {
        action: 'analyze_economic_indicators',
        data: {
          indicators,
          countries,
          timeframe: 'latest'
        }
      }
    };

    return this.sendMessage(message);
  }

  async requestPriceAnalysis(symbols: string[], analysisType: string): Promise<any> {
    if (!this.isRunning) {
      throw new Error('Agent Manager not initialized');
    }

    const message: A2AMessage = {
      id: this.generateId(),
      type: A2AMessageType.REQUEST,
      timestamp: new Date(),
      source: {
        id: 'agent-manager',
        name: 'Agent Manager',
        type: AgentType.ORCHESTRATOR,
        version: '1.0.0',
        capabilities: ['orchestration', 'coordination']
      },
      target: { id: 'price-analysis-agent' } as AgentIdentity,
      payload: {
        action: analysisType === 'technical' ? 'analyze_technical_indicators' : 'get_market_data',
        data: {
          symbols,
          timeframe: 'daily'
        }
      }
    };

    return this.sendMessage(message);
  }

  async generateDailyInsights(symbols: string[], customSections?: string[]): Promise<any> {
    if (!this.isRunning) {
      throw new Error('Agent Manager not initialized');
    }

    const message: A2AMessage = {
      id: this.generateId(),
      type: A2AMessageType.REQUEST,
      timestamp: new Date(),
      source: {
        id: 'agent-manager',
        name: 'Agent Manager',
        type: AgentType.ORCHESTRATOR,
        version: '1.0.0',
        capabilities: ['orchestration', 'coordination']
      },
      target: { id: 'insights-agent' } as AgentIdentity,
      payload: {
        action: 'generate_daily_insight',
        data: {
          symbols,
          customSections,
          includePortfolio: true
        }
      }
    };

    return this.sendMessage(message);
  }

  async discoverAgents(criteria?: Partial<AgentIdentity>): Promise<AgentIdentity[]> {
    const registry = this.createRegistryInterface();
    return registry.discover(criteria);
  }

  async getAgentCapabilities(agentId: string): Promise<string[]> {
    const baseCapabilities = [];
    
    switch (agentId) {
      case 'market-research-agent':
        baseCapabilities.push('market_analysis', 'sentiment_analysis', 'news_analysis');
        break;
      case 'macro-research-agent':
        baseCapabilities.push('economic_indicators', 'central_bank_analysis', 'global_trends');
        break;
      case 'price-analysis-agent':
        baseCapabilities.push('technical_analysis', 'price_data', 'chart_patterns');
        break;
      case 'insights-agent':
        baseCapabilities.push('ai_insights', 'report_generation', 'data_coordination');
        break;
      default:
        baseCapabilities.push('general_analysis');
    }

    // Add payment capabilities if configured
    const agentPaymentConfig = this.paymentConfig.payments[agentId];
    if (agentPaymentConfig) {
      baseCapabilities.push('payment_required', 'x402_protocol', 'escrow_payments');
    }

    return baseCapabilities;
  }

  async getAgentStatus(agentId: string): Promise<A2AAgentStatus | null> {
    const entry = this.registry.get(agentId);
    return entry ? entry.status : null;
  }

  async getAgentMetrics(agentId: string): Promise<A2AMetrics | null> {
    const entry = this.registry.get(agentId);
    return entry ? entry.metrics : null;
  }

  async getPaymentHistory(agentId: string): Promise<any[]> {
    return await this.paymentMiddleware.getPaymentHistory(agentId);
  }

  async createPaymentSession(agentId: string, payer: string, requestData: any) {
    return await this.paymentMiddleware.createPaymentSession(agentId, payer, requestData);
  }

  async getPaymentSession(sessionId: string) {
    return await this.paymentMiddleware.getPaymentSession(sessionId);
  }

  getPaymentConfig(): PaymentMiddlewareConfig {
    return this.paymentConfig;
  }

  getRegistrySnapshot(): Map<string, A2ARegistryEntry> {
    return new Map(this.registry);
  }

  private async sendMessage(message: A2AMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Message timeout'));
      }, 30000);

      // Store message in queue for processing
      this.messageQueue.push(message);

      // Simulate message processing
      setTimeout(() => {
        clearTimeout(timeout);
        resolve({
          success: true,
          messageId: message.id,
          timestamp: new Date()
        });
      }, 1000);
    });
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down Agent Manager...');
    this.isRunning = false;

    // Stop all A2A agents
    const shutdownPromises = Array.from(this.a2aAgents.values()).map(agent => agent.stop());
    await Promise.all(shutdownPromises);

    // Clear all maps
    this.agents.clear();
    this.a2aAgents.clear();
    this.registry.clear();
    this.messageQueue.length = 0;

    console.log('Agent Manager shutdown complete');
  }

  private generateId(): string {
    return Date.now().toString(36) + 
           Math.random().toString(36).substring(2, 15);
  }

  private async findAvailablePort(startPort: number): Promise<number> {
    const maxAttempts = 10; // Try up to 10 ports
    for (let i = 0; i < maxAttempts; i++) {
      const port = startPort + i;
      try {
        await this.checkPort(port);
        return port;
      } catch (error) {
        // Port is in use, continue to the next
      }
    }
    throw new Error(`Could not find an available port starting from ${startPort}`);
  }

  private async checkPort(port: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const server = require('http').createServer();
      server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          server.close();
          reject(new Error(`Port ${port} is already in use`));
        } else {
          reject(err);
        }
      });
      server.on('listening', () => {
        server.close();
        resolve();
      });
      server.listen(port);
    });
  }
}

// Export singleton instance
export const agentManager = new AgentManager();

// Auto-initialize if running in Node.js environment
if (typeof process !== 'undefined' && process.versions && process.versions.node) {
  let isInitialized = false;
  
  const startManager = async () => {
    if (isInitialized) {
      console.log('Agent Manager already initialized, skipping...');
      return;
    }
    
    try {
      isInitialized = true;
      await agentManager.initialize();
      console.log('Fintech Agent Manager started successfully');
    } catch (error) {
      console.error('Failed to start Agent Manager:', error);
      isInitialized = false;
      process.exit(1);
    }
  };

  // Handle graceful shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    try {
      await agentManager.shutdown();
      console.log('Agent Manager shut down successfully');
      process.exit(0);
    } catch (error) {
      console.error('Error during shutdown:', error);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // for nodemon

  // Start the manager
  startManager().catch(console.error);
} 