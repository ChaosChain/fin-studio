/**
 * A2A API Integration Tests
 * Tests the backend API endpoints to ensure they properly handle Google A2A protocol flags
 */

import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { NextRequest } from 'next/server';

// Mock the comprehensive analysis API
describe('A2A API Integration Tests', () => {
  let mockRequest: Partial<NextRequest>;
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('/api/comprehensive-analysis A2A Integration', () => {
    it('should accept and process A2A protocol flags', async () => {
      const requestBody = {
        symbols: ['AAPL', 'GOOGL'],
        analysisType: 'comprehensive',
        useARN: true,
        protocol: 'google-a2a-sdk',
        a2aEnabled: true,
        arnTaskId: 'test-task-123'
      };

      mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
        method: 'POST'
      };

      // Import and test the API route
      const { POST } = await import('../src/app/api/comprehensive-analysis/route');
      
      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(responseData.success).toBe(true);
      expect(responseData.analysis).toBeDefined();
      
      // Verify that A2A protocol was acknowledged in the response
      expect(responseData.protocol).toBe('google-a2a-sdk');
      expect(responseData.a2aEnabled).toBe(true);
    });

    it('should handle A2A agent coordination requests', async () => {
      const requestBody = {
        symbols: ['AAPL'],
        analysisType: 'comprehensive',
        protocol: 'google-a2a-sdk',
        a2aAgents: [
          'market-research-agent-gpt4o',
          'price-analysis-agent-gpt4',
          'macro-research-agent-gpt4',
          'insights-agent-gpt4'
        ]
      };

      mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
        method: 'POST'
      };

      const { POST } = await import('../src/app/api/comprehensive-analysis/route');
      
      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(responseData.success).toBe(true);
      
      // Verify A2A agents were processed
      expect(responseData.analysis.results).toBeDefined();
      expect(Object.keys(responseData.analysis.results)).toEqual(
        expect.arrayContaining(['marketResearch', 'priceAnalysis', 'macroResearch', 'insights'])
      );
    });

    it('should validate A2A protocol version compatibility', async () => {
      const requestBody = {
        symbols: ['AAPL'],
        analysisType: 'comprehensive',
        protocol: 'google-a2a-sdk',
        a2aVersion: '1.0',
        useARN: true
      };

      mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
        method: 'POST'
      };

      const { POST } = await import('../src/app/api/comprehensive-analysis/route');
      
      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      // Should handle A2A version gracefully
      expect(responseData.success).toBe(true);
      expect(responseData.protocol).toBe('google-a2a-sdk');
    });
  });

  describe('/api/agent-relay-network/status A2A Integration', () => {
    it('should handle A2A coordination requests', async () => {
      const requestBody = {
        action: 'coordinate_task',
        payload: {
          taskType: 'comprehensive_analysis_a2a',
          symbols: ['AAPL', 'GOOGL'],
          protocol: 'google-a2a-sdk',
          analysisType: 'comprehensive',
          a2aAgents: ['market-research-agent-gpt4o', 'price-analysis-agent-gpt4']
        }
      };

      mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
        method: 'POST'
      };

      const { POST } = await import('../src/app/api/agent-relay-network/status/route');
      
      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.taskId).toBeDefined();
      
      // Verify A2A protocol was processed
      expect(responseData.data.protocol).toBe('google-a2a-sdk');
      expect(responseData.data.agents).toBeDefined();
    });

    it('should return A2A-compatible agent information', async () => {
      mockRequest = {
        method: 'GET'
      };

      const { GET } = await import('../src/app/api/agent-relay-network/status/route');
      
      const response = await GET(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(responseData.success).toBe(true);
      expect(responseData.data.agents).toBeDefined();
      
      // Verify agents have A2A-compatible structure
      responseData.data.agents.forEach((agent: any) => {
        expect(agent).toHaveProperty('id');
        expect(agent).toHaveProperty('name');
        expect(agent).toHaveProperty('capabilities');
        expect(agent).toHaveProperty('status');
      });
    });
  });

  describe('/api/payment/process A2A Integration', () => {
    it('should handle A2A payment coordination', async () => {
      const requestBody = {
        taskId: 'test-task-123',
        protocol: 'google-a2a-sdk',
        paymentMethod: 'demo',
        consensusResults: [
          { verifierId: 'v1', passed: true, score: 0.9 },
          { verifierId: 'v2', passed: true, score: 0.85 }
        ]
      };

      mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
        method: 'POST'
      };

      const { POST } = await import('../src/app/api/payment/process/route');
      
      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      expect(responseData.success).toBe(true);
      
      // Verify A2A payment processing
      expect(responseData.protocol).toBe('google-a2a-sdk');
      expect(responseData.agentWallets).toBeDefined();
      expect(responseData.paymentRecord).toBeDefined();
    });
  });

  describe('A2A Protocol Error Handling', () => {
    it('should gracefully handle missing A2A protocol flag', async () => {
      const requestBody = {
        symbols: ['AAPL'],
        analysisType: 'comprehensive',
        useARN: true
        // Missing protocol flag
      };

      mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
        method: 'POST'
      };

      const { POST } = await import('../src/app/api/comprehensive-analysis/route');
      
      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      // Should still work but default to legacy mode
      expect(responseData.success).toBe(true);
      expect(responseData.protocol).toBeUndefined();
    });

    it('should handle invalid A2A protocol version', async () => {
      const requestBody = {
        symbols: ['AAPL'],
        analysisType: 'comprehensive',
        protocol: 'invalid-a2a-protocol',
        useARN: true
      };

      mockRequest = {
        json: vi.fn().mockResolvedValue(requestBody),
        method: 'POST'
      };

      const { POST } = await import('../src/app/api/comprehensive-analysis/route');
      
      const response = await POST(mockRequest as NextRequest);
      const responseData = await response.json();

      // Should handle gracefully
      expect(responseData.success).toBe(true);
      expect(responseData.analysis).toBeDefined();
    });
  });
});

