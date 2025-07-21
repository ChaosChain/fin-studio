import { EventEmitter } from 'events';
import { generateSecretKey, getPublicKey, finalizeEvent, Event, EventTemplate, VerifiedEvent } from 'nostr-tools';
import { Relay } from 'nostr-tools';
import { Filter } from 'nostr-tools';

// Custom Nostr Event Kinds for Agent Relay Network (using custom range 30000-39999)
export const NOSTR_ARN_KINDS = {
  AGENT_ANNOUNCEMENT: 30001,    // Parameterized replaceable - agent profile updates
  AGENT_REQUEST: 20001,         // Ephemeral - service requests  
  AGENT_RESPONSE: 20002,        // Ephemeral - service responses
  AGENT_DISCOVERY: 20003,       // Ephemeral - discovery queries
  TASK_COORDINATION: 20004,     // Ephemeral - multi-agent coordination
  RELAY_STATUS: 20005,          // Ephemeral - relay health updates
} as const;

export interface NostrAgentProfile {
  agentId: string;
  name: string;
  capabilities: string[];
  specialties: string[];
  reputation: number;
  cost: string;
  endpoint: string;
  publicKey: string;
  lastSeen: number;
  metadata?: Record<string, any>;
}

export interface NostrAgentRequest {
  requestId: string;
  taskType: string;
  payload: any;
  requesterPubkey: string;
  targetAgent?: string;
  maxCost?: string;
  deadline?: number;
  metadata?: Record<string, any>;
}

export interface NostrAgentResponse {
  requestId: string;
  agentId: string;
  result: any;
  cost: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface NostrRelayStatus {
  url: string;
  connected: boolean;
  latency: number;
  agentCount: number;
  lastPing: number;
  subscriptions: number;
}

export interface NostrTaskCoordination {
  taskId: string;
  coordinator: string;
  agents: string[];
  taskData: any;
  timestamp: number;
  status: 'pending' | 'active' | 'completed' | 'failed';
}

/**
 * Nostr-based Agent Relay Network
 * 
 * This implementation provides true decentralized agent communication using the Nostr protocol:
 * - Real cryptographic identity (secp256k1 keypairs)
 * - Decentralized relay network communication
 * - Event-based agent discovery and coordination
 * - Censorship-resistant messaging
 * - Cross-platform compatibility
 */
export class NostrAgentRelayNetwork extends EventEmitter {
  private secretKey: Uint8Array;
  private publicKey: string;
  private relays: Map<string, Relay>;
  private knownAgents: Map<string, NostrAgentProfile>;
  private activeRequests: Map<string, NostrAgentRequest>;
  private taskCoordinations: Map<string, NostrTaskCoordination>;
  private relayStatus: Map<string, NostrRelayStatus>;
  private subscriptions: Map<string, any>;
  private isRunning: boolean;
  private relayUrls: string[];

  constructor(relayUrls?: string[]) {
    super();
    
    // Generate cryptographic identity
    this.secretKey = generateSecretKey();
    this.publicKey = getPublicKey(this.secretKey);
    
    // Initialize collections
    this.relays = new Map();
    this.knownAgents = new Map();
    this.activeRequests = new Map();
    this.taskCoordinations = new Map();
    this.relayStatus = new Map();
    this.subscriptions = new Map();
    
    this.isRunning = false;
    this.relayUrls = relayUrls || this.getDefaultNostrRelays();

    console.log(`🌐 Nostr Agent Relay Network initialized`);
    console.log(`🔑 Public Key: ${this.publicKey.slice(0, 16)}...`);
    console.log(`📡 Configured Relays: ${this.relayUrls.length}`);
  }

  private getDefaultNostrRelays(): string[] {
    return [
      'wss://relay.damus.io',
      'wss://nos.lol',
      'wss://relay.nostr.band',
      'wss://nostr.wine',
      'wss://relay.snort.social'
    ];
  }

