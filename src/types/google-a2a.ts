/**
 * Google A2A SDK Type Definitions
 * Based on Google's official A2A SDK
 */

export interface GoogleA2AAgentIdentity {
  id: string;
  name: string;
  type: GoogleA2AAgentType;
  version: string;
  capabilities: string[];
  endpoint?: string;
}

export enum GoogleA2AAgentType {
  MARKET_RESEARCH = 'market_research',
  MACRO_RESEARCH = 'macro_research',
  PRICE_ANALYSIS = 'price_analysis',
  INSIGHTS_REPORTER = 'insights_reporter',
  ORCHESTRATOR = 'orchestrator',
  VERIFIER = 'verifier'
}

export interface GoogleA2AMessage {
  id: string;
  type: GoogleA2AMessageType;
  timestamp: Date;
  source: GoogleA2AAgentIdentity;
  target: GoogleA2AAgentIdentity;
  payload: GoogleA2APayload;
  metadata?: Record<string, any>;
}

export enum GoogleA2AMessageType {
  REQUEST = 'request',
  RESPONSE = 'response',
  NOTIFICATION = 'notification',
  ERROR = 'error',
  HEARTBEAT = 'heartbeat'
}

export interface GoogleA2APayload {
  action: string;
  data?: any;
  context?: GoogleA2AContext;
  requirements?: GoogleA2ARequirements;
}

export interface GoogleA2AContext {
  conversationId?: string;
  userId?: string;
  sessionId?: string;
  previousMessages?: string[];
  metadata?: Record<string, any>;
}

export interface GoogleA2ARequirements {
  timeout?: number;
  priority?: GoogleA2APriority;
  responseFormat?: string;
  deliveryMode?: GoogleA2ADeliveryMode;
}

export enum GoogleA2APriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent'
}

export enum GoogleA2ADeliveryMode {
  SYNC = 'sync',
  ASYNC = 'async',
  BATCH = 'batch'
}

export interface GoogleA2ARegistryEntry {
  agent: GoogleA2AAgentIdentity;
  status: GoogleA2AAgentStatus;
  lastSeen: Date;
  metrics: GoogleA2AMetrics;
}

export enum GoogleA2AAgentStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  BUSY = 'busy',
  ERROR = 'error'
}

export interface GoogleA2AMetrics {
  messagesProcessed: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number;
}

export interface GoogleA2AError {
  code: string;
  message: string;
  details?: any;
  timestamp: Date;
}

export interface GoogleA2AHandlerFunction {
  (message: GoogleA2AMessage): Promise<GoogleA2AMessage | void>;
}

export interface GoogleA2AAgentConfig {
  identity: GoogleA2AAgentIdentity;
  handlers: Map<string, GoogleA2AHandlerFunction>;
  middleware?: GoogleA2AMiddleware[];
  registry?: GoogleA2ARegistry;
}

export interface GoogleA2AMiddleware {
  (message: GoogleA2AMessage, next: () => Promise<void>): Promise<void>;
}

export interface GoogleA2ARegistry {
  register(agent: GoogleA2AAgentIdentity): Promise<void>;
  unregister(agentId: string): Promise<void>;
  discover(criteria?: Partial<GoogleA2AAgentIdentity>): Promise<GoogleA2AAgentIdentity[]>;
  getAgent(agentId: string): Promise<GoogleA2AAgentIdentity | null>;
  updateStatus(agentId: string, status: GoogleA2AAgentStatus): Promise<void>;
} 