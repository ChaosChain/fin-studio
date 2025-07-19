import crypto from 'crypto';

export interface DKGNode {
  id: string;
  agentId: string;
  timestamp: string;
  resultData: any;
  dataSources: string[];
  reasoning?: string;
  parentNodes?: string[];
  signature: string;
  taskId?: string;
  componentType?: string; // e.g., 'sentiment', 'technical', 'macro'
}

export interface DKGQuery {
  agentId?: string;
  taskId?: string;
  componentType?: string;
  timeRange?: {
    start: Date;
    end: Date;
  };
}

// Global storage to persist across requests in development
declare global {
  var __DKG_NODES__: Map<string, DKGNode> | undefined;
  var __DKG_NODES_BY_AGENT__: Map<string, string[]> | undefined;
  var __DKG_NODES_BY_TASK__: Map<string, string[]> | undefined;
}

export class DKGManager {
  private nodes: Map<string, DKGNode>;
  private nodesByAgent: Map<string, string[]>;
  private nodesByTask: Map<string, string[]>;
  private currentTaskId: string | null;

  constructor() {
    // Use global storage in development to persist across requests
    if (process.env.NODE_ENV === 'development') {
      this.nodes = global.__DKG_NODES__ || new Map();
      this.nodesByAgent = global.__DKG_NODES_BY_AGENT__ || new Map();
      this.nodesByTask = global.__DKG_NODES_BY_TASK__ || new Map();
      
      global.__DKG_NODES__ = this.nodes;
      global.__DKG_NODES_BY_AGENT__ = this.nodesByAgent;
      global.__DKG_NODES_BY_TASK__ = this.nodesByTask;
    } else {
      this.nodes = new Map();
      this.nodesByAgent = new Map();
      this.nodesByTask = new Map();
    }
    
    this.currentTaskId = null;
  }

  /**
   * Add a new node to the DKG
   */
  addNode(node: DKGNode): void {
    // Store the node
    this.nodes.set(node.id, node);

    // Index by agent
    if (!this.nodesByAgent.has(node.agentId)) {
      this.nodesByAgent.set(node.agentId, []);
    }
    this.nodesByAgent.get(node.agentId)!.push(node.id);

    // Index by task
    if (node.taskId) {
      if (!this.nodesByTask.has(node.taskId)) {
        this.nodesByTask.set(node.taskId, []);
      }
      this.nodesByTask.get(node.taskId)!.push(node.id);
    }

    console.log(`DKG: Added node ${node.id} from agent ${node.agentId}`);
  }

  /**
   * Get a node by ID
   */
  getNode(nodeId: string): DKGNode | undefined {
    return this.nodes.get(nodeId);
  }

  /**
   * Query nodes based on criteria
   */
  queryNodes(query: DKGQuery): DKGNode[] {
    let nodeIds: string[] = [];

    if (query.agentId) {
      nodeIds = this.nodesByAgent.get(query.agentId) || [];
    } else if (query.taskId) {
      nodeIds = this.nodesByTask.get(query.taskId) || [];
    } else {
      nodeIds = Array.from(this.nodes.keys());
    }

    let results = nodeIds.map(id => this.nodes.get(id)!).filter(Boolean);

    // Filter by component type
    if (query.componentType) {
      results = results.filter(node => node.componentType === query.componentType);
    }

    // Filter by time range
    if (query.timeRange) {
      results = results.filter(node => {
        const nodeTime = new Date(node.timestamp);
        return nodeTime >= query.timeRange!.start && nodeTime <= query.timeRange!.end;
      });
    }

    return results;
  }

  /**
   * Get all nodes for a specific task
   */
  getTaskNodes(taskId: string): DKGNode[] {
    return this.queryNodes({ taskId });
  }

  /**
   * Get all nodes from a specific agent
   */
  getAgentNodes(agentId: string): DKGNode[] {
    return this.queryNodes({ agentId });
  }

