import { ScoreVector, VerificationResult } from '@/agents/verifier-agent';

export interface AgentReputation {
  agentId: string;
  agentName: string;
  averageScore: ScoreVector;
  totalTasks: number;
  acceptedTasks: number;
  rejectedTasks: number;
  averageResponseTime: number; // in minutes
  specialties: string[]; // areas where the agent excels
  feedback: string[]; // recent feedback from verifiers
  reputationScore: number; // overall reputation (0-1)
  lastUpdated: string;
  performanceHistory: PerformanceRecord[];
}

export interface PerformanceRecord {
  taskId: string;
  timestamp: string;
  scoreVector: ScoreVector;
  feedback?: string;
  verifierIds: string[];
  accepted: boolean;
  responseTimeMinutes: number;
}

export interface ReputationUpdate {
  agentId: string;
  taskId: string;
  verificationResults: VerificationResult[];
  taskStartTime: Date;
  taskEndTime: Date;
}

export class AgentReputationNetwork {
  private reputations: Map<string, AgentReputation>;
  private readonly maxFeedbackHistory = 10;
  private readonly maxPerformanceHistory = 50;

  constructor() {
    this.reputations = new Map();
  }

  /**
   * Initialize reputation for a new agent
   */
  initializeAgent(agentId: string, agentName: string): void {
    if (this.reputations.has(agentId)) {
      return; // Agent already initialized
    }

    const initialReputation: AgentReputation = {
      agentId,
      agentName,
      averageScore: {
        accuracy: 0.5,
        completeness: 0.5,
        causality: 0.5,
        timeliness: 0.5,
        originality: 0.5,
        trustworthiness: 0.5,
        confidence: 0.5
      },
      totalTasks: 0,
      acceptedTasks: 0,
      rejectedTasks: 0,
      averageResponseTime: 0,
      specialties: [],
      feedback: [],
      reputationScore: 0.5,
      lastUpdated: new Date().toISOString(),
      performanceHistory: []
    };

    this.reputations.set(agentId, initialReputation);
    console.log(`ARN: Initialized reputation for agent ${agentId}`);
  }

  /**
   * Update agent reputation based on verification results
   */
  updateReputation(update: ReputationUpdate): void {
    const { agentId, taskId, verificationResults, taskStartTime, taskEndTime } = update;

    if (!this.reputations.has(agentId)) {
      console.warn(`ARN: Agent ${agentId} not found, initializing...`);
      this.initializeAgent(agentId, agentId);
    }

    const reputation = this.reputations.get(agentId)!;

    // Calculate consensus score vector from all verifiers
    const consensusScore = this.calculateConsensusScore(verificationResults);
    
    // Determine if task was accepted (all verifiers passed or majority consensus)
    const accepted = this.isTaskAccepted(verificationResults);

    // Calculate response time
    const responseTimeMinutes = (taskEndTime.getTime() - taskStartTime.getTime()) / (1000 * 60);

    // Create performance record
    const performanceRecord: PerformanceRecord = {
      taskId,
      timestamp: new Date().toISOString(),
      scoreVector: consensusScore,
      feedback: this.aggregateFeedback(verificationResults),
      verifierIds: verificationResults.map(r => r.verifierId),
      accepted,
      responseTimeMinutes
    };

    // Update reputation
    this.updateAgentStats(reputation, performanceRecord);
    this.updateAverageScores(reputation, consensusScore);
    this.updateSpecialties(reputation, consensusScore);
    this.updateFeedback(reputation, verificationResults);
    this.calculateReputationScore(reputation);

    // Add to performance history
    reputation.performanceHistory.unshift(performanceRecord);
    if (reputation.performanceHistory.length > this.maxPerformanceHistory) {
      reputation.performanceHistory = reputation.performanceHistory.slice(0, this.maxPerformanceHistory);
    }

    reputation.lastUpdated = new Date().toISOString();

    console.log(`ARN: Updated reputation for agent ${agentId}, new score: ${reputation.reputationScore.toFixed(3)}`);
  }