  async start(): Promise<void> {
    if (this.isRunning) return;

    console.log('🚀 Starting Nostr Agent Relay Network...');
    
    try {
      // Connect to Nostr relays
      await this.connectToRelays();
      
      // Set up subscriptions
      await this.setupSubscriptions();
      
      // Announce our presence
      await this.announceAgent();
      
      this.isRunning = true;
      console.log('✅ Nostr Agent Relay Network started successfully');
      console.log(`📡 Connected to ${this.relays.size} relays`);
      this.emit('started');
      
    } catch (error) {
      console.error('❌ Failed to start Nostr Agent Relay Network:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) return;

    console.log('🛑 Stopping Nostr Agent Relay Network...');
    
    // Close all subscriptions
    for (const [subId, sub] of Array.from(this.subscriptions.entries())) {
      try {
        sub.close();
      } catch (error) {
        console.warn(`Failed to close subscription ${subId}:`, error);
      }
    }
    this.subscriptions.clear();
    
    // Close relay connections
    for (const [url, relay] of Array.from(this.relays.entries())) {
      try {
        relay.close();
      } catch (error) {
        console.warn(`Failed to close relay ${url}:`, error);
      }
    }
    this.relays.clear();
    
    this.isRunning = false;
    console.log('✅ Nostr Agent Relay Network stopped');
    this.emit('stopped');
  }

  private async connectToRelays(): Promise<void> {
    console.log(`🔗 Connecting to ${this.relayUrls.length} Nostr relays...`);
    
    const connectionPromises = this.relayUrls.map(async (url) => {
      try {
        const relay = await Relay.connect(url);
        this.relays.set(url, relay);
        
        // Track relay status
        this.relayStatus.set(url, {
          url,
          connected: true,
          latency: 0,
          agentCount: 0,
          lastPing: Date.now(),
          subscriptions: 0
        });
        
        // Set up relay event handlers
        relay.onclose = () => {
          console.log(`📡 Relay disconnected: ${url}`);
          this.relays.delete(url);
          const status = this.relayStatus.get(url);
          if (status) {
            status.connected = false;
            this.relayStatus.set(url, status);
          }
          this.emit('relay-disconnected', url);
        };
        
        console.log(`✅ Connected to relay: ${url}`);
        this.emit('relay-connected', url);
        
      } catch (error) {
        console.warn(`❌ Failed to connect to relay ${url}:`, error);
        this.relayStatus.set(url, {
          url,
          connected: false,
          latency: -1,
          agentCount: 0,
          lastPing: Date.now(),
          subscriptions: 0
        });
      }
    });
    
    await Promise.allSettled(connectionPromises);
    console.log(`📡 Connected to ${this.relays.size}/${this.relayUrls.length} relays`);
  }

  private async setupSubscriptions(): Promise<void> {
    console.log('📡 Setting up Nostr subscriptions...');
    
    // Subscribe to agent announcements
    await this.subscribeToAgentAnnouncements();
    
    // Subscribe to requests directed at us
    await this.subscribeToAgentRequests();
    
    // Subscribe to responses to our requests
    await this.subscribeToAgentResponses();
    
    // Subscribe to task coordination events
    await this.subscribeToTaskCoordination();
    
    console.log(`📡 Set up ${this.subscriptions.size} subscriptions`);
  }

  private async subscribeToAgentAnnouncements(): Promise<void> {
    const filter: Filter = {
      kinds: [NOSTR_ARN_KINDS.AGENT_ANNOUNCEMENT],
      since: Math.floor(Date.now() / 1000) - 3600, // Last hour
    };
    
    const subId = 'agent-announcements';
    const relayPromises = Array.from(this.relays.values()).map(async (relay) => {
      const sub = relay.subscribe([filter], {
        onevent: (event: Event) => this.handleAgentAnnouncement(event),
        oneose: () => console.log(`📡 EOSE for agent announcements on ${relay.url}`),
      });
      return sub;
    });
    
    const subs = await Promise.all(relayPromises);
    this.subscriptions.set(subId, { subs, close: () => subs.forEach(s => s.close()) });
  }

  private async subscribeToAgentRequests(): Promise<void> {
    const filter: Filter = {
      kinds: [NOSTR_ARN_KINDS.AGENT_REQUEST],
      '#p': [this.publicKey], // Requests directed at our pubkey
      since: Math.floor(Date.now() / 1000) - 300, // Last 5 minutes
    };
    
    const subId = 'agent-requests';
    const relayPromises = Array.from(this.relays.values()).map(async (relay) => {
      const sub = relay.subscribe([filter], {
        onevent: (event: Event) => this.handleAgentRequest(event),
        oneose: () => console.log(`📡 EOSE for agent requests on ${relay.url}`),
      });
      return sub;
    });
    
    const subs = await Promise.all(relayPromises);
    this.subscriptions.set(subId, { subs, close: () => subs.forEach(s => s.close()) });
  }

  private async subscribeToAgentResponses(): Promise<void> {
    const filter: Filter = {
      kinds: [NOSTR_ARN_KINDS.AGENT_RESPONSE],
      '#p': [this.publicKey], // Responses directed at our pubkey
      since: Math.floor(Date.now() / 1000) - 300, // Last 5 minutes
    };
    
    const subId = 'agent-responses';
    const relayPromises = Array.from(this.relays.values()).map(async (relay) => {
      const sub = relay.subscribe([filter], {
        onevent: (event: Event) => this.handleAgentResponse(event),
        oneose: () => console.log(`📡 EOSE for agent responses on ${relay.url}`),
      });
      return sub;
    });
    
    const subs = await Promise.all(relayPromises);
    this.subscriptions.set(subId, { subs, close: () => subs.forEach(s => s.close()) });
  }

  private async subscribeToTaskCoordination(): Promise<void> {
    const filter: Filter = {
      kinds: [NOSTR_ARN_KINDS.TASK_COORDINATION],
      '#p': [this.publicKey], // Coordination events that include us
      since: Math.floor(Date.now() / 1000) - 600, // Last 10 minutes
    };
    
    const subId = 'task-coordination';
    const relayPromises = Array.from(this.relays.values()).map(async (relay) => {
      const sub = relay.subscribe([filter], {
        onevent: (event: Event) => this.handleTaskCoordination(event),
        oneose: () => console.log(`📡 EOSE for task coordination on ${relay.url}`),
      });
      return sub;
    });
    
    const subs = await Promise.all(relayPromises);
    this.subscriptions.set(subId, { subs, close: () => subs.forEach(s => s.close()) });
  }

  private handleAgentAnnouncement(event: Event): void {
    try {
      const agentProfile: NostrAgentProfile = JSON.parse(event.content);
      agentProfile.publicKey = event.pubkey;
      agentProfile.lastSeen = event.created_at * 1000;
      
      this.knownAgents.set(event.pubkey, agentProfile);
      
      console.log(`🤖 Agent announced: ${agentProfile.name} (${agentProfile.agentId})`);
      this.emit('agent-announced', agentProfile);
      
    } catch (error) {
      console.warn('Failed to parse agent announcement:', error);
    }
  }

  private handleAgentRequest(event: Event): void {
    try {
      const request: NostrAgentRequest = JSON.parse(event.content);
      request.requesterPubkey = event.pubkey;
      
      this.activeRequests.set(request.requestId, request);
      
      console.log(`📤 Agent request received: ${request.requestId} (${request.taskType})`);
      this.emit('request-received', request, event);
      
    } catch (error) {
      console.warn('Failed to parse agent request:', error);
    }
  }

  private handleAgentResponse(event: Event): void {
    try {
      const response: NostrAgentResponse = JSON.parse(event.content);
      
      console.log(`📥 Agent response received: ${response.requestId}`);
      this.emit('response-received', response, event);
      
    } catch (error) {
      console.warn('Failed to parse agent response:', error);
    }
  }

  private handleTaskCoordination(event: Event): void {
    try {
      const coordination: NostrTaskCoordination = JSON.parse(event.content);
      
      this.taskCoordinations.set(coordination.taskId, coordination);
      
      console.log(`🎯 Task coordination received: ${coordination.taskId}`);
      this.emit('task-coordination', coordination, event);
      
    } catch (error) {
      console.warn('Failed to parse task coordination:', error);
    }
  }

  async announceAgent(agentProfile?: Partial<NostrAgentProfile>): Promise<string> {
    const profile: NostrAgentProfile = {
      agentId: `agent-${this.publicKey.slice(0, 8)}`,
      name: 'ChaosChain Agent',
      capabilities: ['financial_analysis', 'market_research', 'technical_analysis'],
      specialties: ['crypto', 'stocks', 'defi'],
      reputation: 95,
      cost: '0.001',
      endpoint: 'nostr',
      publicKey: this.publicKey,
      lastSeen: Date.now(),
      ...agentProfile
    };

    const eventTemplate: EventTemplate = {
      kind: NOSTR_ARN_KINDS.AGENT_ANNOUNCEMENT,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['d', profile.agentId], // Parameterized replaceable event identifier
        ['t', 'agent'], // Type tag
        ['t', 'chaoschain'], // Platform tag
        ...profile.capabilities.map(cap => ['c', cap]), // Capability tags
        ...profile.specialties.map(spec => ['s', spec]), // Specialty tags
      ],
      content: JSON.stringify(profile),
    };

    const signedEvent = finalizeEvent(eventTemplate, this.secretKey);
    
    // Publish to all connected relays
    const publishPromises = Array.from(this.relays.values()).map(async (relay) => {
      try {
        await relay.publish(signedEvent);
        console.log(`📡 Agent announced to ${relay.url}`);
      } catch (error) {
        console.warn(`Failed to announce agent to ${relay.url}:`, error);
      }
    });
    
    await Promise.allSettled(publishPromises);
    
    console.log(`🤖 Agent announced: ${profile.name} (${profile.agentId})`);
    this.emit('agent-announced', profile);
    
    return signedEvent.id;
  }

  async discoverAgents(capabilities?: string[], specialties?: string[]): Promise<NostrAgentProfile[]> {
    // First return known agents that match criteria
    const matchingAgents = Array.from(this.knownAgents.values()).filter(agent => {
      const hasCapabilities = !capabilities || capabilities.some(cap => 
        agent.capabilities.includes(cap)
      );
      const hasSpecialties = !specialties || specialties.some(spec => 
        agent.specialties.includes(spec)
      );
      return hasCapabilities && hasSpecialties;
    });

    // Send discovery request to network
    const discoveryRequest = {
      discoveryId: `discovery-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      capabilities: capabilities || [],
      specialties: specialties || [],
      requester: this.publicKey,
      timestamp: Date.now()
    };

    const eventTemplate: EventTemplate = {
      kind: NOSTR_ARN_KINDS.AGENT_DISCOVERY,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['t', 'discovery'],
        ...(capabilities || []).map(cap => ['c', cap]),
        ...(specialties || []).map(spec => ['s', spec]),
      ],
      content: JSON.stringify(discoveryRequest),
    };

    const signedEvent = finalizeEvent(eventTemplate, this.secretKey);
    
    // Publish discovery request
    const publishPromises = Array.from(this.relays.values()).map(async (relay) => {
      try {
        await relay.publish(signedEvent);
      } catch (error) {
        console.warn(`Failed to publish discovery to ${relay.url}:`, error);
      }
    });
    
    await Promise.allSettled(publishPromises);
    
    console.log(`🔍 Discovery request sent for capabilities: [${capabilities?.join(', ')}]`);
    this.emit('discovery-sent', discoveryRequest);
    
    return matchingAgents;
  }

  async requestAgentService(request: Omit<NostrAgentRequest, 'requesterPubkey'>): Promise<string> {
    const fullRequest: NostrAgentRequest = {
      ...request,
      requesterPubkey: this.publicKey,
    };

    this.activeRequests.set(request.requestId, fullRequest);

    const eventTemplate: EventTemplate = {
      kind: NOSTR_ARN_KINDS.AGENT_REQUEST,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['t', 'request'],
        ['r', request.requestId],
        ['task', request.taskType],
        ...(request.targetAgent ? [['p', request.targetAgent]] : []),
        ...(request.maxCost ? [['cost', request.maxCost]] : []),
      ],
      content: JSON.stringify(fullRequest),
    };

    const signedEvent = finalizeEvent(eventTemplate, this.secretKey);
    
    // Publish to all connected relays
    const publishPromises = Array.from(this.relays.values()).map(async (relay) => {
      try {
        await relay.publish(signedEvent);
      } catch (error) {
        console.warn(`Failed to publish request to ${relay.url}:`, error);
      }
    });
    
    await Promise.allSettled(publishPromises);
    
    console.log(`📤 Service request sent: ${request.requestId} (${request.taskType})`);
    this.emit('request-sent', fullRequest);
    
    return signedEvent.id;
  }

  async respondToRequest(requestId: string, response: Omit<NostrAgentResponse, 'timestamp'>): Promise<string> {
    const fullResponse: NostrAgentResponse = {
      ...response,
      timestamp: Date.now(),
    };

    const request = this.activeRequests.get(requestId);
    if (!request) {
      throw new Error(`Request ${requestId} not found`);
    }

    const eventTemplate: EventTemplate = {
      kind: NOSTR_ARN_KINDS.AGENT_RESPONSE,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['t', 'response'],
        ['r', requestId],
        ['p', request.requesterPubkey], // Direct response to requester
      ],
      content: JSON.stringify(fullResponse),
    };

    const signedEvent = finalizeEvent(eventTemplate, this.secretKey);
    
    // Publish to all connected relays
    const publishPromises = Array.from(this.relays.values()).map(async (relay) => {
      try {
        await relay.publish(signedEvent);
      } catch (error) {
        console.warn(`Failed to publish response to ${relay.url}:`, error);
      }
    });
    
    await Promise.allSettled(publishPromises);
    
    console.log(`📥 Service response sent: ${requestId}`);
    this.emit('response-sent', fullResponse);
    
    return signedEvent.id;
  }

  async coordinateTask(taskId: string, agents: string[], taskData: any): Promise<string> {
    const coordination: NostrTaskCoordination = {
      taskId,
      coordinator: this.publicKey,
      agents,
      taskData,
      timestamp: Date.now(),
      status: 'pending'
    };

    this.taskCoordinations.set(taskId, coordination);

    const eventTemplate: EventTemplate = {
      kind: NOSTR_ARN_KINDS.TASK_COORDINATION,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ['t', 'coordination'],
        ['task', taskId],
        ...agents.map(agent => ['p', agent]), // Tag all participating agents
      ],
      content: JSON.stringify(coordination),
    };

    const signedEvent = finalizeEvent(eventTemplate, this.secretKey);
    
    // Publish to all connected relays
    const publishPromises = Array.from(this.relays.values()).map(async (relay) => {
      try {
        await relay.publish(signedEvent);
      } catch (error) {
        console.warn(`Failed to publish coordination to ${relay.url}:`, error);
      }
    });
    
    await Promise.allSettled(publishPromises);
    
    console.log(`🎯 Task coordination sent: ${taskId} with ${agents.length} agents`);
    this.emit('coordination-sent', coordination);
    
    return signedEvent.id;
  }

  // Public getters
  getPublicKey(): string {
    return this.publicKey;
  }

  isNetworkRunning(): boolean {
    return this.isRunning;
  }

  getConnectedRelays(): string[] {
    return Array.from(this.relays.keys());
  }

  getKnownAgents(): NostrAgentProfile[] {
    return Array.from(this.knownAgents.values());
  }

  getActiveRequests(): NostrAgentRequest[] {
    return Array.from(this.activeRequests.values());
  }

  getTaskCoordinations(): NostrTaskCoordination[] {
    return Array.from(this.taskCoordinations.values());
  }

  getRelayStatus(): NostrRelayStatus[] {
    return Array.from(this.relayStatus.values());
  }

  getNetworkStatus() {
    return {
      isRunning: this.isRunning,
      publicKey: this.publicKey,
      connectedRelays: this.relays.size,
      totalRelays: this.relayUrls.length,
      knownAgents: this.knownAgents.size,
      activeRequests: this.activeRequests.size,
      taskCoordinations: this.taskCoordinations.size,
      subscriptions: this.subscriptions.size,
      uptime: this.isRunning ? Date.now() - (this as any).startTime : 0,
      relayStatus: this.getRelayStatus()
    };
  }

  // Event handler registration methods
  onAgentAnnounced(handler: (agent: NostrAgentProfile) => void) {
    this.on('agent-announced', handler);
  }

  onRequestReceived(handler: (request: NostrAgentRequest, event: Event) => void) {
    this.on('request-received', handler);
  }

  onResponseReceived(handler: (response: NostrAgentResponse, event: Event) => void) {
    this.on('response-received', handler);
  }

  onTaskCoordination(handler: (coordination: NostrTaskCoordination, event: Event) => void) {
    this.on('task-coordination', handler);
  }

  onRelayConnected(handler: (url: string) => void) {
    this.on('relay-connected', handler);
  }

  onRelayDisconnected(handler: (url: string) => void) {
    this.on('relay-disconnected', handler);
  }
}

// Create singleton instance
export const nostrAgentRelayNetwork = new NostrAgentRelayNetwork(); 