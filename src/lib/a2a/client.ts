import {
  A2AMessage,
  A2AMessageType,
  AgentIdentity,
  A2AContext,
  A2AAgentStatus
} from '@/types/a2a';

// WebSocket interface for compatibility
interface WebSocketLike {
  send(data: string): void;
  close(): void;
  readyState: number;
  onopen?: () => void;
  onmessage?: (event: { data: string }) => void;
  onclose?: () => void;
  onerror?: (error: any) => void;
}

const WebSocketImpl = (typeof globalThis !== 'undefined' && (globalThis as any).WebSocket 
  ? (globalThis as any).WebSocket 
  : null) as any;

export class A2AClient {
  private ws: WebSocketLike | null = null;
  private messageHandlers = new Map<string, (message: A2AMessage) => void>();
  private responseHandlers = new Map<string, (message: A2AMessage) => void>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private clientId: string;

  constructor(private serverUrl: string) {
    this.clientId = this.generateId();
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        if (!WebSocketImpl) {
          reject(new Error('WebSocket not available'));
          return;
        }
        
        this.ws = new WebSocketImpl(this.serverUrl);
        
        if (this.ws) {
          this.ws.onopen = () => {
            console.log('A2A Client connected');
            this.reconnectAttempts = 0;
            resolve();
          };

          this.ws.onmessage = (event: { data: string }) => {
            this.handleMessage(JSON.parse(event.data));
          };

          this.ws.onclose = () => {
            console.log('A2A Client disconnected');
            this.attemptReconnect();
          };

          this.ws.onerror = (error: any) => {
            console.error('A2A Client error:', error);
            reject(error);
          };
        } else {
          reject(new Error('Failed to create WebSocket'));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        this.connect().catch(console.error);
      }, this.reconnectDelay * this.reconnectAttempts);
    }
  }

  private handleMessage(message: A2AMessage): void {
    if (message.type === A2AMessageType.RESPONSE) {
      const responseHandler = this.responseHandlers.get(message.metadata?.responseToMessageId);
      if (responseHandler) {
        responseHandler(message);
        this.responseHandlers.delete(message.metadata?.responseToMessageId);
      }
    } else {
      const handler = this.messageHandlers.get(message.payload.action);
      if (handler) {
        handler(message);
      }
    }
  }

  async sendMessage(
    targetAgentId: string,
    action: string,
    data?: any,
    context?: A2AContext
  ): Promise<A2AMessage> {
    if (!this.ws || this.ws.readyState !== 1) {
      throw new Error('WebSocket not connected');
    }

    const message: A2AMessage = {
      id: this.generateId(),
      type: A2AMessageType.REQUEST,
      timestamp: new Date(),
      source: {
        id: this.clientId,
        name: 'Frontend Client',
        type: 'client' as any,
        version: '1.0.0',
        capabilities: []
      },
      target: { id: targetAgentId } as AgentIdentity,
      payload: {
        action,
        data,
        context
      }
    };

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.responseHandlers.delete(message.id);
        reject(new Error('Request timeout'));
      }, 30000);

      this.responseHandlers.set(message.id, (response) => {
        clearTimeout(timeout);
        if (response.type === A2AMessageType.ERROR) {
          reject(new Error(response.payload.data?.message || 'Agent error'));
        } else {
          resolve(response);
        }
      });

      this.ws!.send(JSON.stringify(message));
    });
  }

  async discoverAgents(): Promise<AgentIdentity[]> {
    try {
      const response = await this.sendMessage('registry', 'discover_agents', {});
      return response.payload.data?.agents || [];
    } catch (error) {
      console.error('Failed to discover agents:', error);
      return [];
    }
  }

  async getAgentCapabilities(agentId: string): Promise<string[]> {
    try {
      const response = await this.sendMessage(agentId, 'discover_capabilities', {});
      return response.payload.data?.capabilities || [];
    } catch (error) {
      console.error('Failed to get agent capabilities:', error);
      return [];
    }
  }

  onMessage(action: string, handler: (message: A2AMessage) => void): void {
    this.messageHandlers.set(action, handler);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === 1;
  }
} 