  /**
   * Get all nodes in the DKG
   */
  getAllNodes(): DKGNode[] {
    console.log(`DKG: Getting all nodes, count: ${this.nodes.size}`);
    return Array.from(this.nodes.values());
  }

  /**
   * Set the current task ID and clear nodes from previous tasks
   */
  setCurrentTask(taskId: string): void {
    console.log(`DKG: Setting current task to ${taskId}`);
    
    // If this is a new task, clear previous task nodes
    if (this.currentTaskId && this.currentTaskId !== taskId) {
      console.log(`DKG: Clearing previous task nodes (${this.currentTaskId})`);
      this.clearTaskNodes(this.currentTaskId);
    }
    
    this.currentTaskId = taskId;
  }

  /**
   * Clear nodes for a specific task
   */
  clearTaskNodes(taskId: string): void {
    const taskNodes = this.nodesByTask.get(taskId);
    if (taskNodes) {
      let removedCount = 0;
      for (const nodeId of taskNodes) {
        const node = this.nodes.get(nodeId);
        if (node) {
          this.nodes.delete(nodeId);
          
          // Remove from agent index
          const agentNodes = this.nodesByAgent.get(node.agentId);
          if (agentNodes) {
            const index = agentNodes.indexOf(nodeId);
            if (index > -1) {
              agentNodes.splice(index, 1);
            }
          }
          
          removedCount++;
        }
      }
      
      // Clear the task index
      this.nodesByTask.delete(taskId);
      
      console.log(`DKG: Removed ${removedCount} nodes from task ${taskId}`);
    }
  }

  /**
   * Get current task ID
   */
  getCurrentTaskId(): string | null {
    return this.currentTaskId;
  }

  /**
   * Get nodes by task ID
   */
  getNodesByTask(taskId: string): DKGNode[] {
    const nodeIds = this.nodesByTask.get(taskId);
    if (!nodeIds) {
      return [];
    }
    
    const nodes: DKGNode[] = [];
    for (const nodeId of nodeIds) {
      const node = this.nodes.get(nodeId);
      if (node) {
        nodes.push(node);
      }
    }
    
    return nodes;
  }

  /**
   * Clear old nodes (older than 1 hour) to prevent memory buildup
   */
  clearOldNodes(): void {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    let removedCount = 0;
    
    for (const [nodeId, node] of this.nodes.entries()) {
      if (new Date(node.timestamp) < oneHourAgo) {
        this.nodes.delete(nodeId);
        
        // Remove from agent index
        const agentNodes = this.nodesByAgent.get(node.agentId);
        if (agentNodes) {
          const index = agentNodes.indexOf(nodeId);
          if (index > -1) {
            agentNodes.splice(index, 1);
          }
        }
        
        // Remove from task index
        if (node.taskId) {
          const taskNodes = this.nodesByTask.get(node.taskId);
          if (taskNodes) {
            const index = taskNodes.indexOf(nodeId);
            if (index > -1) {
              taskNodes.splice(index, 1);
            }
          }
        }
        
        removedCount++;
      }
    }
    
    if (removedCount > 0) {
      console.log(`DKG: Cleaned up ${removedCount} old nodes`);
    }
  }

  /**
   * Verify the signature of a node
   */
  verifyNodeSignature(node: DKGNode, agentPrivateKey?: string): boolean {
    // For demo purposes, we'll simulate signature verification
    const expectedSignature = this.generateSignature(node, agentPrivateKey || node.agentId);
    return node.signature === expectedSignature;
  }

  /**
   * Generate a signature for a node (simulated for demo)
   */
  generateSignature(node: Omit<DKGNode, 'signature'>, agentPrivateKey: string): string {
    const dataToSign = JSON.stringify({
      agentId: node.agentId,
      timestamp: node.timestamp,
      resultData: node.resultData,
      dataSources: node.dataSources
    });
    
    return crypto.createHash('sha256')
      .update(dataToSign + agentPrivateKey)
      .digest('hex');
  }

