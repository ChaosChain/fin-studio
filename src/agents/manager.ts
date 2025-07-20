import { EventEmitter } from 'events';
import { config } from 'dotenv';
import { A2AAgent } from '@/lib/a2a/agent';
import { MarketResearchAgent } from './market-research-agent';
import { MacroResearchAgent } from './macro-research-agent';
import { PriceAnalysisAgent } from './price-analysis-agent';
import { InsightsAgent } from './insights-agent';
import { VerifierAgent, VerificationResult } from './verifier-agent';
import { createPaymentMiddleware, DEFAULT_PAYMENT_CONFIG } from '@/lib/payment/payment-middleware';
import { dkgManager } from '@/lib/dkg';
import { agentReputationNetwork, ReputationUpdate } from '@/lib/arn';
import { agentRelayNetwork, AgentProfile } from '@/lib/agent-relay-network';
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

interface TaskExecution {
  taskId: string;
  symbols: string[];
  analysisType: string;
  startTime: Date;
  components: Map<string, ComponentExecution>;
  status: 'pending' | 'in_progress' | 'verifying' | 'completed' | 'failed';
}

interface ComponentExecution {
  componentType: string;
  assignedAgents: string[];
  completedAgents: string[];
  dkgNodeIds: string[];
  verificationResults: VerificationResult[];
  consensusReached: boolean;
}

export class AgentManager extends EventEmitter {
  private agents: Map<string, any>;
  private a2aAgents: Map<string, A2AAgent>;
  private verifierAgents: Map<string, VerifierAgent>;
  private registry: Map<string, A2ARegistryEntry>;
  private messageQueue: A2AMessage[];
  private isRunning: boolean;
  private ports: Map<string, number>;
  private paymentConfig: PaymentMiddlewareConfig;
  private paymentMiddleware: any;
  private activeTasks: Map<string, TaskExecution>;

  constructor(paymentConfig?: PaymentMiddlewareConfig) {
    super();
    this.agents = new Map();
    this.a2aAgents = new Map();
    this.verifierAgents = new Map();
    this.registry = new Map();
    this.messageQueue = [];
    this.isRunning = false;
    this.ports = new Map();
    this.activeTasks = new Map();
    
    // Initialize payment configuration
    this.paymentConfig = paymentConfig || this.getDefaultPaymentConfig();
    this.paymentMiddleware = createPaymentMiddleware(this.paymentConfig);

    // Initialize port assignments
    this.ports.set('market-research-agent', 8081);
    this.ports.set('macro-research-agent', 8082);
    this.ports.set('price-analysis-agent', 8083);
    this.ports.set('insights-agent', 8084);
    
    // Initialize verifier agents (ports 8085-8088)
    for (let i = 1; i <= 4; i++) {
      this.ports.set(`verifier-agent-${i}`, 8084 + i);
    }
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

      // Initialize Agent Relay Network
      await this.initializeAgentRelayNetwork();

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

    // Initialize Verifier Agents
    for (let i = 1; i <= 4; i++) {
      const verifierAgent = new VerifierAgent(i.toString());
      this.verifierAgents.set(`verifier-agent-${i}`, verifierAgent);
    }

    console.log(`Initialized ${this.agents.size} specialized agents and ${this.verifierAgents.size} verifier agents`);
    
    // Initialize agent reputations
    for (const [agentId, agent] of this.agents) {
      agentReputationNetwork.initializeAgent(agentId, agent.getIdentity().name);
    }
  }