  /**
   * Get agent reputation
   */
  getReputation(agentId: string): AgentReputation | undefined {
    return this.reputations.get(agentId);
  }

  /**
   * Get all agent reputations
   */
  getAllReputations(): AgentReputation[] {
    return Array.from(this.reputations.values());
  }

  /**
   * Get top performing agents
   */
  getTopAgents(limit: number = 10): AgentReputation[] {
    return Array.from(this.reputations.values())
      .sort((a, b) => b.reputationScore - a.reputationScore)
      .slice(0, limit);
  }

  /**
   * Get agents by specialty
   */
  getAgentsBySpecialty(specialty: string): AgentReputation[] {
    return Array.from(this.reputations.values())
      .filter(rep => rep.specialties.includes(specialty))
      .sort((a, b) => b.reputationScore - a.reputationScore);
  }

  /**
   * Calculate consensus score vector from multiple verifier results
   */
  private calculateConsensusScore(verificationResults: VerificationResult[]): ScoreVector {
    if (verificationResults.length === 0) {
      throw new Error('No verification results provided');
    }

    const scoreKeys: (keyof ScoreVector)[] = [
      'accuracy', 'completeness', 'causality', 'timeliness', 
      'originality', 'trustworthiness', 'confidence'
    ];

    const consensusScore: ScoreVector = {
      accuracy: 0,
      completeness: 0,
      causality: 0,
      timeliness: 0,
      originality: 0,
      trustworthiness: 0,
      confidence: 0
    };

    // Calculate average for each dimension
    for (const key of scoreKeys) {
      const scores = verificationResults.map(result => result.scoreVector[key]);
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      consensusScore[key] = Math.round(average * 100) / 100;
    }

    return consensusScore;
  }

  /**
   * Determine if task was accepted based on verification results
   */
  private isTaskAccepted(verificationResults: VerificationResult[]): boolean {
    const passedCount = verificationResults.filter(result => 
      result.endResultCheck.passed && result.causalAudit.passed
    ).length;
    
    // Require majority consensus for acceptance
    return passedCount > verificationResults.length / 2;
  }

  /**
   * Aggregate feedback from all verifiers
   */
  private aggregateFeedback(verificationResults: VerificationResult[]): string {
    const feedbacks = verificationResults
      .map(result => result.feedback)
      .filter(feedback => feedback && feedback.trim().length > 0);
    
    return feedbacks.join(' | ');
  }

  /**
   * Update basic agent statistics
   */
  private updateAgentStats(reputation: AgentReputation, performanceRecord: PerformanceRecord): void {
    reputation.totalTasks++;
    
    if (performanceRecord.accepted) {
      reputation.acceptedTasks++;
    } else {
      reputation.rejectedTasks++;
    }

    // Update average response time (exponential moving average)
    const alpha = 0.2; // Smoothing factor
    if (reputation.totalTasks === 1) {
      reputation.averageResponseTime = performanceRecord.responseTimeMinutes;
    } else {
      reputation.averageResponseTime = 
        alpha * performanceRecord.responseTimeMinutes + (1 - alpha) * reputation.averageResponseTime;
    }
  }

  /**
   * Update average scores using exponential moving average
   */
  private updateAverageScores(reputation: AgentReputation, newScore: ScoreVector): void {
    const alpha = 0.3; // Smoothing factor for score updates
    const scoreKeys: (keyof ScoreVector)[] = [
      'accuracy', 'completeness', 'causality', 'timeliness', 
      'originality', 'trustworthiness', 'confidence'
    ];

    for (const key of scoreKeys) {
      reputation.averageScore[key] = 
        alpha * newScore[key] + (1 - alpha) * reputation.averageScore[key];
      reputation.averageScore[key] = Math.round(reputation.averageScore[key] * 100) / 100;
    }
  }

