import { AgentIdentity } from '@/types/a2a';

export class A2AHttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  async connect(): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      if (!response.ok) {
        throw new Error(`Gateway not available: ${response.status}`);
      }
      const data = await response.json();
      console.log('🔌 Connected to A2A Gateway:', data);
    } catch (error) {
      console.error('❌ Failed to connect to A2A Gateway:', error);
      throw error;
    }
  }

  async discoverAgents(): Promise<AgentIdentity[]> {
    try {
      const response = await fetch(`${this.baseUrl}/agents`);
      if (!response.ok) {
        throw new Error(`Failed to discover agents: ${response.status}`);
      }
      const data = await response.json() as { agents: AgentIdentity[] };
      console.log('🔍 Discovered agents:', data.agents);
      return data.agents;
    } catch (error) {
      console.error('❌ Failed to discover agents:', error);
      throw error;
    }
  }

  async sendMessage(
    targetAgentId: string,
    action: string,
    data?: any
  ): Promise<any> {
    try {
      console.log(`📤 Sending message to ${targetAgentId}:`, { action, data });
      
      const response = await fetch(`${this.baseUrl}/message/${targetAgentId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action,
          data
        })
      });

      if (!response.ok) {
        throw new Error(`Agent request failed: ${response.status}`);
      }

      const result = await response.json();
      console.log(`📥 Response from ${targetAgentId}:`, result);
      return result;
    } catch (error) {
      console.error(`❌ Failed to send message to ${targetAgentId}:`, error);
      throw error;
    }
  }

  disconnect(): void {
    console.log('🔌 Disconnected from A2A Gateway');
  }

  isConnected(): boolean {
    return true; // HTTP is stateless, so we're always "connected"
  }
} 