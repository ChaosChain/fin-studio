import { EventEmitter } from 'events';
import { NostrAgentRelayNetwork, NostrAgentProfile, NostrAgentRequest, NostrAgentResponse } from './nostr-agent-relay-network';

/**
 * Integration layer between Agent Manager and Nostr ARN
 * 
 * This class provides a bridge between the existing agent manager
 * and the new Nostr-based Agent Relay Network implementation.
 */
export class NostrARNIntegration extends EventEmitter {
  private nostrARN: NostrAgentRelayNetwork;
  private agentProfiles: Map<string, NostrAgentProfile>;
  private pendingRequests: Map<string, { resolve: Function; reject: Function; timeout: NodeJS.Timeout }>;

  constructor(nostrARN: NostrAgentRelayNetwork) {
    super();
    this.nostrARN = nostrARN;
    this.agentProfiles = new Map();
    this.pendingRequests = new Map();
    
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle incoming agent announcements
    this.nostrARN.onAgentAnnounced((agent: NostrAgentProfile) => {
      this.agentProfiles.set(agent.publicKey, agent);
      this.emit('agent-discovered', this.convertToLegacyAgentProfile(agent));
    });

    // Handle incoming service requests
    this.nostrARN.onRequestReceived((request: NostrAgentRequest, event) => {
      this.emit('request-received', {
        requestId: request.requestId,
        taskType: request.taskType,
        payload: request.payload,
        requesterPubkey: request.requesterPubkey,
        targetAgent: request.targetAgent,
        maxCost: request.maxCost,
        deadline: request.deadline,
        relays: [event.id] // Use event ID as relay reference
      });
    });

    // Handle incoming service responses
    this.nostrARN.onResponseReceived((response: NostrAgentResponse, event) => {
      const pendingRequest = this.pendingRequests.get(response.requestId);
      if (pendingRequest) {
        clearTimeout(pendingRequest.timeout);
        pendingRequest.resolve(response);
        this.pendingRequests.delete(response.requestId);
      }
      
      this.emit('response-received', {
        requestId: response.requestId,
        agentId: response.agentId,
        result: response.result,
        cost: response.cost,
        signature: event.sig,
        timestamp: response.timestamp
      });
    });

    // Handle task coordination
    this.nostrARN.onTaskCoordination((coordination, event) => {
      this.emit('task-coordination', {
        taskId: coordination.taskId,
        coordinator: coordination.coordinator,
        agents: coordination.agents,
        taskData: coordination.taskData,
        timestamp: coordination.timestamp
      });
    });
  }

  async start(): Promise<void> {
    await this.nostrARN.start();
    
    // Register our base agents in the Nostr network
    await this.registerChaosChainAgents();
  }

  async stop(): Promise<void> {
    // Cancel all pending requests
    for (const [requestId, pending] of this.pendingRequests) {
      clearTimeout(pending.timeout);
      pending.reject(new Error('Network shutting down'));
    }
    this.pendingRequests.clear();
    
    await this.nostrARN.stop();
  }

  private async registerChaosChainAgents(): Promise<void> {
    const baseAgents = [
      {
        agentId: 'market-research-agent',
        name: 'Market Research Agent',
        capabilities: ['market_research', 'news_analysis', 'sentiment_analysis'],
        specialties: ['crypto', 'stocks', 'market_trends'],
        reputation: 95,
        cost: '0.001'
      },
      {
        agentId: 'macro-research-agent',
        name: 'Macro Research Agent', 
        capabilities: ['macro_analysis', 'economic_indicators', 'policy_analysis'],
        specialties: ['economics', 'policy', 'macro_trends'],
        reputation: 93,
        cost: '0.002'
      },
      {
        agentId: 'price-analysis-agent',
        name: 'Price Analysis Agent',
        capabilities: ['technical_analysis', 'price_analysis', 'chart_analysis'],
        specialties: ['technical_analysis', 'price_patterns', 'trading_signals'],
        reputation: 97,
        cost: '0.0015'
      },
      {
        agentId: 'insights-agent',
        name: 'Insights Agent',
        capabilities: ['report_generation', 'synthesis', 'recommendations'],
        specialties: ['investment_insights', 'strategic_analysis', 'reporting'],
        reputation: 94,
        cost: '0.0025'
      }
    ];

    // Register model variants
    const modelVariants = ['gpt4', 'gpt4o'];
    const allAgents = [...baseAgents];
    
    for (const agent of baseAgents) {
      for (const variant of modelVariants) {
        allAgents.push({
          ...agent,
          agentId: `${agent.agentId}-${variant}`,
          name: `${agent.name} (${variant.toUpperCase()})`,
          reputation: agent.reputation + (variant === 'gpt4o' ? 2 : 0),
          cost: (parseFloat(agent.cost) * (variant === 'gpt4o' ? 1.5 : 1.2)).toString()
        });
      }
    }

    // Register verifier agents
    for (let i = 1; i <= 4; i++) {
      allAgents.push({
        agentId: `verifier-agent-${i}`,
        name: `Verifier Agent ${i}`,
        capabilities: ['verification', 'consensus', 'validation'],
        specialties: ['result_verification', 'consensus_building', 'quality_assurance'],
        reputation: 98,
        cost: '0.0005'
      });
    }

    console.log(`🤖 Registering ${allAgents.length} ChaosChain agents in Nostr network...`);

    for (const agent of allAgents) {
      try {
        await this.nostrARN.announceAgent(agent);
        console.log(`✅ Registered: ${agent.name}`);
      } catch (error) {
        console.warn(`❌ Failed to register ${agent.name}:`, error);
      }
    }

    console.log(`🎉 Successfully registered ${allAgents.length} agents in Nostr ARN`);
  }

