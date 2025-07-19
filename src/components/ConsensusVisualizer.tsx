'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ScoreVector {
  accuracy: number;
  completeness: number;
  causality: number;
  timeliness: number;
  originality: number;
  trustworthiness: number;
  confidence: number;
}

interface VerificationResult {
  nodeId: string;
  agentId: string;
  verifierId: string;
  scoreVector: ScoreVector;
  feedback: string;
  endResultCheck: { passed: boolean; issues?: string[] };
  causalAudit: { passed: boolean; issues?: string[] };
  timestamp: string;
}

interface ConsensusData {
  taskId: string;
  componentType: string;
  nodeId: string;
  agentId: string;
  verifications: VerificationResult[];
  consensusReached: boolean;
  averageScore: number;
  passedCount: number;
  totalVerifiers: number;
  realDataMetrics: {
    tokenCount: number;
    apiCost: number;
    duration: number;
    contentQuality: string;
    openaiConfidence: number;
  };
}

interface ConsensusVisualizerProps {
  consensusData: ConsensusData[];
  isActive: boolean;
}

export function ConsensusVisualizer({ consensusData, isActive }: ConsensusVisualizerProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [animationPhase, setAnimationPhase] = useState<'verification' | 'scoring' | 'consensus'>('verification');
  const [expandedScore, setExpandedScore] = useState<string | null>(null);

  useEffect(() => {
    if (isActive && consensusData.length > 0) {
      const phases = ['verification', 'scoring', 'consensus'] as const;
      let phaseIndex = 0;
      
      const interval = setInterval(() => {
        phaseIndex = (phaseIndex + 1) % phases.length;
        setAnimationPhase(phases[phaseIndex]);
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isActive, consensusData]);

  const getScoreColor = (score: number): string => {
    if (score >= 0.8) return 'text-green-600 bg-green-50';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getConsensusStatus = (data: ConsensusData) => {
    if (data.consensusReached) {
      return { status: 'CONSENSUS REACHED', color: 'bg-green-100 text-green-800' };
    }
    return { status: 'CONSENSUS FAILED', color: 'bg-red-100 text-red-800' };
  };

  const renderScoreBreakdown = (scoreVector: ScoreVector) => {
    const scores = [
      { 
        name: 'Accuracy', 
        value: scoreVector.accuracy, 
        icon: 'ACC',
        description: 'Measures how correct and precise the analysis results are compared to expected standards',
        details: 'Evaluates data correctness, calculation accuracy, and factual reliability'
      },
      { 
        name: 'Completeness', 
        value: scoreVector.completeness, 
        icon: 'COM',
        description: 'Assesses whether all required analysis components and data points are included',
        details: 'Checks for missing data, incomplete reasoning, and comprehensive coverage'
      },
      { 
        name: 'Causality', 
        value: scoreVector.causality, 
        icon: 'CAU',
        description: 'Verifies logical cause-and-effect relationships in the analysis chain',
        details: 'Validates reasoning flow, dependency chains, and logical conclusions'
      },
      { 
        name: 'Timeliness', 
        value: scoreVector.timeliness, 
        icon: 'TIM',
        description: 'Evaluates the freshness and relevance of data sources and analysis',
        details: 'Measures data recency, market relevance, and temporal appropriateness'
      },
      { 
        name: 'Originality', 
        value: scoreVector.originality, 
        icon: 'ORI',
        description: 'Assesses unique insights and novel analytical perspectives provided',
        details: 'Evaluates creative thinking, unique viewpoints, and innovative analysis'
      },
      { 
        name: 'Trustworthiness', 
        value: scoreVector.trustworthiness, 
        icon: 'TRU',
        description: 'Measures reliability of sources, methods, and analytical approach',
        details: 'Validates source credibility, methodology soundness, and bias assessment'
      },
      { 
        name: 'Confidence', 
        value: scoreVector.confidence, 
        icon: 'CON',
        description: 'Indicates the verifier\'s confidence level in the overall analysis quality',
        details: 'Represents overall assessment certainty and result reliability'
      }
    ];

    // Debug logging
    console.log('ConsensusVisualizer - Current expandedScore:', expandedScore);

    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-semibold text-gray-800">Verification Criteria</h4>
          <div className="text-xs text-gray-500 bg-yellow-100 px-2 py-1 rounded border border-yellow-200">
            👆 Click scores for details
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {scores.map(score => (
            <div key={score.name} className="relative">
              <div 
                className={`flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all duration-200 ${
                  expandedScore === score.name ? 'border-blue-400 bg-blue-50 shadow-md' : 'border-gray-200 hover:shadow-sm'
                }`}
                onClick={() => {
                  console.log('Score clicked:', score.name, 'Current expanded:', expandedScore);
                  setExpandedScore(expandedScore === score.name ? null : score.name);
                }}
                title="Click for detailed explanation"
              >
                <span className="text-sm font-medium">
                  <span className="text-xs bg-gray-200 px-1.5 py-0.5 rounded mr-2 font-mono">{score.icon}</span>
                  {score.name}
                </span>
                <div className="flex items-center space-x-2">
                  <Badge className={getScoreColor(score.value)}>
                    {(score.value * 100).toFixed(0)}%
                  </Badge>
                  <svg 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      expandedScore === score.name ? 'rotate-180' : ''
                    }`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {expandedScore === score.name && (
                <div className="absolute top-full left-0 right-0 z-[70] mt-2 p-4 bg-white border-2 border-blue-300 rounded-lg shadow-2xl">
                  <div className="text-sm space-y-3">
                    <div>
                      <span className="font-semibold text-gray-800">What it measures:</span>
                      <p className="text-gray-600 mt-1 leading-relaxed">{score.description}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-800">Evaluation criteria:</span>
                      <p className="text-gray-600 mt-1 leading-relaxed">{score.details}</p>
                    </div>
                    <div className="pt-2 border-t">
                      <span className="font-semibold text-gray-800">Score interpretation:</span>
                      <div className="mt-2 text-xs space-y-1.5">
                        <div className="flex justify-between p-1 rounded bg-green-50">
                          <span>90-100%:</span>
                          <span className="text-green-600 font-medium">Excellent</span>
                        </div>
                        <div className="flex justify-between p-1 rounded bg-blue-50">
                          <span>80-89%:</span>
                          <span className="text-blue-600 font-medium">Good</span>
                        </div>
                        <div className="flex justify-between p-1 rounded bg-yellow-50">
                          <span>70-79%:</span>
                          <span className="text-yellow-600 font-medium">Fair</span>
                        </div>
                        <div className="flex justify-between p-1 rounded bg-red-50">
                          <span>Below 70%:</span>
                          <span className="text-red-600 font-medium">Needs Improvement</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedScore(null);
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderVerificationFlow = (data: ConsensusData) => {
    return (
      <div className="space-y-4">
        {/* Real Data Metrics */}
                  <Card className="border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">DATA</span>
                Real OpenAI Data Metrics
              </CardTitle>
            </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Tokens:</span> {data.realDataMetrics.tokenCount.toLocaleString()}
              </div>
              <div>
                <span className="font-medium">Cost:</span> ${data.realDataMetrics.apiCost.toFixed(4)}
              </div>
              <div>
                <span className="font-medium">Duration:</span> {(data.realDataMetrics.duration / 1000).toFixed(1)}s
              </div>
              <div>
                <span className="font-medium">AI Confidence:</span> {data.realDataMetrics.openaiConfidence}/10
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Verifier Analysis */}
        <div className="grid grid-cols-1 gap-3">
          {data.verifications.map((verification, index) => (
            <Card 
              key={verification.verifierId}
              className={`border-2 transition-all duration-500 ${
                animationPhase === 'verification' ? 'border-blue-400 shadow-md' : 'border-gray-200'
              }`}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs mr-2">V{verification.verifierId}</span>
                    Verifier {verification.verifierId}
                  </CardTitle>
                  <div className="flex gap-2">
                    <Badge className={verification.endResultCheck.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      End Check: {verification.endResultCheck.passed ? 'PASS' : 'FAIL'}
                    </Badge>
                    <Badge className={verification.causalAudit.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      Causal: {verification.causalAudit.passed ? 'PASS' : 'FAIL'}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {animationPhase === 'scoring' && (
                  <div className="animate-pulse">
                    {renderScoreBreakdown(verification.scoreVector)}
                  </div>
                )}
                {animationPhase !== 'scoring' && renderScoreBreakdown(verification.scoreVector)}
                
                {verification.feedback && (
                  <div className="mt-3 p-3 bg-gray-50 rounded border-l-4 border-blue-400">
                    <div className="flex items-start space-x-2">
                      <div className="flex-shrink-0 mt-0.5">
                        <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-blue-800 mb-1">Verifier Feedback:</div>
                        <div className="text-xs text-gray-700 leading-relaxed">
                          {verification.feedback.split(' | ').map((item, index) => (
                            <div key={index} className="flex items-start space-x-1 mb-1">
                              <span className="text-blue-500 mt-1">•</span>
                              <span>{item.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {verification.endResultCheck.issues && verification.endResultCheck.issues.length > 0 && (
                  <div className="mt-2">
                    <strong className="text-xs text-red-600">Issues Found:</strong>
                    <ul className="text-xs text-red-600 list-disc list-inside">
                      {verification.endResultCheck.issues.map((issue, i) => (
                        <li key={i}>{issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Consensus Process Explanation */}
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">INFO</span>
              Consensus Verification Process
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm space-y-2">
              <p className="text-gray-700">
                <strong>Multi-Criteria Evaluation:</strong> Each verifier evaluates the agent's analysis using 7 different criteria, 
                providing a comprehensive assessment of quality, reliability, and accuracy.
              </p>
              <p className="text-gray-700">
                <strong>Consensus Threshold:</strong> For consensus to be reached, at least 3 out of 4 verifiers must pass the analysis 
                with an average score above 75%.
              </p>
              <p className="text-gray-700">
                <strong>Dual Verification:</strong> Each verifier performs both end-result checking (output validation) and 
                causal auditing (reasoning chain verification).
              </p>
              <div className="mt-3 p-2 bg-white rounded border">
                <div className="text-xs font-semibold text-gray-800 mb-1">Click on any percentage score above to see detailed explanations</div>
                <div className="text-xs text-gray-600">Each criterion has specific evaluation standards and score interpretations</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Consensus Decision */}
        <Card className={`border-2 transition-all duration-1000 ${
          animationPhase === 'consensus' ? 'border-purple-400 shadow-lg' : 'border-gray-200'
        }`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center justify-between">
              <span className="flex items-center">
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs mr-2">CONSENSUS</span>
                Consensus Decision
              </span>
              <Badge className={getConsensusStatus(data).color}>
                {getConsensusStatus(data).status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Verifiers Passed:</span>
                <span className="font-bold">{data.passedCount}/{data.totalVerifiers}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Average Score:</span>
                <span className={`font-bold ${getScoreColor(data.averageScore)}`}>
                  {(data.averageScore * 100).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Quality Threshold:</span>
                <span className="font-bold">≥60%</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Majority Required:</span>
                <span className="font-bold">&gt;50% Pass</span>
              </div>
              
              {/* Consensus Logic Visualization */}
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <div className="text-xs font-medium mb-2">Decision Logic:</div>
                <div className="space-y-1 text-xs">
                  <div className={`flex items-center ${data.passedCount > data.totalVerifiers / 2 ? 'text-green-600' : 'text-red-600'}`}>
                    <span className={`px-1 py-0.5 rounded text-xs mr-2 ${data.passedCount > data.totalVerifiers / 2 ? 'bg-green-100' : 'bg-red-100'}`}>
                      {data.passedCount > data.totalVerifiers / 2 ? 'PASS' : 'FAIL'}
                    </span>
                    Majority Pass: {data.passedCount > data.totalVerifiers / 2 ? 'Yes' : 'No'}
                  </div>
                  <div className={`flex items-center ${data.averageScore >= 0.6 ? 'text-green-600' : 'text-red-600'}`}>
                    <span className={`px-1 py-0.5 rounded text-xs mr-2 ${data.averageScore >= 0.6 ? 'bg-green-100' : 'bg-red-100'}`}>
                      {data.averageScore >= 0.6 ? 'PASS' : 'FAIL'}
                    </span>
                    Quality Score: {data.averageScore >= 0.6 ? 'Above Threshold' : 'Below Threshold'}
                  </div>
                  <div className={`flex items-center font-medium ${data.consensusReached ? 'text-green-600' : 'text-red-600'}`}>
                    <span className={`px-1 py-0.5 rounded text-xs mr-2 ${data.consensusReached ? 'bg-green-100' : 'bg-red-100'}`}>
                      {data.consensusReached ? 'APPROVED' : 'REJECTED'}
                    </span>
                    Final Decision: {data.consensusReached ? 'Payment Released' : 'Payment Withheld'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  if (!consensusData || consensusData.length === 0) {
          return (
        <Card>
          <CardContent className="flex items-center justify-center h-40">
            <div className="text-center text-gray-500">
              <div className="text-4xl mb-2 bg-gray-100 px-4 py-2 rounded">NO DATA</div>
              <div>No consensus data available</div>
            </div>
          </CardContent>
        </Card>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center">
          <span className="bg-gray-100 text-gray-800 px-3 py-1 rounded mr-3">CONSENSUS</span>
          Process Visualization
          {isActive && (
            <div className="ml-3 flex items-center">
              <div className="animate-pulse w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm text-green-600">LIVE</span>
            </div>
          )}
        </h2>
        
        <div className="flex gap-2">
          <Badge className={animationPhase === 'verification' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100'}>
            1. Verification
          </Badge>
          <Badge className={animationPhase === 'scoring' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100'}>
            2. Scoring
          </Badge>
          <Badge className={animationPhase === 'consensus' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100'}>
            3. Consensus
          </Badge>
        </div>
      </div>

      {/* Quick Reference Guide */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-4">
          <div className="text-xs font-semibold text-gray-800 mb-3">Verification Criteria Quick Reference:</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span className="bg-blue-100 px-2 py-1 rounded font-mono">ACC</span>
              <span className="text-gray-700">Data correctness & precision</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-green-100 px-2 py-1 rounded font-mono">COM</span>
              <span className="text-gray-700">Analysis completeness</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-purple-100 px-2 py-1 rounded font-mono">CAU</span>
              <span className="text-gray-700">Logical reasoning flow</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-yellow-100 px-2 py-1 rounded font-mono">TIM</span>
              <span className="text-gray-700">Data freshness & relevance</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-orange-100 px-2 py-1 rounded font-mono">ORI</span>
              <span className="text-gray-700">Unique insights provided</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-teal-100 px-2 py-1 rounded font-mono">TRU</span>
              <span className="text-gray-700">Source reliability</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-indigo-100 px-2 py-1 rounded font-mono">CON</span>
              <span className="text-gray-700">Overall confidence level</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-600 font-medium">💡</span>
              <span className="text-blue-600 font-medium">Click any score for detailed explanations</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {consensusData.map((data, index) => (
          <Card 
            key={data.nodeId}
            className={`cursor-pointer transition-all duration-300 ${
              selectedNode === data.nodeId ? 'ring-2 ring-blue-400' : 'hover:shadow-md'
            }`}
            onClick={() => {
              setSelectedNode(selectedNode === data.nodeId ? null : data.nodeId);
              setExpandedScore(null); // Reset expanded score when switching nodes
            }}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center justify-between">
                <span className="flex items-center">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">
                    {data.componentType.toUpperCase().slice(0, 3)}
                  </span>
                  {data.componentType.charAt(0).toUpperCase() + data.componentType.slice(1)}
                </span>
                <Badge className={getConsensusStatus(data).color}>
                  {data.consensusReached ? 'PASS' : 'FAIL'}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Agent:</span>
                  <span className="font-medium">{data.agentId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Score:</span>
                  <span className={`font-bold ${getScoreColor(data.averageScore)}`}>
                    {(data.averageScore * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Verifiers:</span>
                  <span>{data.passedCount}/{data.totalVerifiers} passed</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed View */}
      {selectedNode && (
        <Card className="border-2 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs mr-2">DETAIL</span>
                Detailed Consensus Analysis
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-gray-500 hover:text-gray-700 px-2 py-1 rounded border"
              >
                CLOSE
              </button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {consensusData
              .filter(data => data.nodeId === selectedNode)
              .map(data => renderVerificationFlow(data))}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 