  /**
   * Update agent specialties based on performance
   */
  private updateSpecialties(reputation: AgentReputation, scoreVector: ScoreVector): void {
    const specialtyThreshold = 0.8;
    const newSpecialties: string[] = [];

    if (scoreVector.accuracy >= specialtyThreshold) {
      newSpecialties.push('high-accuracy');
    }
    if (scoreVector.originality >= specialtyThreshold) {
      newSpecialties.push('innovative-analysis');
    }
    if (scoreVector.timeliness >= specialtyThreshold) {
      newSpecialties.push('fast-response');
    }
    if (scoreVector.causality >= specialtyThreshold) {
      newSpecialties.push('detailed-reasoning');
    }

    // Add new specialties that aren't already present
    for (const specialty of newSpecialties) {
      if (!reputation.specialties.includes(specialty)) {
        reputation.specialties.push(specialty);
      }
    }

    // Keep only the most recent 5 specialties
    if (reputation.specialties.length > 5) {
      reputation.specialties = reputation.specialties.slice(-5);
    }
  }

  /**
   * Update feedback history
   */
  private updateFeedback(reputation: AgentReputation, verificationResults: VerificationResult[]): void {
    const newFeedback = verificationResults
      .map(result => result.feedback)
      .filter(feedback => feedback && feedback.trim().length > 0);

    for (const feedback of newFeedback) {
      reputation.feedback.unshift(feedback!);
    }

    // Keep only recent feedback
    if (reputation.feedback.length > this.maxFeedbackHistory) {
      reputation.feedback = reputation.feedback.slice(0, this.maxFeedbackHistory);
    }
  }

  /**
   * Calculate overall reputation score
   */
  private calculateReputationScore(reputation: AgentReputation): void {
    const { averageScore, totalTasks, acceptedTasks } = reputation;

    // Base score from average performance
    const baseScore = (
      averageScore.accuracy * 0.2 +
      averageScore.completeness * 0.15 +
      averageScore.causality * 0.15 +
      averageScore.timeliness * 0.1 +
      averageScore.originality * 0.1 +
      averageScore.trustworthiness * 0.2 +
      averageScore.confidence * 0.1
    );

    // Acceptance rate bonus/penalty
    const acceptanceRate = totalTasks > 0 ? acceptedTasks / totalTasks : 0.5;
    const acceptanceBonus = (acceptanceRate - 0.5) * 0.2; // ±0.1 max

    // Experience bonus (more tasks = slightly higher reputation, up to 0.05)
    const experienceBonus = Math.min(0.05, totalTasks * 0.001);

    // Response time factor (faster = better, up to 0.05 bonus)
    const responseTimeBonus = reputation.averageResponseTime > 0 ? 
      Math.max(-0.05, Math.min(0.05, (10 - reputation.averageResponseTime) * 0.01)) : 0;

    reputation.reputationScore = Math.max(0, Math.min(1, 
      baseScore + acceptanceBonus + experienceBonus + responseTimeBonus
    ));
    reputation.reputationScore = Math.round(reputation.reputationScore * 1000) / 1000;
  }

  /**
   * Get reputation statistics
   */
  getReputationStats(): {
    totalAgents: number;
    averageReputation: number;
    topPerformers: string[];
    specialtyDistribution: Record<string, number>;
  } {
    const reputations = Array.from(this.reputations.values());
    const totalAgents = reputations.length;
    
    const averageReputation = totalAgents > 0 ? 
      reputations.reduce((sum, rep) => sum + rep.reputationScore, 0) / totalAgents : 0;

    const topPerformers = reputations
      .sort((a, b) => b.reputationScore - a.reputationScore)
      .slice(0, 5)
      .map(rep => rep.agentId);

    const specialtyDistribution: Record<string, number> = {};
    for (const reputation of reputations) {
      for (const specialty of reputation.specialties) {
        specialtyDistribution[specialty] = (specialtyDistribution[specialty] || 0) + 1;
      }
    }

    return {
      totalAgents,
      averageReputation: Math.round(averageReputation * 1000) / 1000,
      topPerformers,
      specialtyDistribution
    };
  }
}

// Global ARN instance
export const agentReputationNetwork = new AgentReputationNetwork(); 