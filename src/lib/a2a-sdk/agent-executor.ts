import {
  AgentExecutor,
  RequestContext,
  ExecutionEventBus,
  A2AError
} from '@a2a-js/sdk/dist/server/index.js';
import {
  Message,
  Task,
  TaskState
} from '@a2a-js/sdk/dist/index.js';

/**
 * Base FinStudio Agent Executor
 * Bridges existing agent implementations with the official A2A SDK
 */
export abstract class FinStudioAgentExecutor implements AgentExecutor {
  protected agentId: string;
  protected agentName: string;

  constructor(agentId: string, agentName: string) {
    this.agentId = agentId;
    this.agentName = agentName;
  }

  /**
   * Main execution method called by the A2A SDK
   */
  async execute(requestContext: RequestContext, eventBus: ExecutionEventBus): Promise<void> {
    try {
      console.log(`🚀 ${this.agentName} - Executing task ${requestContext.taskId}`);
      
      // Extract action from user message
      const message = requestContext.userMessage;
      const action = this.extractAction(message);
      const data = this.extractData(message);

      // Create initial task
      const task: Task = {
        id: requestContext.taskId,
        contextId: requestContext.contextId,
        kind: "task" as const,
        status: {
          state: "working" as const,
          timestamp: new Date().toISOString()
        }
      };

      // Publish task started event
      eventBus.publish(task);

      // Execute the specific agent logic
      const result = await this.executeAgentLogic(action, data, requestContext);

      // Create final response message
      const responseMessage: Message = {
        messageId: `msg_${Date.now()}`,
        contextId: requestContext.contextId,
        kind: "message" as const,
        parts: [{ kind: "text", text: JSON.stringify(result) }],
        role: "agent"
      };

      // Create completed task with status update
      const completedTask: Task = {
        ...task,
        id: requestContext.taskId,
        contextId: requestContext.contextId,
        kind: "task" as const,
        status: {
          state: "completed" as const,
          timestamp: new Date().toISOString()
        }
      };

      // Publish final events
      eventBus.publish(responseMessage);
      eventBus.publish(completedTask);
      eventBus.finished();

      console.log(`✅ ${this.agentName} - Task ${requestContext.taskId} completed`);

    } catch (error) {
      console.error(`❌ ${this.agentName} - Task ${requestContext.taskId} failed:`, error);
      
      // Create failed task
      const failedTask: Task = {
        id: requestContext.taskId,
        contextId: requestContext.contextId,
        kind: "task" as const,
        status: {
          state: "failed" as const,
          timestamp: new Date().toISOString()
        }
      };

      eventBus.publish(failedTask);
      eventBus.finished();

      throw A2AError.internalError(
        `Agent execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        { agentId: this.agentId, taskId: requestContext.taskId }
      );
    }
  }

  /**
   * Cancel a running task
   */
  async cancelTask(taskId: string, eventBus: ExecutionEventBus): Promise<void> {
    console.log(`🛑 ${this.agentName} - Cancelling task ${taskId}`);
    
    const cancelledTask: Task = {
      id: taskId,
      contextId: `ctx_${taskId}`,
      kind: "task" as const,
      status: {
        state: "canceled" as const,
        timestamp: new Date().toISOString()
      }
    };

    eventBus.publish(cancelledTask);
    eventBus.finished();
  }

  /**
   * Extract action from message content
   */
  private extractAction(message: Message): string {
    // Try to extract action from message parts
    const part = message.parts?.[0];
    if (part?.kind === 'text') {
      try {
        const parsed = JSON.parse(part.text);
        return parsed.action || 'default_action';
      } catch {
        // If not JSON, use the text as action
        return part.text || 'default_action';
      }
    }
    return 'default_action';
  }

  /**
   * Extract data from message content
   */
  private extractData(message: Message): any {
    const part = message.parts?.[0];
    if (part?.kind === 'text') {
      try {
        const parsed = JSON.parse(part.text);
        return parsed.data || parsed;
      } catch {
        return { query: part.text };
      }
    }
    return {};
  }

  /**
   * Abstract method to be implemented by specific agents
   */
  protected abstract executeAgentLogic(
    action: string, 
    data: any, 
    requestContext: RequestContext
  ): Promise<any>;
} 