import {
  A2AMessage,
  AgentIdentity,
  AgentType,
  A2AHandlerFunction
} from '@/types/a2a';
import { DKGNode, dkgManager } from '@/lib/dkg';

export interface ScoreVector {
  accuracy: number;
  completeness: number;
  causality: number;
  timeliness: number;
  originality: number;
  trustworthiness: number;
  confidence: number;
}

export interface VerificationResult {
  nodeId: string;
  agentId: string;
  verifierId: string;
  scoreVector: ScoreVector;
  feedback?: string;
  endResultCheck: {
    passed: boolean;
    issues?: string[];
  };
  causalAudit: {
    passed: boolean;
    causalChainLength: number;
    initiativeScore: number;
    traceabilityScore: number;
    issues?: string[];
  };
  timestamp: string;
}

export class VerifierAgent {
  private identity: AgentIdentity;
  private verifierId: string;

  constructor(verifierId: string) {
    this.verifierId = verifierId;
    this.identity = {
      id: `verifier-agent-${verifierId}`,
      name: `Verifier Agent ${verifierId}`,
      type: AgentType.VERIFIER,
      version: '1.0.0',
      capabilities: [
        'end_result_verification',
        'causal_auditing',
        'score_vector_generation',
        'consensus_participation'
      ]
    };
  }

  getIdentity(): AgentIdentity {
    return this.identity;
  }

  getHandlers(): Map<string, A2AHandlerFunction> {
    const handlers = new Map<string, A2AHandlerFunction>();
    handlers.set('verify_work', this.verifyWork.bind(this));
    handlers.set('batch_verify', this.batchVerify.bind(this));
    return handlers;
  }

