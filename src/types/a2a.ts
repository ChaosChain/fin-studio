/**
 * A2A Protocol Types
 * Based on Google Cloud's Agent2Agent protocol specification
 */

export interface A2AMessage {
  id: string;
  type: A2AMessageType;
  timestamp: Date;
  source: AgentIdentity;
  target: AgentIdentity;
  payload: A2APayload;
  metadata?: Record<string, any>;
}

export enum A2AMessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  NOTIFICATION = 'notification',
  ERROR = 'error',
  HEARTBEAT = 'heartbeat'
}

export interface AgentIdentity {
  id: string;
  name: string;
  type: AgentType;
  version: string;
  capabilities: string[];
  endpoint?: string;
}

export enum AgentType {
  MARKET_RESEARCH = 'market_research',
  MACRO_RESEARCH = 'macro_research',
  PRICE_ANALYSIS = 'price_analysis',
  INSIGHTS_REPORTER = 'insights_reporter',
  ORCHESTRATOR = 'orchestrator'
}

export interface A2APayload {
  action: string;
  data?: any;
  context?: A2AContext;
  requirements?: A2ARequirements;
}

export interface A2AContext {
  conversationId?: string;
  userId?: string;
  sessionId?: string;
  previousMessages?: string[];
  metadata?: Record<string, any>;
}

export interface A2ARequirements {
  timeout?: number;
  priority?: A2APriority;
  responseFormat?: string;
  deliveryMode?: A2ADeliveryMode;
}

export enum A2APriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum A2ADeliveryMode {
  SYNC = 'sync',
  ASYNC = 'async',
  BATCH = 'batch'
}

export interface A2ARegistryEntry {
  agent: AgentIdentity;
  status: A2AAgentStatus;
  lastSeen: Date;
  metrics: A2AMetrics;
}

export enum A2AAgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BUSY = 'busy',
  ERROR = 'error'
}

export interface A2AMetrics {
  messagesProcessed: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
}

export interface A2AError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface A2AHandlerFunction {
  (message: A2AMessage): Promise<A2AMessage | void>;
}

export interface A2AAgentConfig {
  identity: AgentIdentity;
  handlers: Map<string, A2AHandlerFunction>;
  middleware?: A2AMiddleware[];
  registry?: A2ARegistry;
}

export interface A2AMiddleware {
  (message: A2AMessage, next: () => Promise<void>): Promise<void>;
}

export interface A2ARegistry {
  register(agent: AgentIdentity): Promise<void>;
  unregister(agentId: string): Promise<void>;
  discover(criteria?: Partial<AgentIdentity>): Promise<AgentIdentity[]>;
  getAgent(agentId: string): Promise<AgentIdentity | null>;
  updateStatus(agentId: string, status: A2AAgentStatus): Promise<void>;
} 