  private async setupA2ACommunication(): Promise<void> {
    console.log('Setting up A2A communication layer (demo mode)...');

    // For demo purposes, skip the complex WebSocket setup
    // and just register the agents as active
    for (const [agentId, agent] of this.agents) {
      console.log(`Agent ${agentId} registered in demo mode`);
    }

    console.log('A2A communication layer set up successfully (demo mode)');
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

  private async initializeAgentRelayNetwork(): Promise<void> {
    console.log('🌐 Initializing Agent Relay Network...');
    
    try {
      // Start the relay network
      await agentRelayNetwork.start();
      
      // Register our agents in the relay network
      await this.registerAgentsInRelayNetwork();
      
      // Set up relay network event handlers
      this.setupRelayNetworkHandlers();
      
      console.log('✅ Agent Relay Network initialized successfully');
      
    } catch (error) {
      console.error('❌ Failed to initialize Agent Relay Network:', error);
      throw error;
    }
  }

  private async registerAgentsInRelayNetwork(): Promise<void> {
    console.log('📢 Registering agents in relay network...');
    
    // Register base agents
    for (const [agentId, agent] of this.agents) {
      const identity = agent.getIdentity();
      const reputation = agentReputationNetwork.getReputation(agentId);
      
      const agentProfile: Omit<AgentProfile, 'publicKey' | 'lastSeen'> = {
        agentId: identity.id,
        name: identity.name,
        capabilities: identity.capabilities || [],
        specialties: reputation?.specialties || [],
        reputation: reputation?.reputationScore || 0.5,
        cost: this.getAgentCost(agentId),
        endpoint: `http://localhost:${this.ports.get(agentId) || 8080}`,
        relays: []
      };
      
      await agentRelayNetwork.announceAgent(agentProfile);
      console.log(`📡 Registered ${identity.name} in relay network`);
    }

    // Also register verifier agents in ARN
    for (const [verifierId, verifierAgent] of this.verifierAgents) {
      const identity = verifierAgent.getIdentity();
      const reputation = agentReputationNetwork.getReputation(verifierId);
      
      const verifierProfile: Omit<AgentProfile, 'publicKey' | 'lastSeen'> = {
        agentId: identity.id,
        name: identity.name,
        capabilities: identity.capabilities || [],
        specialties: reputation?.specialties || ['verification', 'consensus', 'validation'],
        reputation: reputation?.reputationScore || 0.8, // Verifiers start with higher reputation
        cost: '$0.001', // Very low cost for verification
        endpoint: `http://localhost:${this.ports.get(verifierId) || 8080}`,
        relays: []
      };
      
      await agentRelayNetwork.announceAgent(verifierProfile);
      console.log(`📡 Registered ${identity.name} in relay network`);
    }

    // Register all possible agent variants (with different models) that can be dynamically created
    const baseAgentTypes = ['market-research-agent', 'macro-research-agent', 'price-analysis-agent', 'insights-agent'];
    const models = ['gpt4', 'gpt4o'];
    
    for (const baseType of baseAgentTypes) {
      for (const model of models) {
        const variantId = `${baseType}-${model}`;
        if (!this.agents.has(variantId)) {
          // Create a profile for the variant even if not yet instantiated
          const baseAgent = this.agents.get(baseType);
          if (baseAgent) {
            const baseIdentity = baseAgent.getIdentity();
            const reputation = agentReputationNetwork.getReputation(variantId) || 
                             agentReputationNetwork.getReputation(baseType);
            
            const variantProfile: Omit<AgentProfile, 'publicKey' | 'lastSeen'> = {
              agentId: variantId,
              name: `${baseIdentity.name} (${model.toUpperCase()})`,
              capabilities: baseIdentity.capabilities || [],
              specialties: reputation?.specialties || [],
              reputation: reputation?.reputationScore || 0.5,
              cost: this.getAgentCost(baseType),
              endpoint: `http://localhost:${this.ports.get(baseType) || 8080}`,
              relays: []
            };
            
            await agentRelayNetwork.announceAgent(variantProfile);
            console.log(`📡 Registered variant ${variantProfile.name} in relay network`);
          }
        }
      }
    }

    console.log(`✅ Successfully registered ${this.agents.size + this.verifierAgents.size + (baseAgentTypes.length * models.length)} agents in relay network`);
  }

  private getAgentCost(agentId: string): string {
    // Return cost based on agent type
    const costMap: Record<string, string> = {
      'market-research-agent': '$0.01',
      'macro-research-agent': '$0.02',
      'price-analysis-agent': '$0.005',
      'insights-agent': '$0.03'
    };
    return costMap[agentId] || '$0.01';
  }

  private setupRelayNetworkHandlers(): void {
    // Handle incoming agent requests through relay network
    agentRelayNetwork.onRequestReceived((request) => {
      console.log(`🔄 Relay network request received: ${request.requestId}`);
      this.emit('relay-request', request);
    });

    // Handle agent responses through relay network
    agentRelayNetwork.onResponseReceived((response) => {
      console.log(`🔄 Relay network response received: ${response.requestId}`);
      this.emit('relay-response', response);
    });

    // Handle task coordination through relay network
    agentRelayNetwork.onTaskCoordination((coordination) => {
      console.log(`🎯 Task coordination received: ${coordination.taskId}`);
      this.emit('task-coordination', coordination);
    });

    // Handle agent discovery
    agentRelayNetwork.onAgentDiscovered((agent) => {
      console.log(`🤖 New agent discovered: ${agent.name}`);
      this.emit('agent-discovered', agent);
    });
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

  /**
   * Comprehensive analysis with multi-agent assignment, DKG, and verification
   */
  async requestComprehensiveAnalysis(
    symbols: string[], 
    analysisType: string = 'comprehensive',
    options: { useARN?: boolean; arnTaskId?: string } = {}
  ): Promise<any> {
    if (!this.isRunning) {
      throw new Error('Agent Manager not initialized');
    }

    const { useARN = false, arnTaskId } = options;
    const taskId = arnTaskId || this.generateTaskId();
    
    if (useARN) {
      console.log(`🌐 Starting ARN-coordinated comprehensive analysis task ${taskId} for ${symbols.join(', ')}`);
    } else {
      console.log(`Starting comprehensive analysis task ${taskId} for ${symbols.join(', ')}`);
    }

    // Set current task in DKG manager (clears previous task nodes)
    dkgManager.setCurrentTask(taskId);

    // Create task execution
    const taskExecution: TaskExecution = {
      taskId,
      symbols,
      analysisType,
      startTime: new Date(),
      components: new Map(),
      status: 'pending'
    };

    this.activeTasks.set(taskId, taskExecution);

    try {
      if (useARN) {
        // ARN-Enhanced Workflow
        console.log('🔍 Step 1: ARN Agent Discovery and Selection');
        await this.discoverAndSelectAgentsViaARN(taskExecution);

        console.log('🎯 Step 2: ARN Task Coordination');
        await this.coordinateTaskViaARN(taskExecution);

        console.log('⚡ Step 3: ARN-Coordinated Multi-Agent Analysis');
        await this.executeARNCoordinatedAnalysis(taskExecution);
      } else {
        // Standard Workflow
        console.log('📋 Step 1: Task Decomposition - assign multiple agents per component');
        await this.decomposeAndAssignTask(taskExecution);

        console.log('🤖 Step 2: Execute multi-agent analysis');
        await this.executeMultiAgentAnalysis(taskExecution);
      }

      console.log('✅ Step 3: Verification by verifier network');
      await this.performVerification(taskExecution);

      console.log('💰 Step 4: Consensus and payment release');
      await this.processConsensusAndPayment(taskExecution);

      // Validate that all required sections have been completed
      const requiredSections = ['sentiment', 'technical', 'macro', 'insights'];
      const results = this.aggregateTaskResults(taskExecution);
      const incompleteSections = requiredSections.filter(section => 
        !results[section] || results[section].nodes === 0
      );

      if (incompleteSections.length > 0) {
        console.warn(`⚠️ Task ${taskId} has incomplete sections: ${incompleteSections.join(', ')}`);
        console.warn('🔄 Attempting to retry incomplete sections...');
        
        // Retry incomplete sections
        for (const section of incompleteSections) {
          if (taskExecution.components.has(section)) {
            const componentExecution = taskExecution.components.get(section)!;
            console.log(`🔄 Retrying ${section} analysis with ${componentExecution.assignedAgents.length} agents`);
            
            // Re-execute the failed section
            for (const agentId of componentExecution.assignedAgents) {
              try {
                if (useARN) {
                  await this.executeARNAgentTask(taskId, section, agentId, symbols);
                } else {
                  await this.executeAgentTask(taskId, section, agentId, symbols);
                }
              } catch (error) {
                console.error(`❌ Retry failed for ${agentId} in ${section}:`, error);
              }
            }
          }
        }
        
        // Re-verify and process consensus for retried sections
        await this.performVerification(taskExecution);
        await this.processConsensusAndPayment(taskExecution);
      }

      taskExecution.status = 'completed';
      
      if (useARN) {
        console.log(`🎉 ARN-coordinated comprehensive analysis task ${taskId} completed successfully`);
      } else {
        console.log(`Comprehensive analysis task ${taskId} completed successfully`);
      }

      return {
        taskId,
        status: 'completed',
        results: this.aggregateTaskResults(taskExecution),
        reputation: this.getTaskReputationSummary(taskExecution),
        arnCoordinated: useARN
      };

    } catch (error) {
      taskExecution.status = 'failed';
      console.error(`Comprehensive analysis task ${taskId} failed:`, error);
      throw error;
    }
  }

  private async decomposeAndAssignTask(taskExecution: TaskExecution): Promise<void> {
    const { taskId, symbols } = taskExecution;
    
    // Define components and assign multiple agents with different models for redundancy
    // Each component gets 2 agents using different AI models for diversity
    const componentAssignments = {
      'sentiment': [
        { agentId: 'market-research-agent-gpt4', model: 'gpt-4.1-2025-04-14' },
        { agentId: 'market-research-agent-gpt4o', model: 'gpt-4o-2024-08-06' }
      ],
      'technical': [
        { agentId: 'price-analysis-agent-gpt4', model: 'gpt-4.1-2025-04-14' },
        { agentId: 'price-analysis-agent-gpt4o', model: 'gpt-4o-2024-08-06' }
      ],
      'macro': [
        { agentId: 'macro-research-agent-gpt4', model: 'gpt-4.1-2025-04-14' },
        { agentId: 'macro-research-agent-gpt4o', model: 'gpt-4o-2024-08-06' }
      ],
      'insights': [
        { agentId: 'insights-agent-gpt4', model: 'gpt-4.1-2025-04-14' },
        { agentId: 'insights-agent-gpt4o', model: 'gpt-4o-2024-08-06' }
      ]
    };

    for (const [componentType, agentConfigs] of Object.entries(componentAssignments)) {
      const componentExecution: ComponentExecution = {
        componentType,
        assignedAgents: agentConfigs.map(config => config.agentId),
        completedAgents: [],
        dkgNodeIds: [],
        verificationResults: [],
        consensusReached: false
      };

      taskExecution.components.set(componentType, componentExecution);
    }

    taskExecution.status = 'in_progress';
    console.log(`Task ${taskId} decomposed into ${taskExecution.components.size} components with ${Object.values(componentAssignments).flat().length} multi-model agents`);
  }

  private async executeMultiAgentAnalysis(taskExecution: TaskExecution): Promise<void> {
    const { taskId, symbols } = taskExecution;
    const promises: Promise<void>[] = [];

    for (const [componentType, componentExecution] of taskExecution.components) {
      for (const agentId of componentExecution.assignedAgents) {
        promises.push(this.executeAgentTask(taskId, componentType, agentId, symbols));
      }
    }

    await Promise.all(promises);
    console.log(`All agents completed analysis for task ${taskId}`);
  }

  private async executeAgentTask(
    taskId: string, 
    componentType: string, 
    agentId: string, 
    symbols: string[]
  ): Promise<void> {
    try {
      // Get the model for this specific agent instance
      const model = this.getModelForAgent(agentId);
      
      // Get or create specialized agent instance
      const agent = await this.getSpecializedAgent(agentId, model);

      // Execute real agent analysis based on component type
      const analysisResult = await this.executeRealAgentAnalysis(agent, agentId, componentType, symbols, model);

      // Create and sign DKG node
      const dkgNode = dkgManager.createSignedNode(
        agentId,
        analysisResult,
        [`${componentType}_data_source`, 'openai_api', 'market_data', model],
        `Real analysis performed for ${componentType} component using ${agentId} (${model})`,
        undefined, // parentNodes
        taskId,
        componentType,
        agentId // Use agentId as private key for demo
      );

      // Add to DKG
      dkgManager.addNode(dkgNode);

      // Update component execution
      const taskExecution = this.activeTasks.get(taskId)!;
      const componentExecution = taskExecution.components.get(componentType)!;
      componentExecution.completedAgents.push(agentId);
      componentExecution.dkgNodeIds.push(dkgNode.id);

      console.log(`Agent ${agentId} (${model}) completed real ${componentType} analysis for task ${taskId}`);

    } catch (error) {
      console.error(`Agent ${agentId} failed ${componentType} analysis for task ${taskId}:`, error);
      throw error;
    }
  }

  private async executeRealAgentAnalysis(agent: any, agentId: string, componentType: string, symbols: string[], model: string): Promise<any> {
    // Execute real agent analysis based on component type and agent
    try {
      let result: any;

      switch (componentType) {
        case 'sentiment':
          if (agentId.includes('market-research-agent')) {
            // Create A2A message for sentiment analysis
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
              target: agent.getIdentity(),
              payload: {
                action: 'analyze_market_sentiment',
                data: {
                  symbols,
                  timeframe: 'daily'
                }
              }
            };

            // Call the agent's handler directly
            const handler = agent.getHandlers().get('analyze_market_sentiment');
            if (handler) {
              const response = await handler(message);
              result = response.payload.data;
            } else {
              throw new Error(`No sentiment analysis handler found for ${agentId}`);
            }
          }
          break;

        case 'technical':
          if (agentId.includes('price-analysis-agent')) {
            // Create A2A message for technical analysis
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
              target: agent.getIdentity(),
              payload: {
                action: 'analyze_technical_indicators',
                data: {
                  symbols,
                  timeframe: 'daily'
                }
              }
            };

            // Call the agent's handler directly
            const handler = agent.getHandlers().get('analyze_technical_indicators');
            if (handler) {
              const response = await handler(message);
              result = response.payload.data;
            } else {
              throw new Error(`No technical analysis handler found for ${agentId}`);
            }
          }
          break;

        case 'macro':
          if (agentId.includes('macro-research-agent')) {
            // Create A2A message for macro analysis
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
              target: agent.getIdentity(),
              payload: {
                action: 'analyze_economic_indicators',
                data: {
                  indicators: ['GDP', 'inflation', 'employment'],
                  regions: ['US'],
                  timeframe: 'quarterly'
                }
              }
            };

            // Call the agent's handler directly
            const handler = agent.getHandlers().get('analyze_economic_indicators');
            if (handler) {
              const response = await handler(message);
              result = response.payload.data;
            } else {
              throw new Error(`No macro analysis handler found for ${agentId}`);
            }
          }
          break;

        case 'insights':
          if (agentId.includes('insights-agent')) {
            // Create A2A message for insights generation
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
              target: agent.getIdentity(),
              payload: {
                action: 'generate_insights',
                data: {
                  symbols,
                  analysisTypes: ['sentiment', 'technical', 'macro']
                }
              }
            };

            // Call the agent's handler directly
            const handler = agent.getHandlers().get('generate_insights');
            if (handler) {
              const response = await handler(message);
              result = response.payload.data;
            } else {
              throw new Error(`No insights generation handler found for ${agentId}`);
            }
          }
          break;

        default:
          throw new Error(`Unknown component type: ${componentType}`);
      }