  /**
   * Main verification method
   */
  private async verifyWork(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { nodeId, taskId } = message.payload.data || {};
      
      if (!nodeId) {
        throw new Error('No nodeId provided for verification');
      }

      const node = dkgManager.getNode(nodeId);
      if (!node) {
        throw new Error(`Node ${nodeId} not found in DKG`);
      }

      const verificationResult = await this.performVerification(node);

      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'verification_complete',
          data: {
            verificationResult,
            nodeId,
            taskId
          }
        },
        metadata: {
          responseToMessageId: message.id
        }
      };
    } catch (error) {
      return this.createErrorResponse(message, error as Error);
    }
  }

  /**
   * Batch verification for multiple nodes
   */
  private async batchVerify(message: A2AMessage): Promise<A2AMessage> {
    try {
      const { taskId } = message.payload.data || {};
      
      if (!taskId) {
        throw new Error('No taskId provided for batch verification');
      }

      const nodes = dkgManager.getTaskNodes(taskId);
      const verificationResults: VerificationResult[] = [];

      for (const node of nodes) {
        const result = await this.performVerification(node);
        verificationResults.push(result);
      }

      return {
        id: this.generateId(),
        type: 'response' as any,
        timestamp: new Date(),
        source: this.identity,
        target: message.source,
        payload: {
          action: 'batch_verification_complete',
          data: {
            verificationResults,
            taskId,
            totalNodes: nodes.length
          }
        },
        metadata: {
          responseToMessageId: message.id
        }
      };
    } catch (error) {
      return this.createErrorResponse(message, error as Error);
    }
  }

  /**
   * Perform comprehensive verification of a DKG node
   */
  private async performVerification(node: DKGNode): Promise<VerificationResult> {
    console.log(`Verifier ${this.verifierId}: Verifying node ${node.id} from agent ${node.agentId}`);

    // Step 1: End Result Check
    const endResultCheck = this.performEndResultCheck(node);

    // Step 2: Causal Auditing
    const causalAudit = this.performCausalAudit(node);

    // Generate score vector based on verification results
    const scoreVector = this.generateScoreVector(node, endResultCheck, causalAudit);

    // Generate feedback
    const feedback = this.generateFeedback(node, endResultCheck, causalAudit, scoreVector);

    return {
      nodeId: node.id,
      agentId: node.agentId,
      verifierId: this.verifierId,
      scoreVector,
      feedback,
      endResultCheck,
      causalAudit,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Step 1: End Result Check - Verify output meets policies and expectations
   */
  private performEndResultCheck(node: DKGNode): { passed: boolean; issues?: string[] } {
    const issues: string[] = [];
    let passed = true;

    // Check if result data exists
    if (!node.resultData) {
      issues.push('No result data provided');
      passed = false;
    }

    // Component-specific checks
    if (node.componentType === 'sentiment') {
      // Check for real sentiment analysis data structure
      if (node.resultData.sentimentAnalysis) {
        // Real data from market research agent
        const analysis = node.resultData.sentimentAnalysis;
        if (!analysis.overallScore && !analysis.sentimentOverview) {
          issues.push('Missing sentiment analysis structure');
          passed = false;
        }
      } else if (node.resultData.sentiment) {
        // Enhanced sentiment validation - handle both formats
        const validSentiments = [
          'positive', 'negative', 'neutral',  // Standard format
          'bullish', 'bearish', 'neutral'     // Financial format
        ];
        if (typeof node.resultData.sentiment === 'string') {
          const sentiment = node.resultData.sentiment.toLowerCase();
          if (!validSentiments.includes(sentiment)) {
            issues.push(`Invalid sentiment value: ${node.resultData.sentiment}. Must be one of: bullish/bearish/neutral or positive/negative/neutral`);
            passed = false;
          }
        } else {
          issues.push('Sentiment result must be a string');
          passed = false;
        }
      } else if (node.resultData.analysis && node.resultData.analysis.sentiment) {
        // Check nested sentiment in analysis object
        const sentiment = node.resultData.analysis.sentiment;
        const validSentiments = [
          'positive', 'negative', 'neutral',  
          'bullish', 'bearish', 'neutral'     
        ];
        if (typeof sentiment === 'string') {
          if (!validSentiments.includes(sentiment.toLowerCase())) {
            issues.push(`Invalid sentiment value in analysis: ${sentiment}. Must be one of: bullish/bearish/neutral or positive/negative/neutral`);
            passed = false;
          }
        }
      } else {
        issues.push('No sentiment data found in result');
        passed = false;
      }
    }

    // Technical analysis checks
    if (node.componentType === 'technical') {
      const hasValidTechnicalData = node.resultData.technicalAnalysis || 
                                   node.resultData.priceAnalysis ||
                                   node.resultData.technicalOverview ||
                                   node.resultData.momentumAnalysis ||
                                   node.resultData.trendAnalysis ||
                                   node.resultData.tradingSignals ||
                                   node.resultData.volatilityIndicators ||
                                   (node.resultData.trend && node.resultData.priceTarget);
      
      if (!hasValidTechnicalData) {
        issues.push('No technical analysis data found');
        passed = false;
      } else {
        // Additional validation for comprehensive technical data
        if (node.resultData.technicalOverview || node.resultData.momentumAnalysis) {
          // This is comprehensive technical analysis - all good
        } else if (!node.resultData.trend && !node.resultData.priceTarget) {
          // Fallback check for basic technical data
          issues.push('Incomplete technical analysis structure');
          passed = false;
        }
      }
    }

    // Macro analysis checks  
    if (node.componentType === 'macro') {
      if (node.resultData.economicAnalysis || node.resultData.indicators) {
        // Real macro analysis data
        const hasValidMacroData = node.resultData.economicAnalysis || 
                                 node.resultData.indicators ||
                                 node.resultData.analysis;
        if (!hasValidMacroData) {
          issues.push('Missing macro analysis structure');
          passed = false;
        }
      } else if (!node.resultData.economicOutlook) {
        issues.push('No macro analysis data found');
        passed = false;
      }
    }

    // Check for required fields
    if (!node.dataSources || node.dataSources.length === 0) {
      issues.push('No data sources provided');
      passed = false;
    }

    // Verify signature
    if (!dkgManager.verifyNodeSignature(node)) {
      issues.push('Invalid node signature');
      passed = false;
    }

    return { passed, issues: issues.length > 0 ? issues : undefined };
  }

  /**
   * Step 2: Causal Auditing - Verify reasoning and initiative
   */
  private performCausalAudit(node: DKGNode): {
    passed: boolean;
    causalChainLength: number;
    initiativeScore: number;
    traceabilityScore: number;
    issues?: string[];
  } {
    const issues: string[] = [];
    let passed = true;

    // Get causal chain
    const causalChain = dkgManager.getCausalChain(node.id);
    const causalChainLength = causalChain.length;

    // Score initiative (0-1 scale)
    let initiativeScore = 0.5; // Base score
    if (node.reasoning && node.reasoning.length > 50) {
      initiativeScore += 0.2; // Bonus for detailed reasoning
    }
    if (node.dataSources.length > 1) {
      initiativeScore += 0.2; // Bonus for multiple data sources
    }
    if (node.parentNodes && node.parentNodes.length > 0) {
      initiativeScore += 0.1; // Bonus for building on previous work
    }
    initiativeScore = Math.min(1.0, initiativeScore);

    // Score traceability (0-1 scale)
    let traceabilityScore = 0.3; // Base score
    if (node.dataSources.length > 0) {
      traceabilityScore += 0.3; // Bonus for data sources
    }
    if (node.reasoning) {
      traceabilityScore += 0.2; // Bonus for reasoning
    }
    if (dkgManager.verifyNodeSignature(node)) {
      traceabilityScore += 0.2; // Bonus for valid signature
    }
    traceabilityScore = Math.min(1.0, traceabilityScore);

    // Check for minimum standards
    if (initiativeScore < 0.3) {
      issues.push('Low initiative score - agent may not have taken sufficient meaningful actions');
      passed = false;
    }
    if (traceabilityScore < 0.4) {
      issues.push('Low traceability score - insufficient provenance information');
      passed = false;
    }

    return {
      passed,
      causalChainLength,
      initiativeScore,
      traceabilityScore,
      issues: issues.length > 0 ? issues : undefined
    };
  }

  /**
   * Generate score vector based on verification results and real OpenAI data
   */
  private generateScoreVector(
    node: DKGNode,
    endResultCheck: { passed: boolean; issues?: string[] },
    causalAudit: { passed: boolean; initiativeScore: number; traceabilityScore: number; issues?: string[] }
  ): ScoreVector {
    // Extract real data metrics from OpenAI response
    const realDataMetrics = this.extractRealDataMetrics(node);
    
    // Calculate accuracy based on real data quality and structure
    let accuracy = this.calculateAccuracyFromRealData(node, endResultCheck, realDataMetrics);
    
    // Calculate completeness based on actual content depth and breadth
    let completeness = this.calculateCompletenessFromRealData(node, realDataMetrics);
    
    // Use causal audit traceability score (already real)
    let causality = causalAudit.traceabilityScore;
    
    // Calculate timeliness from actual response time
    let timeliness = this.calculateTimeliness(node);
    
    // Calculate originality from content uniqueness and depth
    let originality = this.calculateOriginalityFromRealData(node, realDataMetrics);
    
    // Calculate trustworthiness from verification results and data consistency
    let trustworthiness = this.calculateTrustworthinessFromRealData(node, endResultCheck, causalAudit, realDataMetrics);
    
    // Calculate confidence from OpenAI confidence scores and verification consistency
    let confidence = this.calculateConfidenceFromRealData(node, endResultCheck, causalAudit, realDataMetrics);

    // Apply penalties for issues (but smaller impact since we're using real metrics)
    const totalIssues = (endResultCheck.issues?.length || 0) + (causalAudit.issues?.length || 0);
    const penalty = Math.min(0.15, totalIssues * 0.05); // Reduced penalty since real data is more reliable
    
    accuracy = Math.max(0.1, accuracy - penalty);
    completeness = Math.max(0.1, completeness - penalty);
    trustworthiness = Math.max(0.1, trustworthiness - penalty);

    return {
      accuracy: Math.round(accuracy * 100) / 100,
      completeness: Math.round(completeness * 100) / 100,
      causality: Math.round(causality * 100) / 100,
      timeliness: Math.round(timeliness * 100) / 100,
      originality: Math.round(originality * 100) / 100,
      trustworthiness: Math.round(trustworthiness * 100) / 100,
      confidence: Math.round(confidence * 100) / 100
    };
  }

  /**
   * Calculate timeliness score based on when the node was created
   */
  private calculateTimeliness(node: DKGNode): number {
    const nodeTime = new Date(node.timestamp);
    const now = new Date();
    const ageMinutes = (now.getTime() - nodeTime.getTime()) / (1000 * 60);
    
    // Assume optimal response time is within 5 minutes
    if (ageMinutes <= 5) return 1.0;
    if (ageMinutes <= 15) return 0.8;
    if (ageMinutes <= 30) return 0.6;
    if (ageMinutes <= 60) return 0.4;
    return 0.2;
  }

  /**
   * Extract real data metrics from OpenAI response
   */
  private extractRealDataMetrics(node: DKGNode): any {
    const data = node.resultData;
    
    return {
      // Cost and token metrics from real OpenAI usage
      tokenCount: data.costInfo?.totalTokens || 0,
      inputTokens: data.costInfo?.inputTokens || 0,
      outputTokens: data.costInfo?.outputTokens || 0,
      apiCost: data.costInfo?.totalCost || 0,
      duration: data.costInfo?.duration || 0,
      
      // Content depth metrics
      contentLength: JSON.stringify(data).length,
      structureDepth: this.calculateObjectDepth(data),
      fieldCount: this.countDataFields(data),
      
      // OpenAI confidence if available
      openaiConfidence: data.confidenceLevel || data.confidence || null,
      
      // Analysis quality indicators
      hasDetailedAnalysis: this.hasDetailedAnalysis(data),
      hasNumericData: this.hasNumericData(data),
      hasStructuredOutput: this.hasStructuredOutput(data),
      
      // Component-specific metrics
      componentSpecificMetrics: this.getComponentSpecificMetrics(data, node.componentType || '')
    };
  }

  /**
   * Calculate accuracy based on real OpenAI data quality
   */
  private calculateAccuracyFromRealData(
    node: DKGNode, 
    endResultCheck: { passed: boolean; issues?: string[] },
    metrics: any
  ): number {
    let accuracy = 0.5; // Base score
    
    // OpenAI confidence score (if available)
    if (metrics.openaiConfidence) {
      accuracy += (metrics.openaiConfidence / 10) * 0.3; // Scale to 0-0.3
    }
    
    // Content quality indicators
    if (metrics.hasDetailedAnalysis) accuracy += 0.15;
    if (metrics.hasNumericData) accuracy += 0.1;
    if (metrics.hasStructuredOutput) accuracy += 0.1;
    
    // Token usage indicates thoroughness
    if (metrics.outputTokens > 500) accuracy += 0.1;
    if (metrics.outputTokens > 1000) accuracy += 0.1;
    
    // End result check
    if (endResultCheck.passed) accuracy += 0.2;
    
    return Math.max(0.1, Math.min(1.0, accuracy));
  }

  /**
   * Calculate completeness based on real content analysis
   */
  private calculateCompletenessFromRealData(node: DKGNode, metrics: any): number {
    let completeness = 0.3; // Base score
    
    // Content depth and breadth
    completeness += Math.min(0.2, metrics.structureDepth * 0.05);
    completeness += Math.min(0.2, metrics.fieldCount * 0.01);
    
    // Token count indicates thoroughness
    if (metrics.outputTokens > 800) completeness += 0.15;
    if (metrics.outputTokens > 1500) completeness += 0.1;
    
    // Component-specific completeness
    completeness += this.assessComponentCompleteness(node, metrics);
    
    // Data sources
    completeness += Math.min(0.1, node.dataSources.length * 0.05);
    
    return Math.max(0.1, Math.min(1.0, completeness));
  }

  /**
   * Calculate originality from content uniqueness and depth
   */
  private calculateOriginalityFromRealData(node: DKGNode, metrics: any): number {
    let originality = 0.4; // Base score
    
    // High token output suggests more original content
    if (metrics.outputTokens > 1000) originality += 0.2;
    if (metrics.outputTokens > 2000) originality += 0.1;
    
    // Complex structure suggests original analysis
    if (metrics.structureDepth > 3) originality += 0.15;
    
    // Component-specific originality
    originality += this.assessComponentOriginality(node, metrics);
    
    // Multiple data sources suggest original synthesis
    if (node.dataSources.length > 2) originality += 0.1;
    
    return Math.max(0.1, Math.min(1.0, originality));
  }

  /**
   * Calculate trustworthiness from real data consistency
   */
  private calculateTrustworthinessFromRealData(
    node: DKGNode,
    endResultCheck: { passed: boolean; issues?: string[] },
    causalAudit: { passed: boolean; issues?: string[] },
    metrics: any
  ): number {
    let trustworthiness = 0.3; // Base score
    
    // Verification results
    if (endResultCheck.passed) trustworthiness += 0.25;
    if (causalAudit.passed) trustworthiness += 0.2;
    
    // OpenAI confidence
    if (metrics.openaiConfidence && metrics.openaiConfidence > 7) {
      trustworthiness += 0.15;
    }
    
    // Cost/token ratio suggests legitimate processing
    if (metrics.apiCost > 0 && metrics.tokenCount > 0) {
      trustworthiness += 0.1;
    }
    
    // Structured output suggests reliable processing
    if (metrics.hasStructuredOutput) trustworthiness += 0.1;
    
    return Math.max(0.1, Math.min(1.0, trustworthiness));
  }

  /**
   * Calculate confidence from real OpenAI metrics
   */
  private calculateConfidenceFromRealData(
    node: DKGNode,
    endResultCheck: { passed: boolean; issues?: string[] },
    causalAudit: { passed: boolean; issues?: string[] },
    metrics: any
  ): number {
    let confidence = 0.4; // Base confidence
    
    // Use OpenAI confidence if available
    if (metrics.openaiConfidence) {
      confidence += (metrics.openaiConfidence / 10) * 0.3;
    }
    
    // Verification results
    if (endResultCheck.passed) confidence += 0.15;
    if (causalAudit.passed) confidence += 0.15;
    
    // High token usage suggests thorough analysis
    if (metrics.outputTokens > 1000) confidence += 0.1;
    
    // Reduce confidence for issues
    const totalIssues = (endResultCheck.issues?.length || 0) + (causalAudit.issues?.length || 0);
    confidence -= totalIssues * 0.03;
    
    return Math.max(0.1, Math.min(1.0, confidence));
  }

  // Helper methods for real data analysis
  private calculateObjectDepth(obj: any, depth = 0): number {
    if (typeof obj !== 'object' || obj === null) return depth;
    
    let maxDepth = depth;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const currentDepth = this.calculateObjectDepth(obj[key], depth + 1);
        maxDepth = Math.max(maxDepth, currentDepth);
      }
    }
    return maxDepth;
  }

  private countDataFields(obj: any): number {
    if (typeof obj !== 'object' || obj === null) return 0;
    
    let count = 0;
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        count++;
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          count += this.countDataFields(obj[key]);
        }
      }
    }
    return count;
  }

  private hasDetailedAnalysis(data: any): boolean {
    const analysisFields = ['analysis', 'technicalAnalysis', 'sentimentAnalysis', 'economicAnalysis'];
    return analysisFields.some(field => data[field] && typeof data[field] === 'object');
  }

  private hasNumericData(data: any): boolean {
    const dataStr = JSON.stringify(data);
    const numericMatches = dataStr.match(/:\s*\d+(\.\d+)?/g);
    return Boolean(numericMatches && numericMatches.length > 5);
  }

  private hasStructuredOutput(data: any): boolean {
    return typeof data === 'object' && Object.keys(data).length > 3;
  }

  private getComponentSpecificMetrics(data: any, componentType: string): any {
    switch (componentType) {
      case 'sentiment':
        return {
          hasSentimentScore: Boolean(data.sentiment || data.sentimentAnalysis),
          hasConfidenceScore: Boolean(data.confidence || data.confidenceLevel),
          hasRecommendations: Boolean(data.recommendations)
        };
      case 'technical':
        return {
          hasTechnicalIndicators: Boolean(data.technicalAnalysis || data.indicators),
          hasSignals: Boolean(data.tradingSignals || data.buySignals),
          hasPriceTargets: Boolean(data.priceTarget || data.riskParameters)
        };
      case 'macro':
        return {
          hasEconomicData: Boolean(data.indicators || data.economicAnalysis),
          hasAnalysis: Boolean(data.analysis || data.recommendations),
          hasPolicyAnalysis: Boolean(data.policyStance || data.rateTrajectory)
        };
      default:
        return {};
    }
  }

  private assessComponentCompleteness(node: DKGNode, metrics: any): number {
    const componentMetrics = metrics.componentSpecificMetrics;
    let bonus = 0;
    
    switch (node.componentType) {
      case 'sentiment':
        if (componentMetrics.hasSentimentScore) bonus += 0.1;
        if (componentMetrics.hasConfidenceScore) bonus += 0.05;
        if (componentMetrics.hasRecommendations) bonus += 0.05;
        break;
      case 'technical':
        if (componentMetrics.hasTechnicalIndicators) bonus += 0.1;
        if (componentMetrics.hasSignals) bonus += 0.05;
        if (componentMetrics.hasPriceTargets) bonus += 0.05;
        break;
      case 'macro':
        if (componentMetrics.hasEconomicData) bonus += 0.1;
        if (componentMetrics.hasAnalysis) bonus += 0.05;
        if (componentMetrics.hasPolicyAnalysis) bonus += 0.05;
        break;
    }
    
    return bonus;
  }

  private assessComponentOriginality(node: DKGNode, metrics: any): number {
    // Higher originality for more detailed, specific analysis
    let bonus = 0;
    
    if (metrics.outputTokens > 1500) bonus += 0.1;
    if (metrics.structureDepth > 4) bonus += 0.05;
    
    return bonus;
  }

  /**
   * Generate human-readable feedback
   */
  private generateFeedback(
    node: DKGNode,
    endResultCheck: { passed: boolean; issues?: string[] },
    causalAudit: { passed: boolean; initiativeScore: number; traceabilityScore: number; issues?: string[] },
    scoreVector: ScoreVector
  ): string {
    const feedback: string[] = [];
    
    if (endResultCheck.passed && causalAudit.passed) {
      feedback.push('✅ Work meets quality standards');
    }
    
    if (causalAudit.initiativeScore > 0.8) {
      feedback.push('🌟 Excellent initiative and reasoning');
    }
    
    if (scoreVector.accuracy > 0.9) {
      feedback.push('🎯 High accuracy in results');
    }
    
    if (endResultCheck.issues) {
      feedback.push(`❌ End result issues: ${endResultCheck.issues.join(', ')}`);
    }
    
    if (causalAudit.issues) {
      feedback.push(`⚠️ Causal audit issues: ${causalAudit.issues.join(', ')}`);
    }
    
    return feedback.join(' | ');
  }

  private generateId(): string {
    return 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private createErrorResponse(originalMessage: A2AMessage, error: Error): A2AMessage {
    return {
      id: this.generateId(),
      type: 'error' as any,
      timestamp: new Date(),
      source: this.identity,
      target: originalMessage.source,
      payload: {
        action: 'verification_error',
        data: {
          error: error.message,
          originalAction: originalMessage.payload.action
        }
      },
      metadata: {
        responseToMessageId: originalMessage.id
      }
    };
  }
} 