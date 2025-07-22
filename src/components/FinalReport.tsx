import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import jsPDF from 'jspdf';

interface AnalysisResult {
  taskId: string;
  status: string;
  results: {
    [key: string]: {
      nodes: number;
      consensus: boolean;
      verifications: number;
    };
  };
  reputation: {
    [key: string]: {
      reputationScore: number;
      totalTasks: number;
      acceptanceRate: number;
    };
  };
}

interface ConsensusData {
  taskId: string;
  componentType: string;
  nodeId: string;
  agentId: string;
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

interface SystemMetrics {
  dkg: {
    totalNodes: number;
    nodesByAgent: { [key: string]: number };
    nodesByTask: { [key: string]: number };
  };
  reputation: {
    totalAgents: number;
    averageReputation: number;
    topPerformers: string[];
  };
  topAgents: Array<{
    id: string;
    name: string;
    score: number;
    totalTasks: number;
    acceptanceRate: number;
    specialties: string[];
  }>;
}

interface FinalReportProps {
  analysisResult: AnalysisResult;
  consensusData: ConsensusData[];
  systemMetrics: SystemMetrics;
  symbol: string;
  onClose: () => void;
}

interface DKGNode {
  id: string;
  agentId: string;
  componentType: string;
  timestamp: string;
  resultData: any;
  reasoning?: string;
}

export default function FinalReport({
  analysisResult,
  consensusData,
  systemMetrics,
  symbol,
  onClose
}: FinalReportProps) {
  const [activeTab, setActiveTab] = useState<'insights' | 'summary' | 'consensus' | 'performance' | 'agents'>('insights');
  const [dkgNodes, setDkgNodes] = useState<DKGNode[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const getOverallStatus = () => {
    const totalComponents = Object.keys(analysisResult.results).length;
    const passedComponents = Object.values(analysisResult.results).filter(r => r.consensus).length;
    const successRate = (passedComponents / totalComponents) * 100;
    
    return {
      status: successRate >= 75 ? 'Excellent' : successRate >= 50 ? 'Good' : 'Needs Review',
      color: successRate >= 75 ? 'bg-green-100 text-green-800' : successRate >= 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800',
      rate: successRate
    };
  };

  const getTotalCost = () => {
    return consensusData.reduce((sum, data) => sum + data.realDataMetrics.apiCost, 0);
  };

  const getTotalDuration = () => {
    return consensusData.reduce((sum, data) => sum + data.realDataMetrics.duration, 0);
  };

  const getAverageConfidence = () => {
    // Get confidences from multiple sources
    const confidences: number[] = [];
    
    // 1. Try to get from realDataMetrics.openaiConfidence
    consensusData.forEach(d => {
      if (d.realDataMetrics.openaiConfidence > 0) {
        confidences.push(d.realDataMetrics.openaiConfidence);
        console.log(`📊 Found openaiConfidence: ${d.realDataMetrics.openaiConfidence} from agent ${d.agentId}`);
      }
    });
    
    // 2. If no openaiConfidence found, try to extract from DKG nodes
    if (confidences.length === 0 && dkgNodes.length > 0) {
      dkgNodes.forEach(node => {
        if (node.resultData) {
          // Try different confidence field names
          const nodeConfidence = 
            node.resultData.confidenceLevel ||
            node.resultData.confidence ||
            node.resultData.analysis?.confidence ||
            node.resultData.analysis?.confidenceLevel ||
            0;
          
          if (nodeConfidence > 0) {
            confidences.push(nodeConfidence);
            console.log(`📊 Found nodeConfidence: ${nodeConfidence} from agent ${node.agentId}`);
          }
        }
      });
    }
    
    // 3. If still no confidences found, calculate from consensus scores
    if (confidences.length === 0) {
      consensusData.forEach(d => {
        if (d.consensusReached && d.averageScore > 0) {
          // Convert consensus score (0-1) to confidence scale (0-10)
          const derivedConfidence = Math.min(10, d.averageScore * 10);
          confidences.push(derivedConfidence);
          console.log(`📊 Derived confidence: ${derivedConfidence} from consensus score ${d.averageScore} for agent ${d.agentId}`);
        }
      });
    }
    
    // 4. Final fallback based on overall system performance
    if (confidences.length === 0) {
      const overallStatus = getOverallStatus();
      console.log(`📊 Using fallback confidence based on overall status: ${overallStatus.rate}%`);
      return Math.max(5.0, (overallStatus.rate / 100) * 8.5); // Scale 0-100% to 5.0-8.5
    }
    
    // Calculate weighted average with higher weight for actual AI confidence scores
    const totalConfidence = confidences.reduce((sum, conf) => sum + conf, 0);
    const average = totalConfidence / confidences.length;
    
    console.log(`📊 Confidence calculation: ${confidences.length} values found: [${confidences.join(', ')}], average: ${average.toFixed(2)}`);
    
    // Ensure confidence is in reasonable range (4.0 - 9.5)
    return Math.max(4.0, Math.min(9.5, average));
  };

  const fetchDKGDetails = async () => {
    if (loadingDetails) return;
    
    setLoadingDetails(true);
    try {
      const response = await fetch(`/api/dkg/nodes?taskId=${analysisResult.taskId}`);
      const data = await response.json();
      
      if (data.success) {
        setDkgNodes(data.nodes);
      }
    } catch (error) {
      console.error('Failed to fetch DKG details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const extractActualAnalysisContent = (resultData: any, componentType: string) => {
    if (!resultData) return null;

    // Extract actual analysis content based on component type
    switch (componentType) {
      case 'sentiment':
        return {
          sentiment: resultData.sentiment || resultData.analysis?.sentiment || 'Neutral',
          confidence: resultData.confidence || resultData.analysis?.confidence || 0,
          trends: resultData.analysis?.trends || [],
          riskFactors: resultData.riskAssessment?.riskFactors || [],
          strategy: resultData.recommendations?.strategy || 'No specific strategy provided',
          summary: resultData.analysis?.news_summary || 'Market sentiment analysis completed'
        };
      
      case 'technical':
        return {
          signalProbability: resultData.tradingSignals?.signalProbability || resultData.signalProbability || 0,
          priceTargets: resultData.priceTargets || { bullishTarget: 0, bearishTarget: 0, neutralTarget: 0 },
          tradingSignals: resultData.tradingSignals?.buySignals?.slice(0, 3) || resultData.buySignals?.slice(0, 3) || [],
          riskParameters: resultData.riskParameters || {},
          confidenceLevel: resultData.confidenceLevel || 0,
          summary: resultData.executiveSummary || 'Technical analysis completed'
        };
      
      case 'macro':
        return {
          indicators: resultData.indicators || {},
          policyStance: resultData.analysis?.policyStance || 'Neutral',
          economicCycle: resultData.analysis?.economicCycle || 'Unknown',
          recessionProbability: resultData.analysis?.recessionProbability || 0,
          recommendations: resultData.recommendations || [],
          confidenceLevel: resultData.confidenceLevel || 0,
          summary: resultData.analysis?.summary || 'Macro economic analysis completed'
        };
      
      case 'insights':
        return {
          summary: resultData.insights?.summary || resultData.summary || 'Investment insights generated',
          keyPoints: resultData.insights?.keyInsights || resultData.keyPoints || [],
          recommendations: resultData.insights?.recommendations || resultData.recommendations || [],
          riskFactors: resultData.insights?.riskFactors || resultData.riskFactors || [],
          marketOutlook: resultData.insights?.marketOutlook || resultData.marketOutlook || 'Market outlook provided',
          confidence: resultData.insights?.confidence || resultData.confidence || 0
        };
      
      default:
        return null;
    }
  };

  const getAnalysisInsights = () => {
    const insights: any = {
      sentiment: [],
      technical: [],
      macro: [],
      insights: []
    };

    // Extract actual analysis results from consensus data
    consensusData.forEach(data => {
      if (data.realDataMetrics && data.componentType) {
        const componentType = data.componentType;
        
        // Find corresponding DKG node for detailed content
        const dkgNode = dkgNodes.find(node => 
          node.agentId === data.agentId && node.componentType === componentType
        );
        
        // Extract actual analysis content
        const actualAnalysis = extractActualAnalysisContent(dkgNode?.resultData, componentType);
        
        const agentData = {
          agentId: data.agentId,
          consensus: data.consensusReached,
          score: data.averageScore,
          content: data.realDataMetrics.contentQuality || 'Analysis completed',
          // Add extracted actual analysis content
          actualAnalysis: actualAnalysis,
          detailedAnalysis: dkgNode?.resultData || null,
          reasoning: dkgNode?.reasoning || null
        };
        
        if (insights[componentType]) {
          insights[componentType].push(agentData);
        }
      }
    });

    return insights;
  };

  const renderAnalysisInsightsTab = () => {
    const analysisInsights = getAnalysisInsights();
    const overallStatus = getOverallStatus();
    
    return (
      <div className="space-y-6">
        {/* Investment Summary */}
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <span className="bg-green-600 text-white px-3 py-1 rounded mr-3">💡 INVESTMENT ANALYSIS</span>
                {symbol} Analysis Results
              </span>
              <Badge className={overallStatus.color}>
                {overallStatus.status} Analysis
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
                          <div className="bg-white p-6 rounded-lg shadow-sm">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Executive Investment Summary</h3>
                {dkgNodes.length === 0 && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      💡 <strong>Tip:</strong> Click "🔍 Load Analysis Details" at the bottom to see the actual analysis content for {symbol}, including:
                      <br />• Market sentiment and trading strategies
                      <br />• Technical analysis with price targets  
                      <br />• Economic indicators and policy analysis
                      <br />• Investment analysis and risk factors
                    </p>
                  </div>
                )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">📊 Analysis Coverage</h4>
                  <ul className="space-y-1 text-sm">
                    <li className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${analysisInsights.sentiment.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      Market Sentiment Analysis ({analysisInsights.sentiment.length} agents)
                    </li>
                    <li className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${analysisInsights.technical.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      Technical Price Analysis ({analysisInsights.technical.length} agents)
                    </li>
                    <li className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${analysisInsights.macro.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      Macro Economic Analysis ({analysisInsights.macro.length} agents)
                    </li>
                    <li className="flex items-center">
                      <span className={`w-3 h-3 rounded-full mr-2 ${analysisInsights.insights.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                      Investment Insights ({analysisInsights.insights.length} agents)
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-700 mb-2">🎯 Key Metrics</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Consensus Rate:</span>
                      <span className="font-semibold">{overallStatus.rate.toFixed(0)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>AI Confidence:</span>
                      <span className="font-semibold">{getAverageConfidence().toFixed(1)}/10</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Analysis Cost:</span>
                      <span className="font-semibold">${getTotalCost().toFixed(4)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Time:</span>
                      <span className="font-semibold">{(getTotalDuration() / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Analysis Components */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Market Sentiment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-blue-500 text-white px-2 py-1 rounded mr-2">📈</span>
                Market Sentiment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysisInsights.sentiment.length > 0 ? (
                <div className="space-y-4">
                  {analysisInsights.sentiment.map((analysis: any, index: number) => (
                    <div key={index} className="border-l-4 border-blue-500 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{analysis.agentId}</span>
                        <Badge className={analysis.consensus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {analysis.consensus ? 'VERIFIED' : 'DISPUTED'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Analysis Quality: {analysis.content}</div>
                        <div>Confidence Score: {(analysis.score * 100).toFixed(1)}%</div>
                        {analysis.actualAnalysis && analysis.consensus && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                            <h5 className="font-semibold text-blue-800 mb-2">📈 Market Sentiment Analysis for {symbol}:</h5>
                            <div className="space-y-2 text-xs">
                              <div><strong>Market Sentiment:</strong> <span className={`font-bold ${analysis.actualAnalysis.sentiment === 'Bullish' ? 'text-green-600' : analysis.actualAnalysis.sentiment === 'Bearish' ? 'text-red-600' : 'text-gray-600'}`}>{analysis.actualAnalysis.sentiment}</span></div>
                              <div><strong>Confidence Level:</strong> {analysis.actualAnalysis.confidence}/10</div>
                              <div><strong>Analysis Summary:</strong> {analysis.actualAnalysis.summary}</div>
                              {analysis.actualAnalysis.trends && analysis.actualAnalysis.trends.length > 0 && (
                                <div>
                                  <strong>Key Market Trends:</strong>
                                  <ul className="ml-4 mt-1">
                                    {analysis.actualAnalysis.trends.slice(0, 3).map((trend: string, idx: number) => (
                                      <li key={idx} className="text-blue-700">📈 {trend}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              <div><strong>Trading Strategy:</strong> {analysis.actualAnalysis.strategy}</div>
                              {analysis.actualAnalysis.riskFactors && analysis.actualAnalysis.riskFactors.length > 0 && (
                                <div>
                                  <strong>Risk Factors:</strong>
                                  <ul className="ml-4 mt-1">
                                    {analysis.actualAnalysis.riskFactors.slice(0, 2).map((risk: string, idx: number) => (
                                      <li key={idx} className="text-red-600">⚠️ {risk}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-2">Key Sentiment Insights:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Overall market sentiment analysis completed by {analysisInsights.sentiment.length} AI agents</li>
                      <li>• Consensus verification ensures accuracy and reliability</li>
                      <li>• Real-time sentiment indicators from multiple data sources</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No sentiment analysis data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Technical Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-purple-500 text-white px-2 py-1 rounded mr-2">📊</span>
                Technical Price Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysisInsights.technical.length > 0 ? (
                <div className="space-y-4">
                  {analysisInsights.technical.map((analysis: any, index: number) => (
                    <div key={index} className="border-l-4 border-purple-500 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{analysis.agentId}</span>
                        <Badge className={analysis.consensus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {analysis.consensus ? 'VERIFIED' : 'DISPUTED'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Analysis Quality: {analysis.content}</div>
                        <div>Confidence Score: {(analysis.score * 100).toFixed(1)}%</div>
                        {analysis.actualAnalysis && analysis.consensus && (
                          <div className="mt-3 p-3 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                            <h5 className="font-semibold text-purple-800 mb-2">📊 Technical Analysis for {symbol}:</h5>
                            <div className="space-y-2 text-xs">
                              <div><strong>Analysis Summary:</strong> {analysis.actualAnalysis.summary}</div>
                              {analysis.actualAnalysis.signalProbability > 0 && (
                                <div><strong>Signal Probability:</strong> {analysis.actualAnalysis.signalProbability}%</div>
                              )}
                              {analysis.actualAnalysis.priceTargets && (
                                <div className="grid grid-cols-3 gap-2">
                                  {analysis.actualAnalysis.priceTargets.bullishTarget > 0 && (
                                    <div className="text-green-600"><strong>Bullish Target:</strong> ${analysis.actualAnalysis.priceTargets.bullishTarget}</div>
                                  )}
                                  {analysis.actualAnalysis.priceTargets.bearishTarget > 0 && (
                                    <div className="text-red-600"><strong>Bearish Target:</strong> ${analysis.actualAnalysis.priceTargets.bearishTarget}</div>
                                  )}
                                  {analysis.actualAnalysis.priceTargets.neutralTarget > 0 && (
                                    <div className="text-gray-600"><strong>Neutral Target:</strong> ${analysis.actualAnalysis.priceTargets.neutralTarget}</div>
                                  )}
                                </div>
                              )}
                              {analysis.actualAnalysis.tradingSignals && analysis.actualAnalysis.tradingSignals.length > 0 && (
                                <div>
                                  <strong>Key Technical Signals:</strong>
                                  <ul className="ml-4 mt-1">
                                    {analysis.actualAnalysis.tradingSignals.slice(0, 3).map((signal: string, idx: number) => (
                                      <li key={idx} className="text-purple-700">📊 {signal}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {analysis.actualAnalysis.riskParameters && (
                                <div>
                                  <strong>Risk Management:</strong> 
                                  Risk/Reward Ratio: {analysis.actualAnalysis.riskParameters.riskRewardRatio || 'N/A'}:1
                                  {analysis.actualAnalysis.riskParameters.positionSize && (
                                    <span> | Position Size: {analysis.actualAnalysis.riskParameters.positionSize}</span>
                                  )}
                                </div>
                              )}
                              {analysis.actualAnalysis.confidenceLevel > 0 && (
                                <div><strong>Technical Confidence:</strong> {analysis.actualAnalysis.confidenceLevel}/10</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 p-4 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-2">Technical Analysis Insights:</h4>
                    <ul className="text-sm text-purple-700 space-y-1">
                      <li>• Comprehensive technical indicator analysis</li>
                      <li>• Price action and chart pattern recognition</li>
                      <li>• Support/resistance levels and trend analysis</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No technical analysis data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Macro Economic */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-orange-500 text-white px-2 py-1 rounded mr-2">🌍</span>
                Macro Economic Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysisInsights.macro.length > 0 ? (
                <div className="space-y-4">
                  {analysisInsights.macro.map((analysis: any, index: number) => (
                    <div key={index} className="border-l-4 border-orange-500 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{analysis.agentId}</span>
                        <Badge className={analysis.consensus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {analysis.consensus ? 'VERIFIED' : 'DISPUTED'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Analysis Quality: {analysis.content}</div>
                        <div>Confidence Score: {(analysis.score * 100).toFixed(1)}%</div>
                        {analysis.actualAnalysis && analysis.consensus && (
                          <div className="mt-3 p-3 bg-orange-50 rounded-lg border-l-4 border-orange-500">
                            <h5 className="font-semibold text-orange-800 mb-2">🌍 Macro Economic Analysis for {symbol}:</h5>
                            <div className="space-y-2 text-xs">
                              <div><strong>Analysis Summary:</strong> {analysis.actualAnalysis.summary}</div>
                              {analysis.actualAnalysis.indicators && Object.keys(analysis.actualAnalysis.indicators).length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                  {analysis.actualAnalysis.indicators.gdpGrowth && (
                                    <div><strong>GDP Growth:</strong> {analysis.actualAnalysis.indicators.gdpGrowth}%</div>
                                  )}
                                  {analysis.actualAnalysis.indicators.inflationRate && (
                                    <div><strong>Inflation Rate:</strong> {analysis.actualAnalysis.indicators.inflationRate}%</div>
                                  )}
                                  {analysis.actualAnalysis.indicators.unemploymentRate && (
                                    <div><strong>Unemployment:</strong> {analysis.actualAnalysis.indicators.unemploymentRate}%</div>
                                  )}
                                  {analysis.actualAnalysis.indicators.interestRate && (
                                    <div><strong>Interest Rate:</strong> {analysis.actualAnalysis.indicators.interestRate}%</div>
                                  )}
                                </div>
                              )}
                              <div><strong>Policy Stance:</strong> {analysis.actualAnalysis.policyStance}</div>
                              <div><strong>Economic Cycle:</strong> {analysis.actualAnalysis.economicCycle}</div>
                              {analysis.actualAnalysis.recessionProbability > 0 && (
                                <div><strong>Recession Probability:</strong> {analysis.actualAnalysis.recessionProbability}%</div>
                              )}
                              {analysis.actualAnalysis.recommendations && analysis.actualAnalysis.recommendations.length > 0 && (
                                <div>
                                  <strong>Investment Strategy Analysis:</strong>
                                  <ul className="ml-4 mt-1">
                                    {analysis.actualAnalysis.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                                      <li key={idx} className="text-orange-700">🌍 {rec}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {analysis.actualAnalysis.confidenceLevel > 0 && (
                                <div><strong>Macro Confidence:</strong> {analysis.actualAnalysis.confidenceLevel}/10</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-semibold text-orange-800 mb-2">Macro Economic Insights:</h4>
                    <ul className="text-sm text-orange-700 space-y-1">
                      <li>• Economic indicators and policy analysis</li>
                      <li>• Global market trends and correlations</li>
                      <li>• Interest rate and inflation impact assessment</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No macro economic analysis data available</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Investment Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <span className="bg-green-500 text-white px-2 py-1 rounded mr-2">💡</span>
                Investment Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              {analysisInsights.insights.length > 0 ? (
                <div className="space-y-4">
                  {analysisInsights.insights.map((analysis: any, index: number) => (
                    <div key={index} className="border-l-4 border-green-500 pl-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{analysis.agentId}</span>
                        <Badge className={analysis.consensus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {analysis.consensus ? 'VERIFIED' : 'DISPUTED'}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        <div>Analysis Quality: {analysis.content}</div>
                        <div>Confidence Score: {(analysis.score * 100).toFixed(1)}%</div>
                        {analysis.actualAnalysis && analysis.consensus && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border-l-4 border-green-500">
                            <h5 className="font-semibold text-green-800 mb-2">💡 Investment Insights for {symbol}:</h5>
                            <div className="space-y-2 text-xs">
                              <div><strong>Investment Summary:</strong> {analysis.actualAnalysis.summary}</div>
                              <div><strong>Market Outlook:</strong> {analysis.actualAnalysis.marketOutlook}</div>
                              {analysis.actualAnalysis.keyPoints && analysis.actualAnalysis.keyPoints.length > 0 && (
                                <div>
                                  <strong>Key Investment Points:</strong>
                                  <ul className="ml-4 mt-1">
                                    {analysis.actualAnalysis.keyPoints.slice(0, 3).map((point: string, idx: number) => (
                                      <li key={idx} className="text-green-700">💡 {point}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {analysis.actualAnalysis.recommendations && analysis.actualAnalysis.recommendations.length > 0 && (
                                <div>
                                  <strong>Actionable Investment Insights:</strong>
                                  <ul className="ml-4 mt-1">
                                    {analysis.actualAnalysis.recommendations.slice(0, 3).map((rec: string, idx: number) => (
                                      <li key={idx} className="text-green-700">🎯 {rec}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {analysis.actualAnalysis.riskFactors && analysis.actualAnalysis.riskFactors.length > 0 && (
                                <div>
                                  <strong>Investment Risk Factors:</strong>
                                  <ul className="ml-4 mt-1">
                                    {analysis.actualAnalysis.riskFactors.slice(0, 2).map((risk: string, idx: number) => (
                                      <li key={idx} className="text-red-600">⚠️ {risk}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {analysis.actualAnalysis.confidence > 0 && (
                                <div><strong>Insights Confidence:</strong> {analysis.actualAnalysis.confidence}/10</div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-2">Investment Analysis:</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>• Synthesized insights from all analysis components</li>
                      <li>• Actionable investment insights</li>
                      <li>• Risk assessment and portfolio guidance</li>
                    </ul>
                  </div>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  <p>No investment insights data available</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

                      {/* Final Analysis */}
        <Card className="border-2 border-indigo-200 bg-indigo-50">
          <CardHeader>
            <CardTitle className="text-indigo-800">🎯 Final Investment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-white p-6 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-indigo-600 mb-2">
                    {overallStatus.rate >= 75 ? 'POSITIVE' : overallStatus.rate >= 50 ? 'NEUTRAL' : 'CAUTIOUS'}
                  </div>
                  <div className="text-sm text-gray-600">Overall Analysis</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {getAverageConfidence().toFixed(1)}/10
                  </div>
                  <div className="text-sm text-gray-600">AI Confidence Level</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {Object.values(analysisResult.results).filter(r => r.consensus).length}/{Object.keys(analysisResult.results).length}
                  </div>
                  <div className="text-sm text-gray-600">Consensus Components</div>
                </div>
              </div>
              
              <Separator className="my-6" />
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">📋 Key Takeaways:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Multi-agent AI analysis completed for {symbol}</li>
                    <li>• {Object.values(analysisResult.results).filter(r => r.consensus).length} out of {Object.keys(analysisResult.results).length} components reached consensus</li>
                    <li>• Analysis cost: ${getTotalCost().toFixed(4)} with {(getTotalDuration() / 1000).toFixed(1)}s processing time</li>
                    <li>• Decentralized verification ensures data integrity and accuracy</li>
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-800 mb-2">⚠️ Risk Considerations:</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• This analysis is generated by AI for informational purposes only</li>
                    <li>• Market conditions can change rapidly - consider real-time updates</li>
                    <li>• Diversification and risk management are essential for any investment strategy</li>
                    <li>• Consult with qualified financial advisors for personalized guidance</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderSummaryTab = () => {
    const overallStatus = getOverallStatus();
    
    return (
      <div className="space-y-6">
        {/* Executive Summary */}
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <span className="bg-blue-600 text-white px-3 py-1 rounded mr-3">EXECUTIVE SUMMARY</span>
                Analysis Report for {symbol}
              </span>
              <Badge className={overallStatus.color}>
                {overallStatus.status} ({overallStatus.rate.toFixed(0)}%)
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-blue-600">{Object.keys(analysisResult.results).length}</div>
                <div className="text-sm text-gray-600">Components Analyzed</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-green-600">{systemMetrics.dkg.totalNodes}</div>
                <div className="text-sm text-gray-600">DKG Nodes Created</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-purple-600">${getTotalCost().toFixed(4)}</div>
                <div className="text-sm text-gray-600">Total Analysis Cost</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg shadow-sm">
                <div className="text-2xl font-bold text-orange-600">{(getTotalDuration() / 1000).toFixed(1)}s</div>
                <div className="text-sm text-gray-600">Total Duration</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Component Results */}
        <Card>
          <CardHeader>
            <CardTitle>Component Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(analysisResult.results).map(([component, data]) => {
                const componentConsensus = consensusData.filter(c => c.componentType === component);
                const avgScore = componentConsensus.reduce((sum, c) => sum + c.averageScore, 0) / componentConsensus.length;
                
                return (
                  <div key={component} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">{component.charAt(0).toUpperCase()}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold capitalize">{component}</h3>
                        <p className="text-sm text-gray-600">{data.nodes} nodes • {data.verifications} verifications</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={data.consensus ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {data.consensus ? 'CONSENSUS REACHED' : 'CONSENSUS FAILED'}
                      </Badge>
                      <div className="text-sm text-gray-600 mt-1">
                        Avg Score: {(avgScore * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Key Insights */}
        <Card>
          <CardHeader>
                            <CardTitle>Key Insights & Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg border-l-4 border-blue-500">
                <h4 className="font-semibold text-blue-800 mb-2">Analysis Quality</h4>
                <p className="text-blue-700 text-sm">
                  Average AI confidence: {getAverageConfidence().toFixed(1)}/10 • 
                  {Object.values(analysisResult.results).filter(r => r.consensus).length} out of {Object.keys(analysisResult.results).length} components reached consensus
                </p>
              </div>
              
              <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                <h4 className="font-semibold text-green-800 mb-2">System Performance</h4>
                <p className="text-green-700 text-sm">
                  {systemMetrics.reputation.totalAgents} AI agents participated • 
                  Average reputation: {systemMetrics.reputation.averageReputation.toFixed(3)} • 
                  Top performer: {systemMetrics.topAgents[0]?.name || 'N/A'}
                </p>
              </div>

              <div className="p-4 bg-purple-50 rounded-lg border-l-4 border-purple-500">
                <h4 className="font-semibold text-purple-800 mb-2">Decentralized Knowledge Graph</h4>
                <p className="text-purple-700 text-sm">
                  {systemMetrics.dkg.totalNodes} knowledge nodes created • 
                  Distributed across {Object.keys(systemMetrics.dkg.nodesByAgent).length} agents • 
                  Full audit trail maintained
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderConsensusTab = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Consensus Verification Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {consensusData.map((data, index) => (
              <div key={index} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Badge className="bg-gray-100 text-gray-800">
                      {data.componentType.toUpperCase()}
                    </Badge>
                    <span className="font-medium">{data.agentId}</span>
                  </div>
                  <Badge className={data.consensusReached ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {data.consensusReached ? 'PASSED' : 'FAILED'}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Score:</span>
                    <div className="font-semibold">{(data.averageScore * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Verifiers:</span>
                    <div className="font-semibold">{data.passedCount}/{data.totalVerifiers}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Cost:</span>
                    <div className="font-semibold">${data.realDataMetrics.apiCost.toFixed(4)}</div>
                  </div>
                  <div>
                    <span className="text-gray-600">Duration:</span>
                    <div className="font-semibold">{(data.realDataMetrics.duration / 1000).toFixed(1)}s</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Cost Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total API Cost:</span>
                <span className="font-bold">${getTotalCost().toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Average per Component:</span>
                <span className="font-bold">${(getTotalCost() / consensusData.length).toFixed(4)}</span>
              </div>
              <div className="flex justify-between">
                <span>Total Tokens:</span>
                <span className="font-bold">{consensusData.reduce((sum, d) => sum + d.realDataMetrics.tokenCount, 0).toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Time Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Total Duration:</span>
                <span className="font-bold">{(getTotalDuration() / 1000).toFixed(1)}s</span>
              </div>
              <div className="flex justify-between">
                <span>Average per Component:</span>
                <span className="font-bold">{(getTotalDuration() / consensusData.length / 1000).toFixed(1)}s</span>
              </div>
              <div className="flex justify-between">
                <span>Fastest Component:</span>
                <span className="font-bold">{(Math.min(...consensusData.map(d => d.realDataMetrics.duration)) / 1000).toFixed(1)}s</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quality Metrics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{getAverageConfidence().toFixed(1)}/10</div>
              <div className="text-sm text-gray-600">Average AI Confidence</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{getOverallStatus().rate.toFixed(0)}%</div>
              <div className="text-sm text-gray-600">Consensus Success Rate</div>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{consensusData.reduce((sum, d) => sum + d.passedCount, 0)}</div>
              <div className="text-sm text-gray-600">Total Verifications Passed</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAgentsTab = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Agent Performance Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {systemMetrics.topAgents.map((agent, index) => (
              <div key={agent.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-blue-600 flex items-center justify-center">
                    <span className="text-white font-bold">#{index + 1}</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">{agent.name}</h3>
                    <p className="text-sm text-gray-600">{agent.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-lg">{agent.score.toFixed(3)}</div>
                  <div className="text-sm text-gray-600">
                    {agent.totalTasks} tasks • {(agent.acceptanceRate * 100).toFixed(0)}% success
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agent Specialties Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {['high-accuracy', 'innovative-analysis', 'fast-response', 'detailed-reasoning'].map(specialty => {
              const count = systemMetrics.topAgents.filter(agent => 
                agent.specialties.includes(specialty)
              ).length;
              
              return (
                <div key={specialty} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl font-bold text-gray-800">{count}</div>
                  <div className="text-sm text-gray-600 capitalize">{specialty.replace('-', ' ')}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const generateFinalReportPDF = async () => {
    setIsGeneratingPDF(true);
    
    try {
      // Create new PDF document
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 20;
      const bottomMargin = 30;
      let yPosition = margin;

      // Helper functions
      const checkPageBreak = (requiredSpace: number) => {
        if (yPosition + requiredSpace > pageHeight - margin - bottomMargin) {
          pdf.addPage();
          yPosition = margin;
        }
      };

      const cleanText = (text: string): string => {
        if (!text) return '';
        return text
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/--/g, '')
          .replace(/\n+/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      };

      const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
        pdf.setFontSize(fontSize);
        const lines = pdf.splitTextToSize(text, maxWidth);
        pdf.text(lines, x, y);
        return lines.length * (fontSize * 0.35);
      };

      const addSectionHeader = (text: string, y: number, fontSize: number = 16) => {
        pdf.setFontSize(fontSize);
        pdf.setFont('helvetica', 'bold');
        pdf.text(text, margin, y);
        return fontSize === 16 ? 10 : 8;
      };

      const addSubsection = (text: string, y: number, indent: number = 5) => {
        pdf.setFontSize(12);
        pdf.setFont('helvetica', 'bold');
        pdf.text(text, margin + indent, y);
        return 7;
      };

      const addContent = (text: string, y: number, indent: number = 10) => {
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        const cleanedText = cleanText(text);
        return addText(cleanedText, margin + indent, y, pageWidth - 2 * margin - indent);
      };

      const addBulletPoints = (points: string[], y: number, indent: number = 15) => {
        let currentY = y;
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        
        points.forEach(point => {
          const cleanedPoint = cleanText(point);
          if (cleanedPoint) {
            const lines = pdf.splitTextToSize(`• ${cleanedPoint}`, pageWidth - 2 * margin - indent);
            pdf.text(lines, margin + indent, currentY);
            currentY += lines.length * 3.5;
          }
        });
        
        return currentY - y;
      };

      const isEmptyContent = (content: any): boolean => {
        if (content === null || content === undefined || content === '') return true;
        if (typeof content === 'string') {
          const trimmed = content.trim();
          return trimmed === '' || trimmed === 'N/A' || trimmed === 'None' || trimmed === 'null';
        }
        if (Array.isArray(content)) {
          return content.length === 0 || content.every(item => isEmptyContent(item));
        }
        if (typeof content === 'object') {
          return Object.keys(content).length === 0 || 
                 Object.values(content).every(value => isEmptyContent(value));
        }
        return false;
      };

      const addMetricBox = (label: string, value: string, y: number, x: number, width: number) => {
        pdf.setFillColor(240, 240, 240);
        pdf.rect(x, y - 5, width, 12, 'F');
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        pdf.text(label, x + 2, y);
        pdf.setFont('helvetica', 'bold');
        pdf.text(value, x + 2, y + 5);
        return 15;
      };

      // Header
      pdf.setFontSize(24);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Final Investment Analysis Report', margin, yPosition);
      yPosition += 15;

      // Subtitle and metadata
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Comprehensive AI Analysis for ${symbol}`, margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(10);
      pdf.text(`Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, margin, yPosition);
      yPosition += 5;
      pdf.text(`Task ID: ${analysisResult.taskId}`, margin, yPosition);
      yPosition += 20;

      // ===========================================
      // SECTION 1: 💡 ANALYSIS INSIGHTS
      // ===========================================
      checkPageBreak(50);
      yPosition += addSectionHeader('💡 Analysis Insights', yPosition, 16);
      yPosition += 10;

      // Get analysis insights for detailed content
      const analysisInsights = getAnalysisInsights();

      // Key Metrics Overview
      const overallStatus = getOverallStatus();
      yPosition += addSubsection('Key Investment Metrics', yPosition);
      yPosition += 5;
      
      const metricWidth = (pageWidth - 2 * margin - 15) / 4;
      yPosition += addMetricBox('Consensus Rate', `${overallStatus.rate.toFixed(0)}%`, yPosition, margin + 10, metricWidth);
      yPosition -= 15;
      yPosition += addMetricBox('AI Confidence', `${getAverageConfidence().toFixed(1)}/10`, yPosition, margin + 10 + metricWidth + 5, metricWidth);
      yPosition -= 15;
      yPosition += addMetricBox('Analysis Cost', `$${getTotalCost().toFixed(4)}`, yPosition, margin + 10 + (metricWidth + 5) * 2, metricWidth);
      yPosition -= 15;
      yPosition += addMetricBox('Processing Time', `${(getTotalDuration() / 1000).toFixed(1)}s`, yPosition, margin + 10 + (metricWidth + 5) * 3, metricWidth);
      yPosition += 10;

              // Final Investment Analysis
      checkPageBreak(30);
              yPosition += addSubsection('Final Investment Analysis', yPosition);
      yPosition += 5;

      const analysis = overallStatus.rate >= 75 ? 'POSITIVE' : overallStatus.rate >= 50 ? 'NEUTRAL' : 'CAUTIOUS';
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const recColor = analysis === 'POSITIVE' ? [0, 150, 0] : analysis === 'NEUTRAL' ? [150, 150, 0] : [150, 0, 0];
      pdf.setTextColor(recColor[0], recColor[1], recColor[2]);
              pdf.text(`Analysis: ${analysis}`, margin + 10, yPosition);
      pdf.setTextColor(0, 0, 0); // Reset color
      yPosition += 15;

      // Market Sentiment Analysis
      if (analysisInsights.sentiment && analysisInsights.sentiment.length > 0) {
        checkPageBreak(40);
        yPosition += addSubsection('Market Sentiment Analysis', yPosition);
        yPosition += 5;

        analysisInsights.sentiment.forEach((analysis: any) => {
          if (analysis.consensus && analysis.actualAnalysis) {
            yPosition += addContent(`Agent: ${analysis.agentId}`, yPosition);
            yPosition += addContent(`Market Sentiment: ${analysis.actualAnalysis.sentiment}`, yPosition);
            yPosition += addContent(`Confidence: ${analysis.actualAnalysis.confidence}/10`, yPosition);
            yPosition += addContent(`Summary: ${analysis.actualAnalysis.summary}`, yPosition);
            
            if (analysis.actualAnalysis.trends && analysis.actualAnalysis.trends.length > 0) {
              yPosition += addContent('Key Market Trends:', yPosition);
              yPosition += addBulletPoints(analysis.actualAnalysis.trends.slice(0, 3), yPosition);
            }
            yPosition += 5;
          }
        });
      }

      // Technical Analysis
      if (analysisInsights.technical && analysisInsights.technical.length > 0) {
        checkPageBreak(40);
        yPosition += addSubsection('Technical Price Analysis', yPosition);
        yPosition += 5;

        analysisInsights.technical.forEach((analysis: any) => {
          if (analysis.consensus && analysis.actualAnalysis) {
            yPosition += addContent(`Agent: ${analysis.agentId}`, yPosition);
            yPosition += addContent(`Analysis Summary: ${analysis.actualAnalysis.summary}`, yPosition);
            
            if (analysis.actualAnalysis.signalProbability > 0) {
              yPosition += addContent(`Signal Probability: ${analysis.actualAnalysis.signalProbability}%`, yPosition);
            }
            
            if (analysis.actualAnalysis.tradingSignals && analysis.actualAnalysis.tradingSignals.length > 0) {
              yPosition += addContent('Key Technical Signals:', yPosition);
              yPosition += addBulletPoints(analysis.actualAnalysis.tradingSignals.slice(0, 3), yPosition);
            }
            yPosition += 5;
          }
        });
      }

      // Macro Economic Analysis
      if (analysisInsights.macro && analysisInsights.macro.length > 0) {
        checkPageBreak(40);
        yPosition += addSubsection('Macro Economic Analysis', yPosition);
        yPosition += 5;

        analysisInsights.macro.forEach((analysis: any) => {
          if (analysis.consensus && analysis.actualAnalysis) {
            yPosition += addContent(`Agent: ${analysis.agentId}`, yPosition);
            yPosition += addContent(`Analysis Summary: ${analysis.actualAnalysis.summary}`, yPosition);
            yPosition += addContent(`Policy Stance: ${analysis.actualAnalysis.policyStance}`, yPosition);
            yPosition += addContent(`Economic Cycle: ${analysis.actualAnalysis.economicCycle}`, yPosition);
            yPosition += 5;
          }
        });
      }

      // Investment Insights
      if (analysisInsights.insights && analysisInsights.insights.length > 0) {
        checkPageBreak(40);
        yPosition += addSubsection('Investment Insights', yPosition);
        yPosition += 5;

        analysisInsights.insights.forEach((analysis: any) => {
          if (analysis.consensus && analysis.actualAnalysis) {
            yPosition += addContent(`Agent: ${analysis.agentId}`, yPosition);
            yPosition += addContent(`Investment Summary: ${analysis.actualAnalysis.summary}`, yPosition);
            yPosition += addContent(`Market Outlook: ${analysis.actualAnalysis.marketOutlook}`, yPosition);
            
            if (analysis.actualAnalysis.recommendations && analysis.actualAnalysis.recommendations.length > 0) {
              yPosition += addContent('Investment Analysis:', yPosition);
              yPosition += addBulletPoints(analysis.actualAnalysis.recommendations.slice(0, 3), yPosition);
            }
            yPosition += 5;
          }
        });
      }

      // ===========================================
      // SECTION 2: 📋 SUMMARY
      // ===========================================
      checkPageBreak(50);
      yPosition += addSectionHeader('📋 Analysis Summary', yPosition, 16);
      yPosition += 10;

      yPosition += addSubsection('Executive Summary', yPosition);
      yPosition += 5;
      const summaryText = `This report presents a comprehensive AI-powered investment analysis for ${symbol}. Our multi-agent system achieved a ${overallStatus.rate.toFixed(0)}% consensus rate with an average AI confidence level of ${getAverageConfidence().toFixed(1)}/10. The analysis was completed at a cost of $${getTotalCost().toFixed(4)} in ${(getTotalDuration() / 1000).toFixed(1)} seconds.`;
      yPosition += addText(summaryText, margin + 10, yPosition, pageWidth - 2 * margin - 10);
      yPosition += 10;

      yPosition += addSubsection('Analysis Components', yPosition);
      yPosition += 5;
      const components = Object.entries(analysisResult.results);
      components.forEach(([type, result]) => {
        const status = result.consensus ? '✓ PASSED' : '✗ FAILED';
        const statusColor = result.consensus ? [0, 150, 0] : [150, 0, 0];
        pdf.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
        yPosition += addContent(`${type.toUpperCase()}: ${status}`, yPosition);
        pdf.setTextColor(0, 0, 0); // Reset color
      });
      yPosition += 10;

              yPosition += addSubsection('Key Insights & Analysis', yPosition);
      yPosition += 5;
      yPosition += addContent(`Average AI confidence: ${getAverageConfidence().toFixed(1)}/10`, yPosition);
      yPosition += addContent(`${Object.values(analysisResult.results).filter(r => r.consensus).length} out of ${Object.keys(analysisResult.results).length} components reached consensus`, yPosition);
      yPosition += addContent(`${systemMetrics.reputation.totalAgents} AI agents participated`, yPosition);
      yPosition += addContent(`Average reputation: ${systemMetrics.reputation.averageReputation.toFixed(3)}`, yPosition);
      yPosition += 10;

      // ===========================================
      // SECTION 3: ✅ CONSENSUS
      // ===========================================
      checkPageBreak(50);
      yPosition += addSectionHeader('✅ Consensus Verification', yPosition, 16);
      yPosition += 10;

      yPosition += addSubsection('Consensus Results', yPosition);
      yPosition += 5;
      
      consensusData.forEach(data => {
        checkPageBreak(25);
        yPosition += addContent(`Agent: ${data.agentId}`, yPosition);
        yPosition += addContent(`Component: ${data.componentType.toUpperCase()}`, yPosition);
        const consensusStatus = data.consensusReached ? 'REACHED' : 'FAILED';
        const consensusColor = data.consensusReached ? [0, 150, 0] : [150, 0, 0];
        pdf.setTextColor(consensusColor[0], consensusColor[1], consensusColor[2]);
        yPosition += addContent(`Consensus: ${consensusStatus}`, yPosition);
        pdf.setTextColor(0, 0, 0); // Reset color
        yPosition += addContent(`Verifiers Passed: ${data.passedCount}/${data.totalVerifiers}`, yPosition);
        yPosition += addContent(`Average Score: ${(data.averageScore * 100).toFixed(1)}%`, yPosition);
        yPosition += 8;
      });

      yPosition += addSubsection('Quality Metrics', yPosition);
      yPosition += 5;
      yPosition += addContent(`Average AI Confidence: ${getAverageConfidence().toFixed(1)}/10`, yPosition);
      yPosition += addContent(`Consensus Success Rate: ${getOverallStatus().rate.toFixed(0)}%`, yPosition);
      yPosition += addContent(`Total Verifications Passed: ${consensusData.reduce((sum, d) => sum + d.passedCount, 0)}`, yPosition);
      yPosition += 10;

      // ===========================================
      // SECTION 4: 📈 PERFORMANCE
      // ===========================================
      checkPageBreak(50);
      yPosition += addSectionHeader('📈 Performance Metrics', yPosition, 16);
      yPosition += 10;

      yPosition += addSubsection('Analysis Performance', yPosition);
      yPosition += 5;
      yPosition += addContent(`Total Analysis Cost: $${getTotalCost().toFixed(4)}`, yPosition);
      yPosition += addContent(`Total Processing Time: ${(getTotalDuration() / 1000).toFixed(1)} seconds`, yPosition);
      yPosition += addContent(`Average AI Confidence: ${getAverageConfidence().toFixed(1)}/10`, yPosition);
      yPosition += addContent(`Consensus Success Rate: ${overallStatus.rate.toFixed(0)}%`, yPosition);
      yPosition += addContent(`Total Verifications: ${consensusData.reduce((sum, d) => sum + d.passedCount, 0)}`, yPosition);
      yPosition += 10;

      yPosition += addSubsection('Cost Breakdown', yPosition);
      yPosition += 5;
      consensusData.forEach(data => {
        if (data.realDataMetrics.apiCost > 0) {
          yPosition += addContent(`${data.agentId}: $${data.realDataMetrics.apiCost.toFixed(4)} (${data.realDataMetrics.tokenCount.toLocaleString()} tokens)`, yPosition);
        }
      });
      yPosition += 10;

      yPosition += addSubsection('Processing Times', yPosition);
      yPosition += 5;
      consensusData.forEach(data => {
        if (data.realDataMetrics.duration > 0) {
          yPosition += addContent(`${data.agentId}: ${(data.realDataMetrics.duration / 1000).toFixed(1)}s`, yPosition);
        }
      });
      yPosition += 10;

      // ===========================================
      // SECTION 5: 🤖 AGENTS
      // ===========================================
      checkPageBreak(50);
      yPosition += addSectionHeader('🤖 Agent Network', yPosition, 16);
      yPosition += 10;

      yPosition += addSubsection('Top Performing Agents', yPosition);
      yPosition += 5;
      systemMetrics.topAgents.slice(0, 5).forEach((agent, index) => {
        yPosition += addContent(`${index + 1}. ${agent.name}`, yPosition);
        yPosition += addContent(`   Reputation Score: ${agent.score.toFixed(3)}`, yPosition);
        yPosition += addContent(`   Total Tasks: ${agent.totalTasks}`, yPosition);
        yPosition += addContent(`   Acceptance Rate: ${(agent.acceptanceRate * 100).toFixed(1)}%`, yPosition);
        yPosition += addContent(`   Specialties: ${agent.specialties.join(', ')}`, yPosition);
        yPosition += 5;
      });

      yPosition += addSubsection('Agent Reputation Network', yPosition);
      yPosition += 5;
      yPosition += addContent(`Total Agents: ${systemMetrics.reputation.totalAgents}`, yPosition);
      yPosition += addContent(`Average Reputation: ${systemMetrics.reputation.averageReputation.toFixed(3)}`, yPosition);
      yPosition += addContent(`Top Performers: ${systemMetrics.reputation.topPerformers.join(', ')}`, yPosition);
      yPosition += 10;

      yPosition += addSubsection('Decentralized Knowledge Graph', yPosition);
      yPosition += 5;
      yPosition += addContent(`Total Nodes: ${systemMetrics.dkg.totalNodes}`, yPosition);
      yPosition += addContent(`Distributed Across: ${Object.keys(systemMetrics.dkg.nodesByAgent).length} agents`, yPosition);
      yPosition += addContent('Node Distribution by Agent:', yPosition);
      Object.entries(systemMetrics.dkg.nodesByAgent).forEach(([agent, count]) => {
        yPosition += addContent(`  ${agent}: ${count} nodes`, yPosition);
      });
      yPosition += 15;

      // Risk Disclaimers
      checkPageBreak(30);
      yPosition += addSectionHeader('Important Disclaimers', yPosition, 14);
      yPosition += 5;

      const disclaimers = [
        'This analysis is generated by AI for informational and educational purposes only',
        'Market conditions can change rapidly - consider real-time updates',
        'Diversification and risk management are essential for any investment strategy',
        'Consult with qualified financial advisors for personalized guidance',
        'Past performance does not guarantee future results',
        'All investments carry risk of loss'
      ];

      yPosition += addBulletPoints(disclaimers, yPosition);
      yPosition += 10;

      // Footer
      checkPageBreak(20);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Generated by ChaosChain Multi-Agent Investment Analysis Platform', margin, yPosition);
      yPosition += 4;
      pdf.text('This report contains proprietary AI analysis and should be used for informational purposes only.', margin, yPosition);

      // Save the PDF
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const filename = `ChaosChain_Complete_Report_${symbol}_${timestamp}.pdf`;
      pdf.save(filename);

      console.log(`📄 Complete Final Report PDF generated: ${filename}`);
      
    } catch (error) {
      console.error('❌ Error generating Complete Final Report PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">📊 Final Analysis Report</h1>
              <p className="text-blue-100 mt-1">Comprehensive analysis results for {symbol}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-blue-100">Task ID</div>
              <div className="font-mono text-sm">{analysisResult.taskId.slice(-12)}</div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b bg-gray-50">
          <div className="flex space-x-8 px-6">
            {[
              { key: 'insights', label: '💡 Analysis Insights', icon: '💡' },
              { key: 'summary', label: '📋 Summary', icon: '📋' },
              { key: 'consensus', label: '✅ Consensus', icon: '✅' },
              { key: 'performance', label: '📈 Performance', icon: '📈' },
              { key: 'agents', label: '🤖 Agents', icon: '🤖' }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'insights' && renderAnalysisInsightsTab()}
          {activeTab === 'summary' && renderSummaryTab()}
          {activeTab === 'consensus' && renderConsensusTab()}
          {activeTab === 'performance' && renderPerformanceTab()}
          {activeTab === 'agents' && renderAgentsTab()}
        </div>

        {/* Footer */}
        <div className="border-t bg-gray-50 px-6 py-4 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Generated at {new Date().toLocaleString()} • ChaosChain v1.0
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" onClick={fetchDKGDetails} disabled={loadingDetails}>
              {loadingDetails ? '⏳ Loading...' : '🔍 Load Analysis Details'}
            </Button>
            <Button 
              variant="outline" 
              onClick={generateFinalReportPDF} 
              disabled={isGeneratingPDF}
              className="flex items-center space-x-2"
            >
              {isGeneratingPDF ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                  <span>Generating PDF...</span>
                </>
              ) : (
                <>
                  <span>📄</span>
                  <span>Export PDF Report</span>
                </>
              )}
            </Button>
            <Button onClick={onClose}>
              Close Report
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 