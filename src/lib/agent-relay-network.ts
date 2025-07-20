import { SimplePool } from 'nostr-tools/pool';
import { finalizeEvent, generateSecretKey, getPublicKey, verifyEvent } from 'nostr-tools/pure';
import { bytesToHex, hexToBytes } from '@noble/hashes/utils';
import { EventEmitter } from 'events';

// Agent Relay Network Event Kinds
export const ARN_EVENT_KINDS = {
  AGENT_ANNOUNCEMENT: 30001,  // Agent announces its capabilities
  AGENT_REQUEST: 30002,       // Request for agent services
  AGENT_RESPONSE: 30003,      // Response from agent
  AGENT_DISCOVERY: 30004,     // Query for available agents
  RELAY_STATUS: 30005,        // Relay health and status
  TASK_COORDINATION: 30006,   // Multi-agent task coordination
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

export class AgentRelayNetwork extends EventEmitter {
  private pool: SimplePool;
  private secretKey: Uint8Array;
  private publicKey: string;
  private relays: string[];
  private knownAgents: Map<string, AgentProfile>;
  private activeRequests: Map<string, AgentRequest>;
  private relayStatus: Map<string, RelayStatus>;
  private subscriptions: Map<string, any>;
  private isRunning: boolean;

  constructor(relays: string[] = [], secretKey?: Uint8Array) {
    super();
    
    this.pool = new SimplePool();
    this.secretKey = secretKey || generateSecretKey();
    this.publicKey = getPublicKey(this.secretKey);
    this.relays = relays.length > 0 ? relays : this.getDefaultRelays();
    this.knownAgents = new Map();
    this.activeRequests = new Map();
    this.relayStatus = new Map();
    this.subscriptions = new Map();
    this.isRunning = false;

    console.log(`🌐 Agent Relay Network initialized with pubkey: ${this.publicKey}`);
  }

  private getDefaultRelays(): string[] {
    return [
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://relay.nostr.band',
      'wss://nostr-pub.wellorder.net',
      'wss://relay.current.fyi'
    ];
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    console.log('🚀 Starting Agent Relay Network...');
    
    try {
      // Initialize relay connections
      await this.initializeRelays();
      
      // Set up subscriptions for agent discovery
      await this.setupSubscriptions();
      
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
    
    // Close all subscriptions
    for (const [id, sub] of this.subscriptions) {
      sub.close();
    }
    this.subscriptions.clear();
    
    // Close pool connections
    this.pool.close(this.relays);
    
    this.isRunning = false;
    console.log('✅ Agent Relay Network stopped');
    this.emit('stopped');
  }

  private async initializeRelays(): Promise<void> {
    console.log(`🔗 Connecting to ${this.relays.length} relays...`);
    
    for (const relayUrl of this.relays) {
      try {
        const startTime = Date.now();
        
        // Test connection
        const testEvent = await this.pool.get([relayUrl], { limit: 1 });
        const latency = Date.now() - startTime;
        
        this.relayStatus.set(relayUrl, {
          url: relayUrl,
          connected: true,
          latency,
          agentCount: 0,
          lastPing: Date.now()
        });
        
        console.log(`✅ Connected to relay: ${relayUrl} (${latency}ms)`);
        
      } catch (error) {
        console.warn(`⚠️ Failed to connect to relay: ${relayUrl}`, error);
        this.relayStatus.set(relayUrl, {
          url: relayUrl,
          connected: false,
          latency: -1,
          agentCount: 0,
          lastPing: 0
        });
      }
    }
  }

  private async setupSubscriptions(): Promise<void> {
    console.log('📡 Setting up agent discovery subscriptions...');
    
    // Subscribe to agent announcements
    const agentSub = this.pool.subscribe(
      this.relays,
      { kinds: [ARN_EVENT_KINDS.AGENT_ANNOUNCEMENT] },
      {
        onevent: (event) => this.handleAgentAnnouncement(event),
        oneose: () => console.log('📦 Agent announcements subscription established')
      }
    );
    this.subscriptions.set('agents', agentSub);

    // Subscribe to agent requests directed at us
    const requestSub = this.pool.subscribe(
      this.relays,
      { 
        kinds: [ARN_EVENT_KINDS.AGENT_REQUEST],
        '#p': [this.publicKey]  // Requests tagged with our pubkey
      },
      {
        onevent: (event) => this.handleAgentRequest(event),
        oneose: () => console.log('📦 Agent requests subscription established')
      }
    );
    this.subscriptions.set('requests', requestSub);

    // Subscribe to agent responses for our requests
    const responseSub = this.pool.subscribe(
      this.relays,
      { 
        kinds: [ARN_EVENT_KINDS.AGENT_RESPONSE],
        '#p': [this.publicKey]  // Responses tagged with our pubkey
      },
      {
        onevent: (event) => this.handleAgentResponse(event),
        oneose: () => console.log('📦 Agent responses subscription established')
      }
    );
    this.subscriptions.set('responses', responseSub);

    // Subscribe to task coordination
    const taskSub = this.pool.subscribe(
      this.relays,
      { 
        kinds: [ARN_EVENT_KINDS.TASK_COORDINATION],
        '#p': [this.publicKey]
      },
      {
        onevent: (event) => this.handleTaskCoordination(event),
        oneose: () => console.log('📦 Task coordination subscription established')
      }
    );
    this.subscriptions.set('tasks', taskSub);
  }

  private startPeriodicTasks(): void {
    // Ping relays every 30 seconds
    setInterval(() => this.pingRelays(), 30000);
    
    // Clean up old agents every 5 minutes
    setInterval(() => this.cleanupOldAgents(), 300000);
    
    // Announce our presence every 2 minutes
    setInterval(() => this.announcePresence(), 120000);
  }

  async announceAgent(profile: Omit<AgentProfile, 'publicKey' | 'lastSeen'>): Promise<void> {
    const agentProfile: AgentProfile = {
      ...profile,
      publicKey: this.publicKey,
      lastSeen: Date.now(),
      relays: this.relays
    };

    const event = finalizeEvent({
      kind: ARN_EVENT_KINDS.AGENT_ANNOUNCEMENT,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['d', profile.agentId],  // Replaceable event identifier
        ['name', profile.name],
        ['capabilities', ...profile.capabilities],
        ['specialties', ...profile.specialties],
        ['reputation', profile.reputation.toString()],
        ['cost', profile.cost],
        ['endpoint', profile.endpoint]
      ],
      content: JSON.stringify(agentProfile),
    }, this.secretKey);

    await Promise.race(this.pool.publish(this.relays, event));
    
    // Store our own agent profile
    this.knownAgents.set(profile.agentId, agentProfile);
    
    console.log(`📢 Announced agent: ${profile.name} (${profile.agentId})`);
    this.emit('agent-announced', agentProfile);
  }

  async discoverAgents(capabilities?: string[]): Promise<AgentProfile[]> {
    console.log('🔍 Discovering available agents...');
    
    const filter: any = { kinds: [ARN_EVENT_KINDS.AGENT_ANNOUNCEMENT] };
    if (capabilities && capabilities.length > 0) {
      filter['#capabilities'] = capabilities;
    }

    const events = await this.pool.querySync(this.relays, filter);
    
    const agents: AgentProfile[] = [];
    for (const event of events) {
      try {
        const profile = JSON.parse(event.content) as AgentProfile;
        profile.lastSeen = event.created_at * 1000;
        
        this.knownAgents.set(profile.agentId, profile);
        agents.push(profile);
      } catch (error) {
        console.warn('Failed to parse agent profile:', error);
      }
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

    const tags = [
      ['request_id', request.requestId],
      ['task_type', request.taskType],
      ['p', fullRequest.requesterPubkey]  // Tag with requester pubkey
    ];

    if (request.targetAgent) {
      const targetAgent = this.knownAgents.get(request.targetAgent);
      if (targetAgent) {
        tags.push(['p', targetAgent.publicKey]);  // Tag with target agent pubkey
      }
    }

    if (request.maxCost) {
      tags.push(['max_cost', request.maxCost]);
    }

    if (request.deadline) {
      tags.push(['deadline', request.deadline.toString()]);
    }

    const event = finalizeEvent({
      kind: ARN_EVENT_KINDS.AGENT_REQUEST,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content: JSON.stringify(fullRequest),
    }, this.secretKey);

    await Promise.any(this.pool.publish(this.relays, event));
    
    this.activeRequests.set(request.requestId, fullRequest);
    
    console.log(`📤 Sent agent request: ${request.requestId} (${request.taskType})`);
    this.emit('request-sent', fullRequest);
    
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
      signature: '', // Will be filled by event signature
      timestamp: Date.now()
    };

    const event = finalizeEvent({
      kind: ARN_EVENT_KINDS.AGENT_RESPONSE,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['request_id', requestId],
        ['p', request.requesterPubkey],  // Tag with original requester
        ['cost', cost]
      ],
      content: JSON.stringify(response),
    }, this.secretKey);

    response.signature = event.sig;

    await Promise.any(this.pool.publish(this.relays, event));
    
    console.log(`📥 Sent response for request: ${requestId}`);
    this.emit('response-sent', response);
  }

  async coordinateTask(taskId: string, agents: string[], taskData: any): Promise<void> {
    const coordination = {
      taskId,
      coordinator: this.publicKey,
      agents,
      taskData,
      timestamp: Date.now()
    };

    const tags = [
      ['task_id', taskId],
      ['coordinator', this.publicKey]
    ];

    // Tag all participating agents
    for (const agentId of agents) {
      const agent = this.knownAgents.get(agentId);
      if (agent) {
        tags.push(['p', agent.publicKey]);
      }
    }

    const event = finalizeEvent({
      kind: ARN_EVENT_KINDS.TASK_COORDINATION,
      created_at: Math.floor(Date.now() / 1000),
      tags,
      content: JSON.stringify(coordination),
    }, this.secretKey);

    await Promise.any(this.pool.publish(this.relays, event));
    
    console.log(`🎯 Coordinated task: ${taskId} with ${agents.length} agents`);
    this.emit('task-coordinated', coordination);
  }

  private handleAgentAnnouncement(event: { content: string; created_at: number }): void {
    try {
      const profile = JSON.parse(event.content) as AgentProfile;
      profile.lastSeen = event.created_at * 1000;
      
      this.knownAgents.set(profile.agentId, profile);
      
      console.log(`🤖 Discovered agent: ${profile.name} (${profile.agentId})`);
      this.emit('agent-discovered', profile);
      
    } catch (error) {
      console.warn('Failed to parse agent announcement:', error);
    }
  }

  private handleAgentRequest(event: { content: string }): void {
    try {
      const request = JSON.parse(event.content) as AgentRequest;
      
      console.log(`📨 Received agent request: ${request.requestId} (${request.taskType})`);
      this.emit('request-received', request);
      
    } catch (error) {
      console.warn('Failed to parse agent request:', error);
    }
  }

  private handleAgentResponse(event: { content: string }): void {
    try {
      const response = JSON.parse(event.content) as AgentResponse;
      
      // Remove from active requests
      this.activeRequests.delete(response.requestId);
      
      console.log(`📨 Received agent response: ${response.requestId}`);
      this.emit('response-received', response);
      
    } catch (error) {
      console.warn('Failed to parse agent response:', error);
    }
  }

  private handleTaskCoordination(event: { content: string }): void {
    try {
      const coordination = JSON.parse(event.content);
      
      console.log(`🎯 Received task coordination: ${coordination.taskId}`);
      this.emit('task-coordination-received', coordination);
      
    } catch (error) {
      console.warn('Failed to parse task coordination:', error);
    }
  }

  private async pingRelays(): Promise<void> {
    for (const [relayUrl, status] of this.relayStatus) {
      try {
        const startTime = Date.now();
        await this.pool.get([relayUrl], { limit: 1 });
        const latency = Date.now() - startTime;
        
        status.connected = true;
        status.latency = latency;
        status.lastPing = Date.now();
        
      } catch (error) {
        status.connected = false;
        status.latency = -1;
      }
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
    // This would be called if we're running as an agent
    // For now, just emit a presence event
    this.emit('presence-announced', {
      publicKey: this.publicKey,
      timestamp: Date.now(),
      relays: this.relays
    });
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

  getPublicKey(): string {
    return this.publicKey;
  }

  getSecretKeyHex(): string {
    return bytesToHex(this.secretKey);
  }

  isConnected(): boolean {
    return this.isRunning && Array.from(this.relayStatus.values()).some(s => s.connected);
  }

  getConnectedRelayCount(): number {
    return Array.from(this.relayStatus.values()).filter(s => s.connected).length;
  }
} 