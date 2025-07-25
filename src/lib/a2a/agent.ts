import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import express from 'express';
import cors from 'cors';

// Handle WebSocket imports for Next.js environment
let WebSocket: any;
try {
  if (typeof window === 'undefined') {
    // Server-side: try to import ws
    WebSocket = require('ws');
  }
} catch (error) {
  console.warn('WebSocket server not available in this environment');
}
import {
  A2AMessage,
  A2AMessageType,
  AgentIdentity,
  A2AAgentConfig,
  A2AHandlerFunction,
  A2AError,
  A2AAgentStatus,
  A2APayload,
  A2AContext,
  A2AMiddleware
} from '@/types/a2a';

export class A2AAgent extends EventEmitter {
  private identity: AgentIdentity;
  private handlers: Map<string, A2AHandlerFunction>;
  private middleware: A2AMiddleware[];
  private server?: WebSocket.Server;
  private httpServer?: any;
  private clients: Map<string, WebSocket>;
  private status: A2AAgentStatus;
  private heartbeatInterval?: NodeJS.Timeout;

  constructor(config: A2AAgentConfig) {
    super();
    this.identity = config.identity;
    this.handlers = config.handlers;
    this.middleware = config.middleware || [];
    this.clients = new Map();
    this.status = A2AAgentStatus.INACTIVE;
    
    this.setupDefaultHandlers();
  }

  private setupDefaultHandlers(): void {
    // Default heartbeat handler
    this.handlers.set('heartbeat', async (message: A2AMessage) => {
      return this.createResponse(message, 'heartbeat_response', {
        status: this.status,
        timestamp: new Date(),
        agentInfo: this.identity
      });
    });

    // Default capability discovery handler
    this.handlers.set('discover_capabilities', async (message: A2AMessage) => {
      return this.createResponse(message, 'capabilities_response', {
        capabilities: this.identity.capabilities,
        identity: this.identity,
        status: this.status
      });
    });
  }

  async start(port: number = 8080): Promise<void> {
    try {
      // For demo purposes, skip WebSocket server and use HTTP only
      this.status = A2AAgentStatus.ACTIVE;

      // Set up HTTP server on the same port
      const app = express();
      app.use(cors());
      app.use(express.json());

      // HTTP endpoint for agent communication
      app.post('/message', async (req, res) => {
        try {
          const { action, data } = req.body;
          
          // Create A2A message from HTTP request
          const message: A2AMessage = {
            id: uuidv4(),
            type: A2AMessageType.REQUEST,
            timestamp: new Date(),
            source: { id: 'gateway', name: 'Gateway' } as AgentIdentity,
            target: this.identity,
            payload: {
              action,
              data,
              context: {}
            }
          };

          console.log(`📥 ${this.identity.name} - HTTP request received:`, { action, data });
          
          // Process the message
          const response = await this.processMessage(message, 'http-client');
          
          if (response) {
            console.log(`📤 ${this.identity.name} - HTTP response:`, response.payload.data);
            res.json(response.payload.data);
          } else {
            res.json({ success: true, message: 'Request processed' });
          }
        } catch (error) {
          console.error(`❌ ${this.identity.name} - HTTP error:`, error);
          res.status(500).json({ 
            success: false, 
            error: error instanceof Error ? error.message : 'Unknown error' 
          });
        }
      });

      // Health check endpoint
      app.get('/health', (req, res) => {
        res.json({ 
          status: 'healthy', 
          agent: this.identity.name,
          capabilities: this.identity.capabilities 
        });
      });

      // Start HTTP server
      this.httpServer = app.listen(port + 1000, () => {
        console.log(`🌐 ${this.identity.name} - HTTP server on port ${port + 1000}`);
      });

      this.server.on('connection', (ws: WebSocket, req) => {
        const clientId = uuidv4();
        this.clients.set(clientId, ws);

        ws.on('message', async (data: WebSocket.Data) => {
          try {
            const message: A2AMessage = JSON.parse(data.toString());
            await this.handleMessage(message, clientId);
          } catch (error) {
            this.handleError(error as Error, clientId);
          }
        });

        ws.on('close', () => {
          this.clients.delete(clientId);
        });

        ws.on('error', (error) => {
          this.handleError(error, clientId);
        });
      });

      this.startHeartbeat();
      this.emit('started', { port, identity: this.identity });
      
      console.log(`A2A Agent ${this.identity.name} started on port ${port}`);
    } catch (error) {
      this.status = A2AAgentStatus.ERROR;
      throw error;
    }
  }

  async stop(): Promise<void> {
    this.status = A2AAgentStatus.INACTIVE;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }

