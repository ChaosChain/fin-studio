import { EventEmitter } from 'events';

// Agent Relay Network Event Kinds (using custom event types for now)
export const ARN_EVENT_KINDS = {
  AGENT_ANNOUNCEMENT: 'agent-announcement',
  AGENT_REQUEST: 'agent-request', 
  AGENT_RESPONSE: 'agent-response',
  AGENT_DISCOVERY: 'agent-discovery',
  RELAY_STATUS: 'relay-status',
  TASK_COORDINATION: 'task-coordination',
} as const;

export interface AgentProfile {
  agentId: string;
  name: string;
  capabilities: string[];
  specialties: string[];
  reputation: number;
  cost: string;
  endpoint: string;
  publicKey: string;
  lastSeen: number;
  relays: string[];
}

export interface AgentRequest {
  requestId: string;
  taskType: string;
  payload: any;
  requesterPubkey: string;
  targetAgent?: string;
  maxCost?: string;
  deadline?: number;
  relays: string[];
}

export interface AgentResponse {
  requestId: string;
  agentId: string;
  result: any;
  cost: string;
  signature: string;
  timestamp: number;
}

export interface RelayStatus {
  url: string;
  connected: boolean;
  latency: number;
  agentCount: number;
  lastPing: number;
}

export interface TaskCoordination {
  taskId: string;
  coordinator: string;
  agents: string[];
  taskData: any;
  timestamp: number;
}

/**
 * Agent Relay Network - Decentralized agent discovery and communication
 * 
 * This implementation provides:
 * - Agent discovery and registration
 * - Request/response routing between agents
 * - Task coordination for multi-agent workflows
 * - Relay health monitoring
 * - Reputation tracking integration
 */
export class AgentRelayNetwork extends EventEmitter {
  private knownAgents: Map<string, AgentProfile>;
  private activeRequests: Map<string, AgentRequest>;
  private relayStatus: Map<string, RelayStatus>;
  private taskCoordinations: Map<string, TaskCoordination>;
  private isRunning: boolean;
  private publicKey: string;
  private relays: string[];

  constructor(relays: string[] = []) {
    super();
    
    this.knownAgents = new Map();
    this.activeRequests = new Map();
    this.relayStatus = new Map();
    this.taskCoordinations = new Map();
    this.isRunning = false;
    this.publicKey = this.generatePublicKey();
    this.relays = relays.length > 0 ? relays : this.getDefaultRelays();

    console.log(`🌐 Agent Relay Network initialized with ID: ${this.publicKey.slice(0, 8)}...`);
  }

