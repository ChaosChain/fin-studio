import { NextResponse } from 'next/server';
import { agentManager } from '@/agents/manager';
import { nostrAgentRelayNetwork } from '@/lib/nostr-agent-relay-network';

function getMockARNData() {
  return {
    networkStatus: {
      isRunning: true,
      connectedRelays: 3,
      totalRelays: 3,
      knownAgents: 16, // 4 base + 8 variants + 4 verifiers
      activeRequests: Math.floor(Math.random() * 3),
      taskCoordinations: Math.floor(Math.random() * 2),
      uptime: Date.now() - (Date.now() % 1800000) // 30 minutes rounded
    },
    knownAgents: [
      // Base agents
      {
        agentId: 'market-research-agent',
        name: 'Market Research Agent',
        capabilities: ['news_analysis', 'market_sentiment', 'trend_analysis', 'company_research', 'sector_analysis', 'event_impact_analysis'],
        specialties: ['market_trends', 'news_analysis', 'social_sentiment'],
        reputation: 0.85,
        cost: '$0.01',
        endpoint: 'http://localhost:8081',
        publicKey: 'arn-market-' + Date.now().toString(36),
        lastSeen: Date.now() - Math.floor(Math.random() * 120000),
        relays: ['local-relay-1', 'local-relay-2', 'local-relay-3']
      },
      {
        agentId: 'macro-research-agent',
        name: 'Macro Research Agent',
        capabilities: ['economic_indicators', 'macro_trend_analysis', 'policy_analysis', 'central_bank_analysis', 'inflation_analysis', 'gdp_analysis'],
        specialties: ['economic_trends', 'policy_impact', 'macro_indicators'],
        reputation: 0.78,
        cost: '$0.02',
        endpoint: 'http://localhost:8082',
        publicKey: 'arn-macro-' + Date.now().toString(36),
        lastSeen: Date.now() - Math.floor(Math.random() * 120000),
        relays: ['local-relay-1', 'local-relay-2', 'local-relay-3']
      },
      {
        agentId: 'price-analysis-agent',
        name: 'Price Analysis Agent',
        capabilities: ['technical_analysis', 'real_time_price_data', 'chart_patterns', 'volume_analysis', 'momentum_indicators', 'support_resistance'],
        specialties: ['technical_patterns', 'price_prediction', 'risk_analysis'],
        reputation: 0.92,
        cost: '$0.005',
        endpoint: 'http://localhost:8083',
        publicKey: 'arn-price-' + Date.now().toString(36),
        lastSeen: Date.now() - Math.floor(Math.random() * 120000),
        relays: ['local-relay-1', 'local-relay-2', 'local-relay-3']
      },
      {
        agentId: 'insights-agent',
        name: 'Insights Agent',
        capabilities: ['daily_insights', 'report_generation', 'synthesis', 'recommendations', 'risk_assessment', 'portfolio_optimization'],
        specialties: ['insight_generation', 'report_synthesis', 'strategic_recommendations'],
        reputation: 0.88,
        cost: '$0.03',
        endpoint: 'http://localhost:8084',
        publicKey: 'arn-insights-' + Date.now().toString(36),
        lastSeen: Date.now() - Math.floor(Math.random() * 120000),
        relays: ['local-relay-1', 'local-relay-2', 'local-relay-3']
      },
      // Model variants
      {
        agentId: 'market-research-agent-gpt4',
        name: 'Market Research Agent (GPT-4)',
        capabilities: ['news_analysis', 'market_sentiment', 'trend_analysis', 'company_research', 'sector_analysis', 'event_impact_analysis'],
        specialties: ['market_trends', 'news_analysis', 'social_sentiment'],
        reputation: 0.87,
        cost: '$0.01',
        endpoint: 'http://localhost:8081',
        publicKey: 'arn-market-gpt4-' + Date.now().toString(36),
        lastSeen: Date.now() - Math.floor(Math.random() * 120000),
        relays: ['local-relay-1', 'local-relay-2', 'local-relay-3']
      },
      {
        agentId: 'market-research-agent-gpt4o',
        name: 'Market Research Agent (GPT-4O)',
        capabilities: ['news_analysis', 'market_sentiment', 'trend_analysis', 'company_research', 'sector_analysis', 'event_impact_analysis'],
        specialties: ['market_trends', 'news_analysis', 'social_sentiment'],
        reputation: 0.83,
        cost: '$0.01',
        endpoint: 'http://localhost:8081',
        publicKey: 'arn-market-gpt4o-' + Date.now().toString(36),
        lastSeen: Date.now() - Math.floor(Math.random() * 120000),
        relays: ['local-relay-1', 'local-relay-2', 'local-relay-3']
      },
      {
        agentId: 'macro-research-agent-gpt4',
        name: 'Macro Research Agent (GPT-4)',
        capabilities: ['economic_indicators', 'macro_trend_analysis', 'policy_analysis', 'central_bank_analysis', 'inflation_analysis', 'gdp_analysis'],
        specialties: ['economic_trends', 'policy_impact', 'macro_indicators'],
        reputation: 0.80,
        cost: '$0.02',
        endpoint: 'http://localhost:8082',
        publicKey: 'arn-macro-gpt4-' + Date.now().toString(36),
        lastSeen: Date.now() - Math.floor(Math.random() * 120000),
        relays: ['local-relay-1', 'local-relay-2', 'local-relay-3']
      },
      {
        agentId: 'macro-research-agent-gpt4o',
        name: 'Macro Research Agent (GPT-4O)',
        capabilities: ['economic_indicators', 'macro_trend_analysis', 'policy_analysis', 'central_bank_analysis', 'inflation_analysis', 'gdp_analysis'],
        specialties: ['economic_trends', 'policy_impact', 'macro_indicators'],
        reputation: 0.76,
        cost: '$0.02',
        endpoint: 'http://localhost:8082',
        publicKey: 'arn-macro-gpt4o-' + Date.now().toString(36),
        lastSeen: Date.now() - Math.floor(Math.random() * 120000),
        relays: ['local-relay-1', 'local-relay-2', 'local-relay-3']
      },
      {
        agentId: 'price-analysis-agent-gpt4',
        name: 'Price Analysis Agent (GPT-4)',
        capabilities: ['technical_analysis', 'real_time_price_data', 'chart_patterns', 'volume_analysis', 'momentum_indicators', 'support_resistance'],
        specialties: ['technical_patterns', 'price_prediction', 'risk_analysis'],
        reputation: 0.94,
        cost: '$0.005',
        endpoint: 'http://localhost:8083',
        publicKey: 'arn-price-gpt4-' + Date.now().toString(36),
        lastSeen: Date.now() - Math.floor(Math.random() * 120000),
        relays: ['local-relay-1', 'local-relay-2', 'local-relay-3']
      },
      {
        agentId: 'price-analysis-agent-gpt4o',
        name: 'Price Analysis Agent (GPT-4O)',
        capabilities: ['technical_analysis', 'real_time_price_data', 'chart_patterns', 'volume_analysis', 'momentum_indicators', 'support_resistance'],
        specialties: ['technical_patterns', 'price_prediction', 'risk_analysis'],
        reputation: 0.90,
        cost: '$0.005',
        endpoint: 'http://localhost:8083',
        publicKey: 'arn-price-gpt4o-' + Date.now().toString(36),
        lastSeen: Date.now() - Math.floor(Math.random() * 120000),
        relays: ['local-relay-1', 'local-relay-2', 'local-relay-3']
      },
      {
        agentId: 'insights-agent-gpt4',
        name: 'Insights Agent (GPT-4)',
        capabilities: ['daily_insights', 'report_generation', 'synthesis', 'recommendations', 'risk_assessment', 'portfolio_optimization'],
        specialties: ['insight_generation', 'report_synthesis', 'strategic_recommendations'],
        reputation: 0.90,
        cost: '$0.03',
        endpoint: 'http://localhost:8084',
        publicKey: 'arn-insights-gpt4-' + Date.now().toString(36),
        lastSeen: Date.now() - Math.floor(Math.random() * 120000),
        relays: ['local-relay-1', 'local-relay-2', 'local-relay-3']
      },
      {
        agentId: 'insights-agent-gpt4o',
        name: 'Insights Agent (GPT-4O)',
        capabilities: ['daily_insights', 'report_generation', 'synthesis', 'recommendations', 'risk_assessment', 'portfolio_optimization'],
        specialties: ['insight_generation', 'report_synthesis', 'strategic_recommendations'],
        reputation: 0.86,
        cost: '$0.03',
        endpoint: 'http://localhost:8084',
        publicKey: 'arn-insights-gpt4o-' + Date.now().toString(36),
        lastSeen: Date.now() - Math.floor(Math.random() * 120000),
        relays: ['local-relay-1', 'local-relay-2', 'local-relay-3']
      },
      // Verifier agents
      {
        agentId: 'verifier-agent-1',
        name: 'Verifier Agent 1',
        capabilities: ['verification', 'consensus', 'validation', 'quality_assurance', 'accuracy_check', 'fraud_detection'],
        specialties: ['verification', 'consensus', 'validation'],
        reputation: 0.95,
        cost: '$0.001',
        endpoint: 'http://localhost:8085',
        publicKey: 'arn-verifier1-' + Date.now().toString(36),
        lastSeen: Date.now() - Math.floor(Math.random() * 120000),
        relays: ['local-relay-1', 'local-relay-2', 'local-relay-3']
      },
      {
        agentId: 'verifier-agent-2',
        name: 'Verifier Agent 2',
        capabilities: ['verification', 'consensus', 'validation', 'quality_assurance', 'accuracy_check', 'fraud_detection'],
        specialties: ['verification', 'consensus', 'validation'],
        reputation: 0.93,
        cost: '$0.001',
        endpoint: 'http://localhost:8086',
        publicKey: 'arn-verifier2-' + Date.now().toString(36),
        lastSeen: Date.now() - Math.floor(Math.random() * 120000),
        relays: ['local-relay-1', 'local-relay-2', 'local-relay-3']
      },
      {
        agentId: 'verifier-agent-3',
        name: 'Verifier Agent 3',
        capabilities: ['verification', 'consensus', 'validation', 'quality_assurance', 'accuracy_check', 'fraud_detection'],
        specialties: ['verification', 'consensus', 'validation'],
        reputation: 0.94,
        cost: '$0.001',
        endpoint: 'http://localhost:8087',
        publicKey: 'arn-verifier3-' + Date.now().toString(36),
        lastSeen: Date.now() - Math.floor(Math.random() * 120000),
        relays: ['local-relay-1', 'local-relay-2', 'local-relay-3']
      },
      {
        agentId: 'verifier-agent-4',
        name: 'Verifier Agent 4',
        capabilities: ['verification', 'consensus', 'validation', 'quality_assurance', 'accuracy_check', 'fraud_detection'],
        specialties: ['verification', 'consensus', 'validation'],
        reputation: 0.96,
        cost: '$0.001',
        endpoint: 'http://localhost:8088',
        publicKey: 'arn-verifier4-' + Date.now().toString(36),
        lastSeen: Date.now() - Math.floor(Math.random() * 120000),
        relays: ['local-relay-1', 'local-relay-2', 'local-relay-3']
      }
    ],
    relayStatus: [
      { url: 'local-relay-1', connected: true, latency: Math.floor(Math.random() * 30) + 45, agentCount: 16 },
      { url: 'local-relay-2', connected: true, latency: Math.floor(Math.random() * 35) + 50, agentCount: 16 },
      { url: 'local-relay-3', connected: true, latency: Math.floor(Math.random() * 25) + 40, agentCount: 16 }
    ]
  };
}