      if (!result) {
        throw new Error(`No result from ${agentId} for ${componentType} analysis`);
      }

      console.log(`Real analysis completed by ${agentId} for ${componentType}:`, result);
      return result;

    } catch (error) {
      console.error(`Error in real agent analysis for ${agentId}:`, error);
      // Fallback to basic structured result if real analysis fails
      return {
        analysisType: componentType,
        agentId,
        symbols,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackResult: true,
        timestamp: new Date().toISOString()
      };
    }
  }

  private async performVerification(taskExecution: TaskExecution): Promise<void> {
    const { taskId } = taskExecution;
    taskExecution.status = 'verifying';

    const verificationPromises: Promise<void>[] = [];

    // For each component, have all verifiers evaluate all DKG nodes
    for (const [componentType, componentExecution] of taskExecution.components) {
      for (const nodeId of componentExecution.dkgNodeIds) {
        for (const [verifierId, verifier] of this.verifierAgents) {
          verificationPromises.push(
            this.performSingleVerification(verifier, nodeId, taskId, componentExecution)
          );
        }
      }
    }

    await Promise.all(verificationPromises);
    console.log(`Verification completed for task ${taskId}`);
  }

  private async performSingleVerification(
    verifier: VerifierAgent,
    nodeId: string,
    taskId: string,
    componentExecution: ComponentExecution
  ): Promise<void> {
    try {
      const node = dkgManager.getNode(nodeId);
      if (!node) return;

      // Simulate verification (in real implementation, this would use A2A messages)
      const verificationResult = await verifier['performVerification'](node);
      componentExecution.verificationResults.push(verificationResult);

    } catch (error) {
      console.error(`Verification failed for node ${nodeId}:`, error);
    }
  }

  private async processConsensusAndPayment(taskExecution: TaskExecution): Promise<void> {
    const { taskId } = taskExecution;

    for (const [componentType, componentExecution] of taskExecution.components) {
      // Group verification results by node
      const nodeVerifications = new Map<string, VerificationResult[]>();
      
      for (const result of componentExecution.verificationResults) {
        if (!nodeVerifications.has(result.nodeId)) {
          nodeVerifications.set(result.nodeId, []);
        }
        nodeVerifications.get(result.nodeId)!.push(result);
      }

      // Check consensus for each node
      for (const [nodeId, verifications] of nodeVerifications) {
        const node = dkgManager.getNode(nodeId);
        if (!node) continue;

        const consensus = this.calculateConsensus(verifications);
        componentExecution.consensusReached = consensus.accepted;

        // Update agent reputation
        const reputationUpdate: ReputationUpdate = {
          agentId: node.agentId,
          taskId,
          verificationResults: verifications,
          taskStartTime: taskExecution.startTime,
          taskEndTime: new Date()
        };

        agentReputationNetwork.updateReputation(reputationUpdate);

        // Simulate payment release if consensus reached
        if (consensus.accepted) {
          console.log(`✅ Consensus reached for agent ${node.agentId} - payment released`);
          // In real implementation: await this.releasePayment(node.agentId, consensus.amount);
        } else {
          console.log(`❌ Consensus not reached for agent ${node.agentId} - payment withheld`);
        }
      }
    }
  }

  private calculateConsensus(verifications: VerificationResult[]): { accepted: boolean; averageScore: number } {
    if (verifications.length === 0) return { accepted: false, averageScore: 0 };

    // Calculate weighted consensus based on real data metrics
    const averageScore = verifications.reduce((sum, v) => {
      const scores = Object.values(v.scoreVector);
      const avgScore = scores.reduce((s, score) => s + score, 0) / scores.length;
      return sum + avgScore;
    }, 0) / verifications.length;

    // More sophisticated consensus: require both high average score AND majority pass
    const passedCount = verifications.filter(v => v.endResultCheck.passed && v.causalAudit.passed).length;
    const majorityPassed = passedCount > verifications.length / 2;
    const highQualityScore = averageScore >= 0.6; // Minimum quality threshold

    const accepted = majorityPassed && highQualityScore;

    console.log(`Consensus calculation: ${passedCount}/${verifications.length} passed, avg score: ${averageScore.toFixed(3)}, accepted: ${accepted}`);

    return { accepted, averageScore };
  }

  /**
   * Get consensus data for visualization
   */
  async getConsensusData(taskId: string): Promise<any[]> {
    const taskExecution = this.activeTasks.get(taskId);
    if (!taskExecution) return [];

    const consensusData: any[] = [];

    for (const [componentType, componentExecution] of taskExecution.components) {
      // Group verifications by node
      const nodeVerifications = new Map<string, VerificationResult[]>();
      
      for (const result of componentExecution.verificationResults) {
        if (!nodeVerifications.has(result.nodeId)) {
          nodeVerifications.set(result.nodeId, []);
        }
        nodeVerifications.get(result.nodeId)!.push(result);
      }

      // Create consensus data for each node
      for (const [nodeId, verifications] of nodeVerifications) {
        const node = dkgManager.getNode(nodeId);
        if (!node) continue;

        const consensus = this.calculateConsensus(verifications);
        const passedCount = verifications.filter(v => v.endResultCheck.passed && v.causalAudit.passed).length;

        // Extract real data metrics from the node
        const extractedConfidence = 
          node.resultData?.confidenceLevel || 
          node.resultData?.confidence || 
          node.resultData?.analysis?.confidence ||
          node.resultData?.analysis?.confidenceLevel ||
          0;

        console.log(`📊 Agent Manager - Extracting confidence for ${node.agentId}:`, {
          confidenceLevel: node.resultData?.confidenceLevel,
          confidence: node.resultData?.confidence,
          analysisConfidence: node.resultData?.analysis?.confidence,
          analysisConfidenceLevel: node.resultData?.analysis?.confidenceLevel,
          extractedConfidence
        });

        const realDataMetrics = {
          tokenCount: node.resultData?.costInfo?.totalTokens || 0,
          apiCost: node.resultData?.costInfo?.totalCost || 0,
          duration: node.resultData?.costInfo?.duration || 0,
          contentQuality: this.assessContentQuality(node.resultData),
          openaiConfidence: extractedConfidence
        };

        consensusData.push({
          taskId,
          componentType,
          nodeId,
          agentId: node.agentId,
          verifications,
          consensusReached: consensus.accepted,
          averageScore: consensus.averageScore,
          passedCount,
          totalVerifiers: verifications.length,
          realDataMetrics
        });
      }
    }

    return consensusData;
  }

  /**
   * Assess content quality for visualization
   */
  private assessContentQuality(resultData: any): string {
    if (!resultData) return 'No Data';
    
    const hasStructuredData = typeof resultData === 'object' && Object.keys(resultData).length > 3;
    const hasDetailedAnalysis = resultData.analysis || resultData.technicalAnalysis || resultData.sentimentAnalysis;
    const tokenCount = resultData.costInfo?.totalTokens || 0;
    
    if (tokenCount > 2000 && hasDetailedAnalysis && hasStructuredData) return 'Excellent';
    if (tokenCount > 1000 && hasDetailedAnalysis) return 'Good';
    if (tokenCount > 500 && hasStructuredData) return 'Fair';
    return 'Basic';
  }

  /**
   * Get the model configuration for a specific agent ID
   */
  private getModelForAgent(agentId: string): string {
    if (agentId.includes('-gpt4o')) return 'gpt-4o-2024-08-06';
    if (agentId.includes('-gpt4')) return 'gpt-4.1-2025-04-14';
    return 'gpt-4.1-2025-04-14'; // Default fallback
  }

  /**
   * Get or create a specialized agent instance with specific model
   */
  private async getSpecializedAgent(agentId: string, model: string): Promise<any> {
    // Check if we already have this specialized agent
    if (this.agents.has(agentId)) {
      return this.agents.get(agentId);
    }

    // Create new specialized agent based on base type
    let agent: any;
    // Parse base agent type from agentId by removing the model suffix
    // Examples: "market-research-agent-gpt4" → "market-research-agent"
    //           "insights-agent-gpt4o" → "insights-agent"
    let baseAgentType = agentId;
    
    // Remove model suffixes to get base agent type
    if (agentId.endsWith('-gpt4') || agentId.endsWith('-gpt4o')) {
      const parts = agentId.split('-');
      baseAgentType = parts.slice(0, -1).join('-');
    }
    
    switch (baseAgentType) {
      case 'market-research-agent':
        agent = new MarketResearchAgent();
        // Override the model in the agent
        agent.setModel(model);
        break;
      case 'price-analysis-agent':
        agent = new PriceAnalysisAgent();
        agent.setModel(model);
        break;
      case 'macro-research-agent':
        agent = new MacroResearchAgent();
        agent.setModel(model);
        break;
      case 'insights-agent':
        agent = new InsightsAgent();
        agent.setModel(model);
        break;
      default:
        // If we can't find the specialized agent, try to use the base agent
        console.warn(`Unknown specialized agent ${agentId}, trying base agent ${baseAgentType}`);
        if (this.agents.has(baseAgentType)) {
          return this.agents.get(baseAgentType);
        }
        throw new Error(`Unknown agent type for ${agentId} (base: ${baseAgentType})`);
    }

    // Store the specialized agent
    this.agents.set(agentId, agent);
    
    // Initialize reputation for the specialized agent
    agentReputationNetwork.initializeAgent(agentId, `${agent.getIdentity().name} (${model})`);
    
    console.log(`Created specialized agent: ${agentId} using model ${model}`);
    return agent;
  }

  private aggregateTaskResults(taskExecution: TaskExecution): any {
    const results: any = {};
    
    for (const [componentType, componentExecution] of taskExecution.components) {
      const nodes = componentExecution.dkgNodeIds.map(id => dkgManager.getNode(id)).filter(Boolean);
      results[componentType] = {
        nodes: nodes.length,
        consensus: componentExecution.consensusReached,
        verifications: componentExecution.verificationResults.length
      };
    }

    return results;
  }

  private getTaskReputationSummary(taskExecution: TaskExecution): any {
    const summary: any = {};
    
    for (const [componentType, componentExecution] of taskExecution.components) {
      for (const agentId of componentExecution.assignedAgents) {
        const reputation = agentReputationNetwork.getReputation(agentId);
        if (reputation) {
          summary[agentId] = {
            reputationScore: reputation.reputationScore,
            totalTasks: reputation.totalTasks,
            acceptanceRate: reputation.totalTasks > 0 ? reputation.acceptedTasks / reputation.totalTasks : 0
          };
        }
      }
    }

    return summary;
  }

  private generateTaskId(): string {
    return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down Agent Manager...');
    this.isRunning = false;

    // Clear all maps (no A2A agents to stop in demo mode)
    this.agents.clear();
    this.a2aAgents.clear();
    this.verifierAgents.clear();
    this.registry.clear();
    this.activeTasks.clear();
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

  /**
   * ARN-Enhanced Methods for Comprehensive Analysis
   */
  private async discoverAndSelectAgentsViaARN(taskExecution: TaskExecution): Promise<void> {
    const { taskId, symbols } = taskExecution;
    
    console.log(`🔍 ARN: Discovering agents for task ${taskId}`);
    
    // Discover agents by capabilities through ARN - using actual capability names from agent registration
    const requiredCapabilities = [
      'news_analysis', 'market_sentiment', // For sentiment analysis
      'technical_analysis', 'real_time_price_data', // For technical analysis
      'economic_indicators', 'macro_trend_analysis', // For macro analysis
      'daily_insights', 'report_generation' // For insights
    ];
    const discoveredAgents = await this.discoverAgentsByCapability(requiredCapabilities);
    
    console.log(`🤖 ARN: Discovered ${discoveredAgents.length} capable agents`);
    
    // Select best agents for each component based on actual capabilities
    const componentAssignments = {
      'sentiment': this.selectBestAgentsForComponent(discoveredAgents, 'news_analysis', 2),
      'technical': this.selectBestAgentsForComponent(discoveredAgents, 'technical_analysis', 2),
      'macro': this.selectBestAgentsForComponent(discoveredAgents, 'economic_indicators', 2),
      'insights': this.selectBestAgentsForComponent(discoveredAgents, 'daily_insights', 2)
    };

    // Ensure all components have assigned agents - fallback to any available agent if needed
    const allAgents = discoveredAgents;
    for (const [componentType, selectedAgents] of Object.entries(componentAssignments)) {
      if (selectedAgents.length === 0 && allAgents.length > 0) {
        console.warn(`🔄 ARN: No specific agents found for ${componentType}, using fallback agents`);
        // Use any available agents as fallback
        (componentAssignments as any)[componentType] = allAgents.slice(0, 2).map(agent => ({
          agentId: `${agent.agentId.replace(/-gpt4[o]?$/, '')}-gpt4`,
          model: 'gpt-4.1-2025-04-14'
        }));
      }
    }

    // Create component executions with ARN-selected agents
    for (const [componentType, selectedAgents] of Object.entries(componentAssignments)) {
      const componentExecution: ComponentExecution = {
        componentType,
        assignedAgents: selectedAgents.map(agent => agent.agentId),
        completedAgents: [],
        dkgNodeIds: [],
        verificationResults: [],
        consensusReached: false
      };

      taskExecution.components.set(componentType, componentExecution);
    }

    console.log(`✅ ARN: Selected agents for ${taskExecution.components.size} components`);
    
    // Log component assignments for debugging
    for (const [componentType, componentExecution] of taskExecution.components) {
      console.log(`🎯 ${componentType}: ${componentExecution.assignedAgents.length} agents assigned`);
    }
  }

  private selectBestAgentsForComponent(agents: any[], capability: string, count: number = 2) {
    return agents
      .filter(agent => agent.capabilities.includes(capability))
      .sort((a, b) => b.reputation - a.reputation) // Sort by reputation descending
      .slice(0, count)
      .map(agent => {
        // Use existing agent variants if available, otherwise use base agent
        const modelVariant = Math.random() > 0.5 ? 'gpt4' : 'gpt4o';
        const baseAgentId = agent.agentId.replace(/-gpt4[o]?$/, ''); // Remove existing model suffix
        return {
          agentId: `${baseAgentId}-${modelVariant}`,
          model: modelVariant === 'gpt4o' ? 'gpt-4o-2024-08-06' : 'gpt-4.1-2025-04-14'
        };
      });
  }

  private async coordinateTaskViaARN(taskExecution: TaskExecution): Promise<void> {
    const { taskId, symbols, analysisType } = taskExecution;
    
    console.log(`🎯 ARN: Coordinating task ${taskId} across relay network`);
    
    // Get all assigned agents
    const allAgents: string[] = [];
    for (const [, componentExecution] of taskExecution.components) {
      allAgents.push(...componentExecution.assignedAgents);
    }

    // Coordinate task through ARN
    await this.coordinateTaskViaRelay(taskId, allAgents, {
      symbols,
      analysisType,
      components: Array.from(taskExecution.components.keys()),
      deadline: Date.now() + 600000 // 10 minutes
    });

    console.log(`✅ ARN: Task coordination complete for ${allAgents.length} agents`);
  }

  private async executeARNCoordinatedAnalysis(taskExecution: TaskExecution): Promise<void> {
    const { taskId, symbols } = taskExecution;
    console.log(`⚡ ARN: Executing coordinated analysis for task ${taskId}`);
    
    // Execute analysis with ARN coordination awareness
    const promises: Promise<void>[] = [];

    for (const [componentType, componentExecution] of taskExecution.components) {
      for (const agentId of componentExecution.assignedAgents) {
        // Use ARN for agent service requests
        promises.push(this.executeARNAgentTask(taskId, componentType, agentId, symbols));
      }
    }

    await Promise.all(promises);
    console.log(`✅ ARN: All coordinated agents completed analysis for task ${taskId}`);
  }

  private async executeARNAgentTask(
    taskId: string, 
    componentType: string, 
    agentId: string, 
    symbols: string[]
  ): Promise<void> {
    try {
      console.log(`🔄 ARN: Requesting service from ${agentId} for ${componentType} analysis`);
      
      // Request service through ARN
      const requestId = await this.requestAgentServiceViaRelay(
        componentType,
        { symbols, taskId },
        agentId,
        '$0.05' // Max cost
      );

      // For demo purposes, fall back to direct execution
      // In production, this would wait for ARN response
      await this.executeAgentTask(taskId, componentType, agentId, symbols);
      
      console.log(`✅ ARN: Service completed by ${agentId} (request: ${requestId})`);
      
    } catch (error) {
      console.error(`❌ ARN: Agent task failed for ${agentId}:`, error);
      throw error;
    }
  }

  /**
   * Get Agent Relay Network status and metrics
   */
  getRelayNetworkStatus() {
    return {
      ...agentRelayNetwork.getNetworkStatus(),
      knownAgents: agentRelayNetwork.getKnownAgents(),
      activeRequests: agentRelayNetwork.getActiveRequests(),
      relayStatus: agentRelayNetwork.getRelayStatus(),
      taskCoordinations: agentRelayNetwork.getTaskCoordinations()
    };
  }

  /**
   * Discover agents in the relay network by capability
   */
  async discoverAgentsByCapability(capabilities: string[]) {
    return await agentRelayNetwork.discoverAgents(capabilities);
  }

  /**
   * Find the best agent for a specific task type
   */
  findBestAgentForTask(taskType: string, maxCost?: string) {
    return agentRelayNetwork.findBestAgent(taskType, maxCost);
  }

  /**
   * Request agent service through relay network
   */
  async requestAgentServiceViaRelay(taskType: string, payload: any, targetAgent?: string, maxCost?: string) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    return await agentRelayNetwork.requestAgentService({
      requestId,
      taskType,
      payload,
      targetAgent,
      maxCost,
      deadline: Date.now() + 300000 // 5 minutes
    });
  }

  /**
   * Coordinate multi-agent task through relay network
   */
  async coordinateTaskViaRelay(taskId: string, agents: string[], taskData: any) {
    return await agentRelayNetwork.coordinateTask(taskId, agents, taskData);
  }

  /**
   * Check if the agent manager is running
   */
  getIsRunning(): boolean {
    return this.isRunning;
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