  async discoverAgents(capabilities?: string[]): Promise<any[]> {
    const nostrAgents = await this.nostrARN.discoverAgents(capabilities);
    return nostrAgents.map(agent => this.convertToLegacyAgentProfile(agent));
  }

  async requestAgentService(taskType: string, payload: any, targetAgent?: string, maxCost?: string): Promise<string> {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    
    const request: Omit<NostrAgentRequest, 'requesterPubkey'> = {
      requestId,
      taskType,
      payload,
      targetAgent,
      maxCost,
      deadline: Date.now() + 30000, // 30 second timeout
    };

    // Create promise for response
    const responsePromise = new Promise<NostrAgentResponse>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(requestId);
        reject(new Error(`Request ${requestId} timed out`));
      }, 30000);

      this.pendingRequests.set(requestId, { resolve, reject, timeout });
    });

    // Send request
    await this.nostrARN.requestAgentService(request);

    // Wait for response
    const response = await responsePromise;
    return response.requestId;
  }

  async coordinateTask(taskId: string, agents: string[], taskData: any): Promise<void> {
    // Convert legacy agent IDs to public keys if needed
    const agentPubkeys = agents.map(agentId => {
      // If it's already a pubkey (64 hex chars), use it
      if (/^[a-f0-9]{64}$/i.test(agentId)) {
        return agentId;
      }
      
      // Otherwise, find the agent by ID
      for (const [pubkey, profile] of this.agentProfiles) {
        if (profile.agentId === agentId) {
          return pubkey;
        }
      }
      
      // If not found, use a placeholder (this should be handled better in production)
      return this.nostrARN.getPublicKey();
    });

    await this.nostrARN.coordinateTask(taskId, agentPubkeys, taskData);
  }

  private convertToLegacyAgentProfile(nostrAgent: NostrAgentProfile): any {
    return {
      agentId: nostrAgent.agentId,
      name: nostrAgent.name,
      capabilities: nostrAgent.capabilities,
      specialties: nostrAgent.specialties,
      reputation: nostrAgent.reputation,
      cost: nostrAgent.cost,
      endpoint: nostrAgent.endpoint,
      publicKey: nostrAgent.publicKey,
      lastSeen: nostrAgent.lastSeen,
      relays: [nostrAgent.publicKey] // Use pubkey as relay reference
    };
  }

  getNetworkStatus() {
    const nostrStatus = this.nostrARN.getNetworkStatus();
    
    // Convert to legacy format for compatibility
    return {
      isRunning: nostrStatus.isRunning,
      knownAgents: this.nostrARN.getKnownAgents().map(agent => this.convertToLegacyAgentProfile(agent)),
      activeRequests: this.nostrARN.getActiveRequests().map(req => ({
        requestId: req.requestId,
        taskType: req.taskType,
        payload: req.payload,
        targetAgent: req.targetAgent,
        maxCost: req.maxCost,
        deadline: req.deadline,
        requesterPubkey: req.requesterPubkey,
        relays: [req.requesterPubkey]
      })),
      taskCoordinations: this.nostrARN.getTaskCoordinations().map(coord => ({
        taskId: coord.taskId,
        coordinator: coord.coordinator,
        agents: coord.agents,
        taskData: coord.taskData,
        timestamp: coord.timestamp
      })),
      relayStatus: nostrStatus.relayStatus.map(relay => ({
        url: relay.url,
        connected: relay.connected,
        latency: relay.latency,
        agentCount: relay.agentCount,
        lastPing: relay.lastPing
      })),
      connectedRelays: nostrStatus.connectedRelays,
      totalRelays: nostrStatus.totalRelays,
      uptime: nostrStatus.uptime
    };
  }

  // Event handler registration methods for compatibility
  onAgentDiscovered(handler: (agent: any) => void) {
    this.on('agent-discovered', handler);
  }

  onRequestReceived(handler: (request: any) => void) {
    this.on('request-received', handler);
  }

  onResponseReceived(handler: (response: any) => void) {
    this.on('response-received', handler);
  }

  onTaskCoordination(handler: (coordination: any) => void) {
    this.on('task-coordination', handler);
  }
} 