  /**
   * Create a new DKG node with signature
   */
  createSignedNode(
    agentId: string,
    resultData: any,
    dataSources: string[],
    reasoning?: string,
    parentNodes?: string[],
    taskId?: string,
    componentType?: string,
    agentPrivateKey?: string
  ): DKGNode {
    const nodeId = this.generateNodeId();
    const timestamp = new Date().toISOString();

    const nodeData: Omit<DKGNode, 'signature'> = {
      id: nodeId,
      agentId,
      timestamp,
      resultData,
      dataSources,
      reasoning,
      parentNodes,
      taskId,
      componentType
    };

    const signature = this.generateSignature(nodeData, agentPrivateKey || agentId);

    return {
      ...nodeData,
      signature
    };
  }

  /**
   * Generate a unique node ID
   */
  private generateNodeId(): string {
    return 'dkg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Get causal chain for a node (traverse parent nodes)
   */
  getCausalChain(nodeId: string): DKGNode[] {
    const chain: DKGNode[] = [];
    const visited = new Set<string>();
    
    const traverse = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      
      const node = this.getNode(id);
      if (!node) return;
      
      chain.push(node);
      
      // Traverse parent nodes
      if (node.parentNodes) {
        node.parentNodes.forEach(parentId => traverse(parentId));
      }
    };
    
    traverse(nodeId);
    return chain;
  }

  /**
   * Get statistics about the DKG (current task, or most recent task if no current task)
   */
  getStats(): {
    totalNodes: number;
    nodesByAgent: Record<string, number>;
    nodesByTask: Record<string, number>;
  } {
    // If there's a current task, return stats for current task
    if (this.currentTaskId) {
      const currentTaskNodes = this.getNodesByTask(this.currentTaskId);
      const nodesByAgent: Record<string, number> = {};
      const nodesByTask: Record<string, number> = {};

      // Count nodes by agent for current task
      for (const node of currentTaskNodes) {
        nodesByAgent[node.agentId] = (nodesByAgent[node.agentId] || 0) + 1;
      }

      // Set current task count
      nodesByTask[this.currentTaskId] = currentTaskNodes.length;

      return {
        totalNodes: currentTaskNodes.length,
        nodesByAgent,
        nodesByTask
      };
    }

    // If no current task, find the most recent task and show its stats
    if (this.nodesByTask.size > 0) {
      // Get the most recent task (tasks are chronologically ordered by ID)
      const taskIds = Array.from(this.nodesByTask.keys()).sort();
      const mostRecentTaskId = taskIds[taskIds.length - 1];
      const recentTaskNodes = this.getNodesByTask(mostRecentTaskId);
      
      const nodesByAgent: Record<string, number> = {};
      const nodesByTask: Record<string, number> = {};

      // Count nodes by agent for most recent task
      for (const node of recentTaskNodes) {
        nodesByAgent[node.agentId] = (nodesByAgent[node.agentId] || 0) + 1;
      }

      // Set recent task count
      nodesByTask[mostRecentTaskId] = recentTaskNodes.length;

      return {
        totalNodes: recentTaskNodes.length,
        nodesByAgent,
        nodesByTask
      };
    }

    // Return empty stats if no tasks exist at all
    return {
      totalNodes: 0,
      nodesByAgent: {},
      nodesByTask: {}
    };
  }

  /**
   * Get all-time statistics about the DKG (including historical nodes)
   */
  getAllTimeStats(): {
    totalNodes: number;
    nodesByAgent: Record<string, number>;
    nodesByTask: Record<string, number>;
  } {
    const nodesByAgent: Record<string, number> = {};
    const nodesByTask: Record<string, number> = {};

    for (const [agentId, nodeIds] of this.nodesByAgent) {
      nodesByAgent[agentId] = nodeIds.length;
    }

    for (const [taskId, nodeIds] of this.nodesByTask) {
      nodesByTask[taskId] = nodeIds.length;
    }

    return {
      totalNodes: this.nodes.size,
      nodesByAgent,
      nodesByTask
    };
  }
}

// Global DKG instance
export const dkgManager = new DKGManager(); 