    if (this.server) {
      this.server.close();
    }

    if (this.httpServer) {
      this.httpServer.close();
    }

    this.clients.forEach(client => {
      client.terminate();
    });
    this.clients.clear();

    this.emit('stopped');
  }

  private async handleMessage(message: A2AMessage, clientId: string): Promise<void> {
    try {
      // Apply middleware
      let middlewareIndex = 0;
      const runMiddleware = async (): Promise<void> => {
        if (middlewareIndex < this.middleware.length) {
          const middleware = this.middleware[middlewareIndex++];
          await middleware(message, runMiddleware);
        } else {
          await this.processMessage(message, clientId);
        }
      };

      await runMiddleware();
    } catch (error) {
      this.handleError(error as Error, clientId, message);
    }
  }

  private async processMessage(message: A2AMessage, clientId: string): Promise<A2AMessage | null> {
    const handler = this.handlers.get(message.payload.action);
    
    if (!handler) {
      const errorResponse = this.createErrorResponse(
        message,
        'UNKNOWN_ACTION',
        `No handler found for action: ${message.payload.action}`
      );
      if (clientId !== 'http-client') {
      await this.sendMessage(errorResponse, clientId);
      }
      return errorResponse;
    }

    const response = await handler(message);
    if (response && clientId !== 'http-client') {
      await this.sendMessage(response, clientId);
    }

    this.emit('message_processed', { message, clientId });
    return response || null;
  }

  private async sendMessage(message: A2AMessage, clientId: string): Promise<void> {
    const client = this.clients.get(clientId);
    if (client && client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(message));
    }
  }

  async sendToAgent(targetAgentId: string, action: string, data?: any, context?: A2AContext): Promise<void> {
    const message: A2AMessage = {
      id: uuidv4(),
      type: A2AMessageType.REQUEST,
      timestamp: new Date(),
      source: this.identity,
      target: { id: targetAgentId } as AgentIdentity,
      payload: {
        action,
        data,
        context
      }
    };

    // For now, emit the message. In a production system, this would use
    // the A2A registry to find the target agent and establish connection
    this.emit('outgoing_message', message);
  }

  private createResponse(originalMessage: A2AMessage, action: string, data?: any): A2AMessage {
    return {
      id: uuidv4(),
      type: A2AMessageType.RESPONSE,
      timestamp: new Date(),
      source: this.identity,
      target: originalMessage.source,
      payload: {
        action,
        data,
        context: originalMessage.payload.context
      },
      metadata: {
        responseToMessageId: originalMessage.id
      }
    };
  }

  private createErrorResponse(originalMessage: A2AMessage, code: string, message: string): A2AMessage {
    return {
      id: uuidv4(),
      type: A2AMessageType.ERROR,
      timestamp: new Date(),
      source: this.identity,
      target: originalMessage.source,
      payload: {
        action: 'error',
        data: {
          code,
          message,
          originalAction: originalMessage.payload.action,
          timestamp: new Date()
        } as A2AError,
        context: originalMessage.payload.context
      },
      metadata: {
        responseToMessageId: originalMessage.id
      }
    };
  }

  private handleError(error: Error, clientId?: string, originalMessage?: A2AMessage): void {
    console.error('A2A Agent Error:', error);
    
    if (clientId && originalMessage) {
      const errorResponse = this.createErrorResponse(
        originalMessage,
        'PROCESSING_ERROR',
        error.message
      );
      this.sendMessage(errorResponse, clientId);
    }

    this.emit('error', { error, clientId, originalMessage });
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.clients.forEach((client, clientId) => {
        if (client.readyState === WebSocket.OPEN) {
          const heartbeat: A2AMessage = {
            id: uuidv4(),
            type: A2AMessageType.HEARTBEAT,
            timestamp: new Date(),
            source: this.identity,
            target: { id: 'broadcast' } as AgentIdentity,
            payload: {
              action: 'heartbeat',
              data: {
                status: this.status,
                timestamp: new Date()
              }
            }
          };
          client.send(JSON.stringify(heartbeat));
        }
      });
    }, 30000); // Send heartbeat every 30 seconds
  }

  addHandler(action: string, handler: A2AHandlerFunction): void {
    this.handlers.set(action, handler);
  }

  removeHandler(action: string): void {
    this.handlers.delete(action);
  }

  addMiddleware(middleware: A2AMiddleware): void {
    this.middleware.push(middleware);
  }

  getStatus(): A2AAgentStatus {
    return this.status;
  }

  getIdentity(): AgentIdentity {
    return { ...this.identity };
  }

  getConnectedClients(): number {
    return this.clients.size;
  }
} 