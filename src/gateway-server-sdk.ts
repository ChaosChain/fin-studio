import express from 'express';

// Use require for A2A SDK to handle module resolution issues
const {
  A2AExpressApp,
  DefaultRequestHandler,
  InMemoryTaskStore
} = require('@a2a-js/sdk/server');

const {
  AgentCard,
  AgentCapabilities,
  Message,
  Task
} = require('@a2a-js/sdk');

// Types (import-only)
import type {
  AgentExecutor,
  RequestContext,
  ExecutionEventBus,
  A2AError
} from '@a2a-js/sdk/server';

/**
 * Simple FinStudio Agent Executor for demonstration
 * This routes requests to the appropriate specialized agents
 */
class FinStudioAgentExecutor implements AgentExecutor {
  async execute(requestContext: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    try {
      console.log(`🚀 FinStudio Agent - Executing task ${requestContext.taskId}`);
      
      // Extract the message content to determine which agent to route to
      const userMessage = requestContext.userMessage;
      console.log('Received message:', userMessage);

      // Create a simple task response
      const task: Partial<Task> = {
        id: requestContext.taskId,
        contextId: requestContext.contextId,
        kind: "task" as const
      };

      // Publish the task
      eventBus.publish(task as Task);
      
      // Create a response message
      const responseMessage: Partial<Message> = {
        messageId: `msg_${Date.now()}`,
        contextId: requestContext.contextId,
        kind: "message" as const
      };

      // Publish the response
      eventBus.publish(responseMessage as Message);
      
      // Mark as finished
      eventBus.finished();

      console.log(`✅ FinStudio Agent - Task ${requestContext.taskId} completed`);

    } catch (error) {
      console.error(`❌ FinStudio Agent - Task failed:`, error);
      
      const failedTask: Partial<Task> = {
        id: requestContext.taskId,
        contextId: requestContext.contextId,
        kind: "task" as const
      };

      eventBus.publish(failedTask as Task);
      eventBus.finished();

      throw A2AError.internalError(
        `Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async cancelTask(taskId: string, eventBus: ExecutionEventBus): Promise<void> {
    console.log(`🛑 FinStudio Agent - Cancelling task ${taskId}`);
    
    const cancelledTask: Partial<Task> = {
      id: taskId,
      contextId: `ctx_${taskId}`,
      kind: "task" as const
    };

    eventBus.publish(cancelledTask as Task);
    eventBus.finished();
  }
}

/**
 * Create the agent card describing FinStudio capabilities
 */
function createAgentCard(): AgentCard {
  const capabilities: AgentCapabilities = {
    extensions: [],
    pushNotifications: false,
    stateTransitionHistory: false,
    streaming: false
  };

  return {
    name: 'FinStudio Multi-Agent System',
    description: 'Comprehensive financial analysis platform with specialized AI agents for market research, technical analysis, macro analysis, and insights generation.',
    version: '1.0.0',
    capabilities,
    url: 'http://localhost:8080/a2a/api',
    defaultInputModes: ['text/plain'],
    defaultOutputModes: ['text/plain', 'application/json'],
    skills: [{
      id: 'financial-analysis',
      name: 'financial-analysis',
      description: 'Comprehensive financial analysis and research',
      inputModes: ['text/plain'],
      outputModes: ['text/plain', 'application/json'],
      tags: ['finance', 'analysis', 'research']
    }]
  };
}

/**
 * Start the A2A SDK-based gateway server
 */
async function startGatewayServer() {
  console.log('🚀 Starting FinStudio A2A Gateway with Official SDK...');
  
  try {
    // Create the task store
    const taskStore = new InMemoryTaskStore();
    
    // Create the agent executor
    const agentExecutor = new FinStudioAgentExecutor();
    
    // Create the agent card
    const agentCard = createAgentCard();
    
    // Create the request handler
    const requestHandler = new DefaultRequestHandler(
      agentCard,
      taskStore,
      agentExecutor
    );
    
    // Create the A2A Express app
    const a2aApp = new A2AExpressApp(requestHandler);
    
    // Create Express app
    const app = express();
    
    // Add CORS middleware
    app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
    
    // Setup A2A routes (with type assertion to handle Express version compatibility)
    a2aApp.setupRoutes(app as any, '/a2a/api');
    
    // Add health check endpoint
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'healthy',
        service: 'FinStudio A2A Gateway (Official SDK)',
        version: '1.0.0',
        endpoints: {
          agentCard: '/a2a/api/agent',
          sendMessage: '/a2a/api/message/send',
          streamMessage: '/a2a/api/message/stream',
          getTask: '/a2a/api/tasks/get',
          cancelTask: '/a2a/api/tasks/cancel'
        }
      });
    });
    
    // Start the server
    const PORT = 8080;
    app.listen(PORT, () => {
      console.log(`✅ FinStudio A2A Gateway running on port ${PORT}`);
      console.log(`📊 Agent Card: http://localhost:${PORT}/a2a/api/agent`);
      console.log(`💬 Send Message: http://localhost:${PORT}/a2a/api/message/send`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
      console.log('');
      console.log('🔗 Frontend can now connect to this A2A SDK-based gateway');
    });
    
  } catch (error) {
    console.error('❌ Failed to start A2A Gateway:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down A2A Gateway...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down A2A Gateway...');
  process.exit(0);
});

// Start the server
startGatewayServer(); 