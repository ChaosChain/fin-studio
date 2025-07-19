'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface VerificationResult {
  verifierId: string;
  nodeId: string;
  passed: boolean;
  score: number;
  criteria: {
    accuracy: number;
    completeness: number;
    causality: number;
    timeliness: number;
    originality: number;
    trustworthiness: number;
    confidence: number;
  };
  reasoning: string;
  timestamp: string;
  duration: number;
}

interface VerifierData {
  verifierId: string;
  verifierName: string;
  totalVerifications: number;
  successRate: number;
  averageScore: number;
  specialties: string[];
  status: 'active' | 'idle' | 'verifying';
  currentTask?: string;
  reputation: number;
  verifications: VerificationResult[];
}

interface VerifierNetworkVisualizerProps {
  consensusData?: any[];
  refreshTrigger?: number;
}

export default function VerifierNetworkVisualizer({ consensusData = [], refreshTrigger = 0 }: VerifierNetworkVisualizerProps) {
  const [verifiers, setVerifiers] = useState<VerifierData[]>([]);
  const [selectedVerifier, setSelectedVerifier] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Generate mock verifier data based on consensus data
  useEffect(() => {
    generateVerifierData();
  }, [consensusData, refreshTrigger]);

  const generateVerifierData = () => {
    const verifierIds = ['verifier-1', 'verifier-2', 'verifier-3', 'verifier-4'];
    const verifierData: VerifierData[] = verifierIds.map((id, index) => {
      const verifications: VerificationResult[] = [];
      
      // Generate verifications from consensus data
      consensusData.forEach(consensus => {
        if (consensus.verifications && consensus.verifications.length > index) {
          const verification = consensus.verifications[index];
          verifications.push({
            verifierId: id,
            nodeId: consensus.nodeId,
            passed: verification.passed,
            score: verification.score,
            criteria: verification.criteria || {
              accuracy: Math.random() * 0.3 + 0.7,
              completeness: Math.random() * 0.3 + 0.7,
              causality: Math.random() * 0.3 + 0.7,
              timeliness: Math.random() * 0.3 + 0.7,
              originality: Math.random() * 0.3 + 0.7,
              trustworthiness: Math.random() * 0.3 + 0.7,
              confidence: Math.random() * 0.3 + 0.7,
            },
            reasoning: verification.reasoning || `Verification completed for ${consensus.componentType} analysis`,
            timestamp: new Date().toISOString(),
            duration: Math.floor(Math.random() * 5000) + 1000,
          });
        }
      });

      const successRate = verifications.length > 0 ? 
        verifications.filter(v => v.passed).length / verifications.length : 0.85 + Math.random() * 0.1;
      
      const averageScore = verifications.length > 0 ?
        verifications.reduce((sum, v) => sum + v.score, 0) / verifications.length : 0.8 + Math.random() * 0.15;

      return {
        verifierId: id,
        verifierName: `Verifier Agent ${index + 1}`,
        totalVerifications: verifications.length || Math.floor(Math.random() * 50) + 20,
        successRate,
        averageScore,
        specialties: getVerifierSpecialties(index),
        status: verifications.length > 0 ? 'active' : 'idle',
        currentTask: verifications.length > 0 ? `Verifying ${consensusData[0]?.componentType} analysis` : undefined,
        reputation: 0.75 + Math.random() * 0.2,
        verifications,
      };
    });

    setVerifiers(verifierData);
  };

  const getVerifierSpecialties = (index: number): string[] => {
    const specialties = [
      ['End-Result Verification', 'Data Accuracy', 'Output Validation'],
      ['Causal Chain Auditing', 'Logic Verification', 'Dependency Analysis'],
      ['Content Quality', 'Completeness Check', 'Format Validation'],
      ['Timeliness Assessment', 'Freshness Verification', 'Relevance Check'],
    ];
    return specialties[index] || ['General Verification'];
  };

  const getVerifierColor = (index: number) => {
    const colors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b'];
    return colors[index] || '#6b7280';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'verifying': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'idle': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderNetworkView = () => (
    <div className="relative w-full h-[600px] bg-white rounded-xl border shadow-sm overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full">
          <defs>
            <pattern id="verifier-grid" width="30" height="30" patternUnits="userSpaceOnUse">
              <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#verifier-grid)" />
        </svg>
      </div>

      {/* Central consensus node */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
        <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full shadow-xl border-4 border-white flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="text-center mt-2">
          <div className="text-sm font-semibold text-gray-800">Consensus</div>
          <div className="text-xs text-gray-600">Engine</div>
        </div>
      </div>

      {/* Verifier nodes in circle */}
      {verifiers.map((verifier, index) => {
        const angle = (index / verifiers.length) * 2 * Math.PI - Math.PI / 2;
        const radius = 180;
        const x = 300 + Math.cos(angle) * radius;
        const y = 300 + Math.sin(angle) * radius;
        const isSelected = selectedVerifier === verifier.verifierId;

        return (
          <div
            key={verifier.verifierId}
            className={`absolute cursor-pointer transition-all duration-300 z-10 ${
              isSelected ? 'scale-110' : 'hover:scale-105'
            }`}
            style={{ left: x - 40, top: y - 40 }}
            onClick={() => setSelectedVerifier(
              selectedVerifier === verifier.verifierId ? null : verifier.verifierId
            )}
          >
            {/* Connection line to center */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ width: '600px', height: '600px', left: '-280px', top: '-280px' }}>
              <line
                x1="300"
                y1="300"
                x2={x}
                y2={y}
                stroke={getVerifierColor(index)}
                strokeWidth="2"
                strokeDasharray={verifier.status === 'active' ? 'none' : '5,5'}
                opacity="0.6"
              />
            </svg>

            {/* Verifier node */}
            <div 
              className={`w-16 h-16 rounded-full shadow-lg border-3 border-white flex items-center justify-center relative ${
                isSelected ? 'ring-4 ring-blue-400 ring-opacity-60' : ''
              }`}
              style={{ 
                background: `linear-gradient(135deg, ${getVerifierColor(index)}, ${getVerifierColor(index)}dd)`
              }}
            >
              {/* Status indicator */}
              <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                verifier.status === 'active' ? 'bg-green-500' : 
                verifier.status === 'verifying' ? 'bg-blue-500 animate-pulse' : 'bg-gray-400'
              }`} />
              
              <span className="text-white text-sm font-bold">V{index + 1}</span>
            </div>

            {/* Verifier label */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 text-center">
              <div className="text-xs font-semibold text-gray-800 bg-white px-2 py-1 rounded-md shadow-sm border">
                Verifier {index + 1}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {(verifier.successRate * 100).toFixed(0)}% success
              </div>
            </div>

            {/* Verification activity indicator */}
            {verifier.verifications.length > 0 && (
              <div className="absolute -bottom-2 -right-2">
                <div className="w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-white text-xs font-bold">{verifier.verifications.length}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Empty state */}
      {verifiers.every(v => v.verifications.length === 0) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white bg-opacity-90 z-30">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="text-gray-600 font-medium mb-2">Verifier Network Ready</div>
            <div className="text-gray-500 text-sm max-w-xs">
              Run an analysis to see verifier agents perform consensus verification
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderTimelineView = () => (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {verifiers.flatMap(verifier => 
        verifier.verifications.map(verification => ({ ...verification, verifierName: verifier.verifierName }))
      )
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-center p-6">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-gray-600 font-medium mb-2">Verification Timeline</div>
          <div className="text-gray-500 text-sm">
            Verification activities will appear here showing the chronological order of consensus checks
          </div>
        </div>
      ) : (
        verifiers.flatMap(verifier => 
          verifier.verifications.map(verification => ({ ...verification, verifierName: verifier.verifierName }))
        )
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map((verification, index) => (
          <div key={`${verification.verifierId}-${verification.nodeId}-${index}`} className="flex items-start space-x-4">
            {/* Timeline marker */}
            <div className="flex flex-col items-center">
              <div 
                className={`w-4 h-4 rounded-full border-2 border-white shadow-lg ${
                  verification.passed ? 'bg-green-500' : 'bg-red-500'
                }`}
              />
              {index < verifiers.flatMap(v => v.verifications).length - 1 && (
                <div className="w-0.5 h-16 bg-gray-300 mt-2" />
              )}
            </div>
            
            {/* Timeline content */}
            <div className="flex-1 p-4 border rounded-lg hover:border-gray-300 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <Badge className={verification.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {verification.passed ? 'PASSED' : 'FAILED'}
                  </Badge>
                  <Badge variant="outline">
                    {verification.verifierName}
                  </Badge>
                  <Badge variant="outline">
                    Score: {(verification.score * 100).toFixed(1)}%
                  </Badge>
                </div>
                <span className="text-xs text-gray-500">
                  {new Date(verification.timestamp).toLocaleString()}
                </span>
              </div>
              
              <div className="text-sm text-gray-800 mb-2">
                Node: {verification.nodeId.slice(-8)}
              </div>
              
              <div className="text-sm text-gray-600">
                {verification.reasoning}
              </div>
              
              <div className="mt-2 text-xs text-gray-500">
                Duration: {(verification.duration / 1000).toFixed(1)}s
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderDetailsView = () => {
    const selectedVerifierData = verifiers.find(v => v.verifierId === selectedVerifier);
    
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verifier cards */}
        <div className="space-y-4">
          {verifiers.map((verifier, index) => (
            <Card 
              key={verifier.verifierId}
              className={`cursor-pointer transition-all duration-200 ${
                selectedVerifier === verifier.verifierId ? 'ring-2 ring-blue-400 bg-blue-50' : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedVerifier(
                selectedVerifier === verifier.verifierId ? null : verifier.verifierId
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center space-x-2">
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ backgroundColor: getVerifierColor(index) }}
                    >
                      V{index + 1}
                    </div>
                    <span>{verifier.verifierName}</span>
                  </CardTitle>
                  <Badge className={getStatusColor(verifier.status)}>
                    {verifier.status.toUpperCase()}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Success Rate:</span>
                    <div className="font-semibold text-green-600">
                      {(verifier.successRate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Avg Score:</span>
                    <div className="font-semibold text-blue-600">
                      {(verifier.averageScore * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-600">Verifications:</span>
                    <div className="font-semibold">{verifier.totalVerifications}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Reputation:</span>
                    <div className="font-semibold text-purple-600">
                      {verifier.reputation.toFixed(3)}
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="text-sm text-gray-600 mb-2">Specialties:</div>
                  <div className="flex flex-wrap gap-1">
                    {verifier.specialties.map((specialty, idx) => (
                      <Badge key={idx} variant="outline" className="text-xs">
                        {specialty}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {verifier.currentTask && (
                  <div className="mt-3 p-2 bg-blue-50 rounded text-sm">
                    <span className="text-blue-800 font-medium">Current Task:</span>
                    <div className="text-blue-700">{verifier.currentTask}</div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Selected verifier details */}
        <div>
          {selectedVerifierData ? (
            <Card>
              <CardHeader>
                <CardTitle>Verification Details - {selectedVerifierData.verifierName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {selectedVerifierData.verifications.length > 0 ? (
                  selectedVerifierData.verifications.map((verification, index) => (
                    <div key={index} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={verification.passed ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {verification.passed ? 'PASSED' : 'FAILED'}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          Score: {(verification.score * 100).toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="text-sm mb-3">
                        <strong>Node:</strong> {verification.nodeId.slice(-8)}
                      </div>
                      
                      <div className="text-sm mb-3">
                        <strong>Reasoning:</strong> {verification.reasoning}
                      </div>
                      
                      <Separator />
                      
                      <div className="mt-3">
                        <div className="text-sm font-medium mb-2">Verification Criteria:</div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {Object.entries(verification.criteria).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="capitalize text-gray-600">{key}:</span>
                              <span className={`font-medium ${value > 0.8 ? 'text-green-600' : value > 0.6 ? 'text-yellow-600' : 'text-red-600'}`}>
                                {(value * 100).toFixed(0)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    No verifications yet for this verifier
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-center p-6 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="text-gray-600 font-medium mb-2">Select a Verifier</div>
              <div className="text-gray-500 text-sm">
                Click on a verifier card to see detailed verification information
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-teal-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="tracking-tight text-xl font-bold text-gray-900">Verifier Network</h3>
                <div className="flex items-center space-x-3 mt-1">
                  <Badge className="bg-green-100 text-green-800 border-green-200">
                    {verifiers.length} verifiers
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                    {verifiers.reduce((sum, v) => sum + v.verifications.length, 0)} verifications
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {renderDetailsView()}
          
          {/* Legend */}
          <div className="mt-6 bg-gray-50 rounded-lg p-4 border">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <div className="w-4 h-4 bg-green-600 rounded mr-2"></div>
                  Verifier Status
                </h5>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-gray-700">Active</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                    <span className="text-gray-700">Verifying</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-gray-700">Idle</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                  Verification Types
                </h5>
                <div className="space-y-1 text-sm text-gray-700">
                  <div>• End-Result Verification</div>
                  <div>• Causal Chain Auditing</div>
                  <div>• Content Quality Check</div>
                  <div>• Timeliness Assessment</div>
                </div>
              </div>
              
              <div>
                <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                  <div className="w-4 h-4 bg-purple-600 rounded mr-2"></div>
                  Consensus Criteria
                </h5>
                <div className="space-y-1 text-sm text-gray-700">
                  <div>• Accuracy & Completeness</div>
                  <div>• Causality & Logic</div>
                  <div>• Trustworthiness</div>
                  <div>• Confidence Level</div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 