export async function GET() {
  try {
    // Ensure agent manager is initialized
    if (!agentManager.getIsRunning()) {
      console.log('🔄 Agent Manager not running, attempting to initialize...');
      try {
        await agentManager.initialize();
        // Wait a bit for agent registration to complete
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error) {
        console.error('Failed to initialize agent manager:', error);
      }
    }
    
    // Get status from both legacy and Nostr ARN
    const legacyRelayStatus = agentManager.getRelayNetworkStatus();
    const nostrARNStatus = nostrAgentRelayNetwork.getNetworkStatus();
    
    console.log(`🌐 Nostr ARN Status: ${nostrARNStatus.knownAgents} agents, ${nostrARNStatus.connectedRelays}/${nostrARNStatus.totalRelays} relays`);
    console.log(`📡 Legacy ARN Status: ${legacyRelayStatus?.knownAgents?.length || 0} agents`);
    
    // Prefer Nostr ARN if it has agents, otherwise use legacy or mock data
    let primaryStatus;
    let dataSource = 'mock';
    
    if (nostrARNStatus.isRunning && nostrARNStatus.knownAgents > 0) {
      // Convert Nostr ARN status to legacy format for compatibility
      const nostrAgents = nostrAgentRelayNetwork.getKnownAgents();
      const nostrRelayStatus = nostrAgentRelayNetwork.getRelayStatus();
      
      primaryStatus = {
        isRunning: nostrARNStatus.isRunning,
        knownAgents: nostrAgents.map(agent => ({
          agentId: agent.agentId,
          name: agent.name,
          capabilities: agent.capabilities,
          specialties: agent.specialties,
          reputation: agent.reputation / 100, // Convert to decimal
          cost: `$${agent.cost}`,
          endpoint: agent.endpoint,
          publicKey: agent.publicKey,
          lastSeen: agent.lastSeen,
          relays: [agent.publicKey.slice(0, 8)] // Use pubkey prefix as relay reference
        })),
        activeRequests: nostrAgentRelayNetwork.getActiveRequests().map(req => ({
          requestId: req.requestId,
          taskType: req.taskType,
          payload: req.payload,
          targetAgent: req.targetAgent,
          maxCost: req.maxCost,
          deadline: req.deadline,
          requesterPubkey: req.requesterPubkey,
          relays: [req.requesterPubkey.slice(0, 8)]
        })),
        taskCoordinations: nostrAgentRelayNetwork.getTaskCoordinations().map(coord => ({
          taskId: coord.taskId,
          coordinator: coord.coordinator,
          agents: coord.agents,
          taskData: coord.taskData,
          timestamp: coord.timestamp
        })),
        relayStatus: nostrRelayStatus.map(relay => ({
          url: relay.url,
          connected: relay.connected,
          latency: relay.latency,
          agentCount: Math.floor(nostrARNStatus.knownAgents / nostrARNStatus.totalRelays),
          lastPing: relay.lastPing
        })),
        connectedRelays: nostrARNStatus.connectedRelays,
        totalRelays: nostrARNStatus.totalRelays,
        uptime: nostrARNStatus.uptime
      };
      dataSource = 'nostr';
    } else if (legacyRelayStatus && legacyRelayStatus.knownAgents && legacyRelayStatus.knownAgents.length >= 10) {
      primaryStatus = legacyRelayStatus;
      dataSource = 'legacy';
    } else {
      primaryStatus = getMockARNData();
      dataSource = 'mock';
    }
    
    console.log(`✅ ARN Status (${dataSource}): ${primaryStatus.knownAgents.length} agents`);
    
    return NextResponse.json({
      success: true,
      data: primaryStatus,
      meta: {
        dataSource,
        nostrConnected: nostrARNStatus.isRunning,
        nostrRelays: `${nostrARNStatus.connectedRelays}/${nostrARNStatus.totalRelays}`,
        legacyAgents: legacyRelayStatus?.knownAgents?.length || 0
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error fetching Agent Relay Network status:', error);
    
    // Return enhanced mock data with real agent capabilities
    return NextResponse.json({
      success: true,
      data: getMockARNData(),
      timestamp: new Date().toISOString(),
      note: 'Using mock data due to error'
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, payload } = body;
    
    switch (action) {
      case 'discover_agents':
        const discoveredAgents = await agentManager.discoverAgentsByCapability(
          payload.capabilities || []
        );
        
        return NextResponse.json({
          success: true,
          data: { agents: discoveredAgents }
        });
        
      case 'request_service':
        const requestId = await agentManager.requestAgentServiceViaRelay(
          payload.taskType,
          payload.payload,
          payload.targetAgent,
          payload.maxCost
        );
        
        return NextResponse.json({
          success: true,
          data: { requestId }
        });
        
      case 'coordinate_task':
        await agentManager.coordinateTaskViaRelay(
          payload.taskId,
          payload.agents,
          payload.taskData
        );
        
        return NextResponse.json({
          success: true,
          data: { message: 'Task coordination initiated' }
        });
        
      case 'find_best_agent':
        const bestAgent = agentManager.findBestAgentForTask(
          payload.taskType, 
          payload.maxCost
        );
        
        return NextResponse.json({
          success: true,
          data: { agent: bestAgent }
        });
        
      default:
        return NextResponse.json(
          { success: false, error: 'Unknown action' },
          { status: 400 }
        );
    }
    
  } catch (error) {
    console.error('Error processing Agent Relay Network request:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 