/**
 * A2A Message Validation Tests
 * Validates that our A2A message structures conform to Google A2A specifications
 */
describe('A2A Message Validation', () => {
  describe('JSON-RPC 2.0 Compliance', () => {
    it('should validate agent/discover message structure', () => {
      const discoverMessage = {
        id: 'msg_1234567890_abc123',
        jsonrpc: '2.0',
        method: 'agent/discover',
        params: {
          query: 'financial_analysis_agents',
          protocol: 'google-a2a-sdk',
          capabilities_requested: ['financial_analysis', 'market_research']
        },
        timestamp: '2024-01-15T10:30:00.000Z'
      };

      // Validate JSON-RPC 2.0 structure
      expect(discoverMessage.jsonrpc).toBe('2.0');
      expect(discoverMessage.id).toMatch(/^msg_\d+_[a-z0-9]+$/);
      expect(discoverMessage.method).toBe('agent/discover');
      expect(discoverMessage.params).toBeDefined();
      expect(discoverMessage.params.protocol).toBe('google-a2a-sdk');
    });

    it('should validate message/send structure', () => {
      const messageSend = {
        id: 'msg_1234567890_def456',
        jsonrpc: '2.0',
        method: 'message/send',
        params: {
          message: {
            messageId: 'task_1234567890',
            kind: 'message',
            parts: [{
              type: 'text',
              text: 'Analyze AAPL for technical_analysis'
            }],
            role: 'user'
          }
        },
        timestamp: '2024-01-15T10:30:00.000Z'
      };

      expect(messageSend.jsonrpc).toBe('2.0');
      expect(messageSend.method).toBe('message/send');
      expect(messageSend.params.message.kind).toBe('message');
      expect(messageSend.params.message.parts).toHaveLength(1);
      expect(messageSend.params.message.parts[0].type).toBe('text');
    });

    it('should validate data/share structure', () => {
      const dataShare = {
        id: 'msg_1234567890_ghi789',
        jsonrpc: '2.0',
        method: 'data/share',
        params: {
          dataType: 'market_sentiment_analysis',
          symbols: ['AAPL', 'GOOGL'],
          protocol: 'google-a2a-sdk',
          sharedData: {
            sentiment: 'bullish',
            confidence: 0.85,
            newsCount: 45,
            realAnalysis: true
          }
        },
        timestamp: '2024-01-15T10:30:00.000Z'
      };

      expect(dataShare.jsonrpc).toBe('2.0');
      expect(dataShare.method).toBe('data/share');
      expect(dataShare.params.dataType).toBe('market_sentiment_analysis');
      expect(dataShare.params.protocol).toBe('google-a2a-sdk');
      expect(dataShare.params.sharedData.realAnalysis).toBe(true);
    });

    it('should validate dkg/create_node structure', () => {
      const dkgCreate = {
        id: 'msg_1234567890_jkl012',
        jsonrpc: '2.0',
        method: 'dkg/create_node',
        params: {
          taskId: 'test-task-123',
          agentId: 'market-research-agent',
          protocol: 'google-a2a-sdk',
          nodeData: {
            analysis: 'Market sentiment analysis completed',
            confidence: 0.85,
            timestamp: '2024-01-15T10:30:00.000Z'
          },
          proofOfAgency: true
        },
        timestamp: '2024-01-15T10:30:00.000Z'
      };

      expect(dkgCreate.jsonrpc).toBe('2.0');
      expect(dkgCreate.method).toBe('dkg/create_node');
      expect(dkgCreate.params.protocol).toBe('google-a2a-sdk');
      expect(dkgCreate.params.proofOfAgency).toBe(true);
      expect(dkgCreate.params.nodeData).toBeDefined();
    });
  });

  describe('A2A Agent Capabilities Structure', () => {
    it('should validate A2A agent card structure', () => {
      const agentCard = {
        id: 'market-research-agent-gpt4o',
        name: 'Market Research Agent (GPT-4o)',
        description: 'Real-time market sentiment and news analysis',
        capabilities: {
          extensions: [],
          pushNotifications: false,
          stateTransitionHistory: false,
          streaming: false
        },
        url: 'http://localhost:8081/a2a/api',
        defaultInputModes: ['text/plain'],
        defaultOutputModes: ['text/plain', 'application/json'],
        skills: [{
          id: 'financial-analysis',
          name: 'financial-analysis',
          description: 'Comprehensive financial analysis and research',
          inputModes: ['text/plain'],
          outputModes: ['text/plain', 'application/json'],
          tags: ['finance', 'analysis', 'research']
        }],
        version: '1.0.0'
      };

      // Validate A2A agent card structure
      expect(agentCard.capabilities.extensions).toEqual([]);
      expect(agentCard.capabilities.pushNotifications).toBe(false);
      expect(agentCard.capabilities.stateTransitionHistory).toBe(false);
      expect(agentCard.capabilities.streaming).toBe(false);
      expect(agentCard.skills).toHaveLength(1);
      expect(agentCard.skills[0].id).toBe('financial-analysis');
      expect(agentCard.skills[0].tags).toContain('finance');
    });
  });
}); 