  private generatePublicKey(): string {
    // Generate a simple unique identifier for this session
    return `arn-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private getDefaultRelays(): string[] {
    return [
      'local-relay-1',
      'local-relay-2', 
      'local-relay-3'
    ];
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    console.log('🚀 Starting Agent Relay Network...');
    
    try {
      // Initialize relay connections (simulated)
      await this.initializeRelays();
      
      // Start periodic tasks
      this.startPeriodicTasks();
      
      this.isRunning = true;
      console.log('✅ Agent Relay Network started successfully');
      this.emit('started');
      
    } catch (error) {
      console.error('❌ Failed to start Agent Relay Network:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('🛑 Stopping Agent Relay Network...');
    
    this.isRunning = false;
    console.log('✅ Agent Relay Network stopped');
    this.emit('stopped');
  }

  private async initializeRelays(): Promise<void> {
    console.log(`🔗 Connecting to ${this.relays.length} relays...`);
    
    for (const relayUrl of this.relays) {
      // Simulate relay connection
      this.relayStatus.set(relayUrl, {
        url: relayUrl,
        connected: true,
        latency: Math.floor(Math.random() * 100) + 50, // 50-150ms
        agentCount: 0,
        lastPing: Date.now()
      });
      
      console.log(`✅ Connected to relay: ${relayUrl}`);
    }
  }

  private startPeriodicTasks(): void {
    // Ping relays every 30 seconds
    setInterval(() => this.pingRelays(), 30000);
    
    // Clean up old agents every 5 minutes
    setInterval(() => this.cleanupOldAgents(), 300000);
    
    // Announce presence every 2 minutes
    setInterval(() => this.announcePresence(), 120000);
  }

  async announceAgent(profile: Omit<AgentProfile, 'publicKey' | 'lastSeen'>): Promise<void> {
    const agentProfile: AgentProfile = {
      ...profile,
      publicKey: this.publicKey,
      lastSeen: Date.now(),
      relays: this.relays
    };

    // Store agent profile
    this.knownAgents.set(profile.agentId, agentProfile);
    
    console.log(`📢 Announced agent: ${profile.name} (${profile.agentId})`);
    this.emit('agent-announced', agentProfile);
  }

  async discoverAgents(capabilities?: string[]): Promise<AgentProfile[]> {
    console.log('🔍 Discovering available agents...');
    
    let agents = Array.from(this.knownAgents.values());
    
    // Filter by capabilities if specified
    if (capabilities && capabilities.length > 0) {
      agents = agents.filter(agent => 
        capabilities.some(cap => agent.capabilities.includes(cap))
      );
    }

    console.log(`🎯 Discovered ${agents.length} agents`);
    this.emit('agents-discovered', agents);
    
    return agents;
  }

  async requestAgentService(request: Omit<AgentRequest, 'requesterPubkey' | 'relays'>): Promise<string> {
    const fullRequest: AgentRequest = {
      ...request,
      requesterPubkey: this.publicKey,
      relays: this.relays
    };

    this.activeRequests.set(request.requestId, fullRequest);
    
    console.log(`📤 Sent agent request: ${request.requestId} (${request.taskType})`);
    this.emit('request-sent', fullRequest);
    
    // Simulate routing to target agent or broadcast
    if (request.targetAgent && this.knownAgents.has(request.targetAgent)) {
      this.emit('request-received', fullRequest);
    } else {
      // Broadcast to all capable agents
      const capableAgents = Array.from(this.knownAgents.values()).filter(agent =>
        agent.capabilities.some(cap => request.taskType.includes(cap))
      );
      
      capableAgents.forEach(() => {
        this.emit('request-received', fullRequest);
      });
    }
    
    return request.requestId;
  }

  async respondToRequest(requestId: string, result: any, cost: string): Promise<void> {
    const request = this.activeRequests.get(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    const response: AgentResponse = {
      requestId,
      agentId: this.publicKey,
      result,
      cost,
      signature: `sig-${Date.now()}`, // Simplified signature
      timestamp: Date.now()
    };

    console.log(`📥 Sent response for request: ${requestId}`);
    this.emit('response-sent', response);
    this.emit('response-received', response); // Simulate delivery
  }

  async coordinateTask(taskId: string, agents: string[], taskData: any): Promise<void> {
    // Ensure agents is an array
    const agentList = Array.isArray(agents) ? agents : [];
    
    const coordination: TaskCoordination = {
      taskId,
      coordinator: this.publicKey,
      agents: agentList,
      taskData,
      timestamp: Date.now()
    };

    this.taskCoordinations.set(taskId, coordination);
    
    console.log(`🎯 Coordinated task: ${taskId} with ${agentList.length} agents`);
    this.emit('task-coordinated', coordination);
    
    // Notify participating agents
    agentList.forEach(agentId => {
      if (this.knownAgents.has(agentId)) {
        this.emit('task-coordination-received', coordination);
      }
    });
  }

  private async pingRelays(): Promise<void> {
    for (const [relayUrl, status] of this.relayStatus) {
      // Simulate ping
      status.connected = Math.random() > 0.1; // 90% uptime
      status.latency = Math.floor(Math.random() * 100) + 50;
      status.lastPing = Date.now();
      status.agentCount = this.knownAgents.size;
    }
  }

  private cleanupOldAgents(): void {
    const cutoff = Date.now() - 600000; // 10 minutes
    
    for (const [agentId, profile] of this.knownAgents) {
      if (profile.lastSeen < cutoff) {
        this.knownAgents.delete(agentId);
        console.log(`🧹 Cleaned up old agent: ${profile.name} (${agentId})`);
      }
    }
  }

  private async announcePresence(): Promise<void> {
    this.emit('presence-announced', {
      publicKey: this.publicKey,
      timestamp: Date.now(),
      relays: this.relays
    });
  }

  // Agent Network Status Methods
  getNetworkStatus() {
    return {
      isRunning: this.isRunning,
      connectedRelays: this.getConnectedRelayCount(),
      totalRelays: this.relays.length,
      knownAgents: this.knownAgents.size,
      activeRequests: this.activeRequests.size,
      taskCoordinations: this.taskCoordinations.size,
      uptime: this.isRunning ? Date.now() - (Date.now() - 30000) : 0 // Simplified
    };
  }

  // Getters
  getKnownAgents(): AgentProfile[] {
    return Array.from(this.knownAgents.values());
  }

  getActiveRequests(): AgentRequest[] {
    return Array.from(this.activeRequests.values());
  }

  getRelayStatus(): RelayStatus[] {
    return Array.from(this.relayStatus.values());
  }

  getTaskCoordinations(): TaskCoordination[] {
    return Array.from(this.taskCoordinations.values());
  }

  getPublicKey(): string {
    return this.publicKey;
  }

  isConnected(): boolean {
    return this.isRunning && Array.from(this.relayStatus.values()).some(s => s.connected);
  }

  getConnectedRelayCount(): number {
    return Array.from(this.relayStatus.values()).filter(s => s.connected).length;
  }

  // Agent lookup and routing helpers
  findAgentByCapability(capability: string): AgentProfile[] {
    return Array.from(this.knownAgents.values()).filter(agent =>
      agent.capabilities.includes(capability)
    );
  }

  findBestAgent(taskType: string, maxCost?: string): AgentProfile | null {
    const candidates = Array.from(this.knownAgents.values()).filter(agent =>
      agent.capabilities.some(cap => taskType.includes(cap))
    );

    if (candidates.length === 0) return null;

    // Sort by reputation and cost
    candidates.sort((a, b) => {
      if (maxCost) {
        const aCost = parseFloat(a.cost.replace('$', ''));
        const bCost = parseFloat(b.cost.replace('$', ''));
        const maxCostNum = parseFloat(maxCost.replace('$', ''));
        
        if (aCost <= maxCostNum && bCost > maxCostNum) return -1;
        if (bCost <= maxCostNum && aCost > maxCostNum) return 1;
      }
      
      return b.reputation - a.reputation;
    });

    return candidates[0];
  }

  // Event subscription helpers for external integration
  onAgentDiscovered(callback: (agent: AgentProfile) => void) {
    this.on('agent-discovered', callback);
  }

  onRequestReceived(callback: (request: AgentRequest) => void) {
    this.on('request-received', callback);
  }

  onResponseReceived(callback: (response: AgentResponse) => void) {
    this.on('response-received', callback);
  }

  onTaskCoordination(callback: (coordination: TaskCoordination) => void) {
    this.on('task-coordination-received', callback);
  }
}

// Global instance for the application
export const agentRelayNetwork = new AgentRelayNetwork(); 