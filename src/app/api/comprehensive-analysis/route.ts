import { NextRequest, NextResponse } from 'next/server';
import { agentManager } from '@/agents/manager';
import { dkgManager } from '@/lib/dkg';
import { agentReputationNetwork } from '@/lib/arn';

export async function POST(request: NextRequest) {
  try {
    const { symbols, analysisType } = await request.json();

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: 'Symbols array is required' },
        { status: 400 }
      );
    }

    console.log(`API: Starting comprehensive analysis for ${symbols.join(', ')}`);

    // Execute comprehensive analysis with multi-agent, DKG, verification, and consensus
    const result = await agentManager.requestComprehensiveAnalysis(symbols, analysisType);

    // Get additional metrics
    const dkgStats = dkgManager.getStats();
    const reputationStats = agentReputationNetwork.getReputationStats();
    const topAgents = agentReputationNetwork.getTopAgents(5);

    // Get consensus data for visualization
    const consensusData = await agentManager.getConsensusData(result.taskId);

    return NextResponse.json({
      success: true,
      analysis: result,
      metrics: {
        dkg: dkgStats,
        reputation: reputationStats,
        topAgents: topAgents.map(agent => ({
          id: agent.agentId,
          name: agent.agentName,
          score: agent.reputationScore,
          totalTasks: agent.totalTasks,
          acceptanceRate: agent.totalTasks > 0 ? agent.acceptedTasks / agent.totalTasks : 0,
          specialties: agent.specialties
        }))
      },
      consensusData: consensusData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Comprehensive analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Analysis failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get current system status
    const dkgStats = dkgManager.getStats();
    const reputationStats = agentReputationNetwork.getReputationStats();
    const allReputations = agentReputationNetwork.getAllReputations();

    return NextResponse.json({
      success: true,
      status: 'ChaosChain MVP is running',
      features: [
        'Multi-Agent Collaboration (A2A)',
        'Decentralized Knowledge Graph (DKG)',
        'Proof of Agency (PoA)',
        'Verifier Agent Network',
        'Agent Reputation System (ARN)',
        'Consensus Mechanism',
        'Automated Payment Release'
      ],
      metrics: {
        dkg: dkgStats,
        reputation: reputationStats
      },
      agents: allReputations.map(rep => ({
        id: rep.agentId,
        name: rep.agentName,
        reputationScore: rep.reputationScore,
        totalTasks: rep.totalTasks,
        acceptanceRate: rep.totalTasks > 0 ? rep.acceptedTasks / rep.totalTasks : 0,
        specialties: rep.specialties,
        lastUpdated: rep.lastUpdated
      })),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json(
      { 
        error: 'Status check failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
} 