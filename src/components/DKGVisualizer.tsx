'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface DKGNode {
  id: string;
  agentId: string;
  componentType: string;
  timestamp: string;
  signature: string;
  resultData: any;
  reasoning?: string;
  dataSources: string[];
  parentNodes?: string[];
  costInfo?: {
    totalTokens: number;
    totalCost: number;
    duration: number;
  };
}

interface DKGVisualizerProps {
  taskId?: string;
  refreshTrigger?: number;
}

interface NodePosition {
  x: number;
  y: number;
  id: string;
  node: DKGNode;
}

interface Connection {
  from: NodePosition;
  to: NodePosition;
  type: 'causal' | 'temporal' | 'agent';
}

export default function DKGVisualizer({ taskId, refreshTrigger = 0 }: DKGVisualizerProps) {
  const [nodes, setNodes] = useState<DKGNode[]>([]);
  const [selectedNode, setSelectedNode] = useState<DKGNode | null>(null);
  const [nodePositions, setNodePositions] = useState<NodePosition[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [viewMode, setViewMode] = useState<'graph' | 'timeline' | 'network' | 'list'>('network');
  const [filterComponent, setFilterComponent] = useState<string>('all');
  const [filterAgent, setFilterAgent] = useState<string>('all');
  const [loading, setLoading] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [showSignatures, setShowSignatures] = useState(true);
  const [showCostInfo, setShowCostInfo] = useState(true);
  const [causalityMode, setCausalityMode] = useState<'real' | 'demo'>('demo');
  const [demoFlow, setDemoFlow] = useState<1 | 2>(1);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Fetch DKG data
  const fetchDKGData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/dkg/nodes' + (taskId ? `?taskId=${taskId}` : ''));
      const data = await response.json();
      
      if (data.success) {
        setNodes(data.nodes || []);
        calculateAdvancedLayout(data.nodes || []);
      }
    } catch (error) {
      console.error('Failed to fetch DKG data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDKGData();
  }, [taskId, refreshTrigger]);

  // Clean, organized layout calculation
  const calculateAdvancedLayout = (nodeList: DKGNode[]) => {
    const positions: NodePosition[] = [];
    const connections: Connection[] = [];
    
    // Filter nodes based on current filters
    const filteredNodes = nodeList.filter(node => {
      const componentMatch = filterComponent === 'all' || node.componentType === filterComponent;
      const agentMatch = filterAgent === 'all' || node.agentId.includes(filterAgent);
      return componentMatch && agentMatch;
    });

    if (filteredNodes.length === 0) {
      setNodePositions([]);
      setConnections([]);
      return;
    }

    // Group nodes by component type for clean organization
    const nodesByComponent: { [key: string]: DKGNode[] } = {
      sentiment: [],
      macro: [],
      technical: [],
      insights: []
    };
    
    filteredNodes.forEach(node => {
      const type = node.componentType || 'unknown';
      if (!nodesByComponent[type]) nodesByComponent[type] = [];
      nodesByComponent[type].push(node);
    });

    // Clean horizontal flow layout
    const componentOrder = ['sentiment', 'technical', 'macro', 'insights'];
    const canvasWidth = 900;
    const canvasHeight = 600;
    const stageWidth = canvasWidth * 0.8;
    const stageHeight = canvasHeight * 0.6;
    const startX = (canvasWidth - stageWidth) / 2 + 80;
    const startY = (canvasHeight - stageHeight) / 2 + 100;

    componentOrder.forEach((componentType, stageIndex) => {
      const stageNodes = nodesByComponent[componentType] || [];
      if (stageNodes.length === 0) return;

      // Calculate stage position with equal spacing
      const stageX = startX + (stageIndex * stageWidth / Math.max(1, componentOrder.length - 1));
      
      // Position nodes vertically in each stage
      stageNodes.forEach((node, nodeIndex) => {
        const totalNodes = stageNodes.length;
        const verticalSpacing = totalNodes > 1 ? 120 : 0;
        const totalHeight = (totalNodes - 1) * verticalSpacing;
        const nodeY = startY + (stageHeight / 2) - (totalHeight / 2) + (nodeIndex * verticalSpacing);
        
        positions.push({
          x: stageX,
          y: nodeY,
          id: node.id,
          node
        });
      });
    });

    // Create clear causal flow connections
    componentOrder.forEach((componentType, stageIndex) => {
      if (stageIndex === componentOrder.length - 1) return; // Last stage has no outgoing connections
      
      const currentStageNodes = nodesByComponent[componentType] || [];
      const nextStageType = componentOrder[stageIndex + 1];
      const nextStageNodes = nodesByComponent[nextStageType] || [];
      
      // Create clean connections between stages
      currentStageNodes.forEach(sourceNode => {
        nextStageNodes.forEach(targetNode => {
          const sourcePos = positions.find(p => p.id === sourceNode.id);
          const targetPos = positions.find(p => p.id === targetNode.id);
          
          if (sourcePos && targetPos) {
            connections.push({
              from: sourcePos,
              to: targetPos,
              type: 'causal'
            });
          }
        });
      });
    });

    console.log(`DKG Visualizer: Clean layout with ${positions.length} nodes and ${connections.length} connections`);
    setNodePositions(positions);
    setConnections(connections);
  };

  useEffect(() => {
    calculateAdvancedLayout(nodes);
  }, [filterComponent, filterAgent, nodes]);

  const getNodeColor = (node: DKGNode) => {
    switch (node.componentType) {
      case 'sentiment': return '#3b82f6'; // blue-500
      case 'technical': return '#10b981'; // green-500
      case 'macro': return '#8b5cf6'; // purple-500
      case 'insights': return '#f59e0b'; // orange-500
      default: return '#6b7280'; // gray-500
    }
  };

  const getNodeSize = (node: DKGNode) => {
    const baseSize = 30;
    const costMultiplier = node.costInfo?.totalCost ? Math.min(2, node.costInfo.totalCost * 20) : 1;
    return baseSize + (costMultiplier * 10);
  };

  const getConnectionColor = (type: string) => {
    switch (type) {
      case 'causal': return '#ef4444'; // red-500
      case 'temporal': return '#06b6d4'; // cyan-500
      case 'agent': return '#84cc16'; // lime-500
      default: return '#6b7280'; // gray-500
    }
  };

  const getModelBadgeColor = (agentId: string) => {
    if (agentId.includes('gpt4o')) return 'bg-orange-100 text-orange-800 border-orange-200';
    if (agentId.includes('gpt4')) return 'bg-blue-100 text-blue-800 border-blue-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const truncateSignature = (signature: string) => {
    return `${signature.slice(0, 12)}...${signature.slice(-12)}`;
  };

  const renderNetworkView = () => (
    <div className="relative w-full h-[700px] border border-gray-200 rounded-xl overflow-hidden bg-white shadow-lg">
      {/* Clean, simple background */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white">
        {/* Simple grid pattern */}
        <svg className="w-full h-full opacity-5">
          <defs>
            <pattern id="simple-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#simple-grid)" />
        </svg>
      </div>

      <svg className="absolute inset-0 w-full h-full z-10">
        <defs>
          {/* Simple arrow marker */}
          <marker id="arrow" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#3b82f6"/>
          </marker>
        </defs>
        
        {/* Render clean connections */}
        {connections.map((conn, index) => {
          const isHovered = hoveredNode === conn.from.id || hoveredNode === conn.to.id;
          
          return (
            <line
              key={index}
              x1={conn.from.x + getNodeSize(conn.from.node) / 2}
              y1={conn.from.y + getNodeSize(conn.from.node) / 2}
              x2={conn.to.x + getNodeSize(conn.to.node) / 2}
              y2={conn.to.y + getNodeSize(conn.to.node) / 2}
              stroke="#3b82f6"
              strokeWidth={isHovered ? 3 : 2}
              opacity={isHovered ? 1 : 0.6}
              markerEnd="url(#arrow)"
              className="transition-all duration-200"
              style={{ strokeLinecap: 'round' }}
            />
          );
        })}
      </svg>

      {/* Stage labels for clear flow visualization */}
      {nodePositions.length > 0 && (
        <div className="absolute top-4 left-0 right-0 flex justify-between px-16 z-30">
          {['Sentiment', 'Technical', 'Macro', 'Insights'].map((stage, index) => (
            <div key={stage} className="text-center">
              <div className="bg-gray-100 px-3 py-1 rounded-full text-sm font-medium text-gray-700 shadow-sm">
                {index + 1}. {stage}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Enhanced empty state overlay */}
      {nodePositions.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-gradient-to-br from-white/95 via-slate-50/90 to-blue-50/80 backdrop-blur-sm">
          <div className="text-center p-8 max-w-md">
            {/* Animated icon */}
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-20 animate-pulse"></div>
              <div className="absolute inset-2 bg-white rounded-full shadow-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            
            {/* Enhanced text */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-gray-800 tracking-tight">Knowledge Graph Ready</h3>
              <p className="text-gray-600 leading-relaxed">
                Run a comprehensive analysis to see AI agents collaborate and build the decentralized knowledge graph in real-time
              </p>
              <div className="flex justify-center space-x-2 mt-4">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Render nodes */}
      {nodePositions.map(pos => {
        const node = pos.node;
        const size = getNodeSize(node);
        const isSelected = selectedNode?.id === node.id;
        const isHovered = hoveredNode === node.id;
        
        return (
          <div
            key={node.id}
            className={`absolute cursor-pointer transition-all duration-200 z-20 ${
              isSelected ? 'scale-110' : ''
            } ${isHovered ? 'scale-105' : 'hover:scale-105'}`}
            style={{ 
              left: pos.x - size/2, 
              top: pos.y - size/2,
              width: size,
              height: size
            }}
            onClick={() => setSelectedNode(node)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Clean node design */}
            <div 
              className={`w-full h-full rounded-full shadow-lg border-3 border-white flex items-center justify-center relative ${
                isSelected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''
              }`}
              style={{ 
                backgroundColor: getNodeColor(node)
              }}
            >
              {/* Component icon */}
              <span className="text-white text-xl font-bold">
                {node.componentType.slice(0, 1).toUpperCase()}
              </span>
              
              {/* Simple model indicator */}
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white shadow-sm flex items-center justify-center text-xs font-bold text-white"
                   style={{ backgroundColor: node.agentId.includes('gpt4o') ? '#f97316' : '#3b82f6' }}>
                {node.agentId.includes('gpt4o') ? '4o' : '4'}
              </div>
            </div>
            
            {/* Clean node label */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 text-center">
              <div className="bg-white px-3 py-1 rounded-lg shadow-md border">
                <div className="text-sm font-semibold text-gray-800">
                  {node.componentType.charAt(0).toUpperCase() + node.componentType.slice(1)}
                </div>
                <div className="text-xs text-gray-600">
                  {node.agentId.includes('gpt4o') ? 'GPT-4o' : 'GPT-4.1'}
                  {showCostInfo && node.costInfo && (
                    <span className="text-green-600 ml-2">
                      ${node.costInfo.totalCost.toFixed(3)}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Enhanced hover tooltip */}
            {isHovered && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-4 z-50 animate-in fade-in-0 zoom-in-95 duration-200">
                <div className="bg-gray-900/95 backdrop-blur-sm text-white p-4 rounded-2xl shadow-2xl border border-gray-700/50 min-w-[280px]">
                  {/* Header */}
                  <div className="flex items-center space-x-3 mb-3">
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: getNodeColor(node) }}
                    >
                      {node.componentType.slice(0, 1).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-blue-300 text-sm">
                        {node.componentType.charAt(0).toUpperCase() + node.componentType.slice(1)} Analysis
                      </div>
                      <div className="text-gray-400 text-xs">{node.agentId}</div>
                    </div>
                  </div>
                  
                  {/* Details grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-gray-400 mb-1">Timestamp</div>
                      <div className="text-white font-medium">{formatTimestamp(node.timestamp)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 mb-1">Node ID</div>
                      <div className="text-white font-mono">{node.id.slice(-8)}</div>
                    </div>
                    {node.costInfo && (
                      <>
                        <div>
                          <div className="text-gray-400 mb-1">Tokens</div>
                          <div className="text-green-400 font-semibold">
                            {node.costInfo.totalTokens.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-400 mb-1">Cost</div>
                          <div className="text-green-400 font-semibold">
                            ${node.costInfo.totalCost.toFixed(4)}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {/* Data sources */}
                  {node.dataSources.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <div className="text-gray-400 text-xs mb-2">Data Sources</div>
                      <div className="flex flex-wrap gap-1">
                        {node.dataSources.slice(0, 3).map((source, idx) => (
                          <span key={idx} className="bg-gray-800 text-gray-300 px-2 py-1 rounded text-xs">
                            {source}
                          </span>
                        ))}
                        {node.dataSources.length > 3 && (
                          <span className="text-gray-500 text-xs">+{node.dataSources.length - 3} more</span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Tooltip arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                    <div className="w-0 h-0 border-l-[8px] border-r-[8px] border-t-[8px] border-transparent border-t-gray-900/95"></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderTimelineView = () => (
    <div className="space-y-4 max-h-[600px] overflow-y-auto">
      {nodePositions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-center p-6">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="text-gray-600 font-medium mb-2">Timeline View</div>
          <div className="text-gray-500 text-sm">
            Analysis timeline will appear here showing the chronological order of agent activities
          </div>
        </div>
      ) : (
        nodePositions
          .sort((a, b) => new Date(a.node.timestamp).getTime() - new Date(b.node.timestamp).getTime())
          .map((pos, index) => {
          const node = pos.node;
          const isSelected = selectedNode?.id === node.id;
          
          return (
            <div key={node.id} className="flex items-start space-x-4">
              {/* Timeline marker */}
              <div className="flex flex-col items-center">
                <div 
                  className="w-4 h-4 rounded-full border-2 border-white shadow-lg"
                  style={{ backgroundColor: getNodeColor(node) }}
                />
                {index < nodePositions.length - 1 && (
                  <div className="w-0.5 h-16 bg-gray-300 mt-2" />
                )}
              </div>
              
              {/* Timeline content */}
              <div
                className={`flex-1 p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                  isSelected ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedNode(node)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <Badge style={{ backgroundColor: getNodeColor(node) }} className="text-white">
                      {node.componentType}
                    </Badge>
                    <Badge className={getModelBadgeColor(node.agentId)}>
                      {node.agentId.includes('gpt4o') ? 'GPT-4o' : 'GPT-4.1'}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {new Date(node.timestamp).toLocaleString()}
                  </span>
                </div>
                
                <div className="text-sm font-medium text-gray-800 mb-2">
                  {node.agentId}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-600">
                  <div>ID: {node.id.slice(-8)}</div>
                  <div>Sources: {node.dataSources.length}</div>
                  {node.costInfo && (
                    <>
                      <div>Tokens: {node.costInfo.totalTokens.toLocaleString()}</div>
                      <div>Cost: ${node.costInfo.totalCost.toFixed(4)}</div>
                    </>
                  )}
                </div>
                
                {showSignatures && (
                  <div className="mt-2 text-xs text-gray-500 font-mono">
                    Signature: {truncateSignature(node.signature)}
                  </div>
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );

  const renderGraphView = () => (
    <div className="relative w-full h-96 border border-gray-200 rounded-lg overflow-auto bg-gray-50">
      {nodePositions.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            </svg>
          </div>
          <div className="text-gray-600 font-medium mb-2">Graph View</div>
          <div className="text-gray-500 text-sm text-center max-w-xs">
            Hierarchical graph structure will show agent relationships and dependencies
          </div>
        </div>
      )}
      
      <svg className="absolute inset-0 w-full h-full" style={{ minWidth: '1000px', minHeight: '700px' }}>
        {/* Render connections between parent and child nodes */}
        {connections.filter(c => c.type === 'causal').map((conn, index) => (
          <line
            key={index}
            x1={conn.from.x + 40}
            y1={conn.from.y + 20}
            x2={conn.to.x + 40}
            y2={conn.to.y + 20}
            stroke="#ef4444"
            strokeWidth="3"
            strokeDasharray="none"
            markerEnd="url(#arrowhead)"
            opacity={0.8}
          />
        ))}
        
        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#ef4444"
            />
          </marker>
        </defs>
      </svg>
      
      {/* Render nodes */}
      {nodePositions.map(pos => {
        const node = pos.node;
        return (
          <div
            key={node.id}
            className={`absolute cursor-pointer transition-all duration-200 hover:scale-105 ${
              selectedNode?.id === node.id ? 'ring-4 ring-blue-400' : ''
            }`}
            style={{ left: pos.x, top: pos.y }}
            onClick={() => setSelectedNode(node)}
          >
            <div 
              className="w-20 h-10 rounded-lg text-white text-xs flex items-center justify-center font-medium shadow-lg"
              style={{ backgroundColor: getNodeColor(node) }}
            >
              {node.componentType}
            </div>
            <div className="text-xs text-center mt-1 text-gray-600 max-w-20 truncate">
              {node.agentId.split('-').pop()}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderListView = () => (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {nodePositions.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 text-center p-6">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mb-3">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </div>
          <div className="text-gray-600 font-medium mb-2">List View</div>
          <div className="text-gray-500 text-sm">
            Agent analysis results will be listed here with detailed information
          </div>
        </div>
      ) : (
        nodePositions.map(pos => {
        const node = pos.node;
        return (
          <div
            key={node.id}
            className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 hover:shadow-md ${
              selectedNode?.id === node.id ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
            }`}
            onClick={() => setSelectedNode(node)}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Badge style={{ backgroundColor: getNodeColor(node) }} className="text-white">
                  {node.componentType}
                </Badge>
                <Badge className={getModelBadgeColor(node.agentId)}>
                  {node.agentId.includes('gpt4o') ? 'GPT-4o' : 'GPT-4.1'}
                </Badge>
              </div>
              <span className="text-xs text-gray-500">
                {formatTimestamp(node.timestamp)}
              </span>
            </div>
            
            <div className="text-sm font-medium text-gray-800 mb-1">
              {node.agentId}
            </div>
            
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              <span>ID: {node.id.slice(-8)}</span>
              <span>Signature: {truncateSignature(node.signature)}</span>
              {node.costInfo && (
                <span>Cost: ${node.costInfo.totalCost.toFixed(4)}</span>
              )}
            </div>
          </div>
        );
      })
      )}
    </div>
  );

  const renderNodeDetails = () => {
    if (!selectedNode) return null;

    return (
      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Detailed Node Analysis</span>
            <div className="flex space-x-2">
              <Badge style={{ backgroundColor: getNodeColor(selectedNode) }} className="text-white">
                {selectedNode.componentType}
              </Badge>
              <Badge className={getModelBadgeColor(selectedNode.agentId)}>
                {selectedNode.agentId.includes('gpt4o') ? 'GPT-4o' : 'GPT-4.1'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Basic Information */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Basic Information</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Node ID:</span>
                <p className="font-mono text-xs mt-1 p-2 bg-gray-100 rounded">{selectedNode.id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Agent:</span>
                <p className="mt-1">{selectedNode.agentId}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Timestamp:</span>
                <p className="mt-1">{new Date(selectedNode.timestamp).toLocaleString()}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Component:</span>
                <p className="capitalize mt-1">{selectedNode.componentType}</p>
              </div>
            </div>
          </div>

          <Separator />

          {/* Cost & Performance Metrics */}
          {selectedNode.costInfo && (
            <>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Performance Metrics</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {selectedNode.costInfo.totalTokens.toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-600">Total Tokens</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      ${selectedNode.costInfo.totalCost.toFixed(4)}
                    </div>
                    <div className="text-xs text-gray-600">API Cost</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">
                      {(selectedNode.costInfo.duration / 1000).toFixed(1)}s
                    </div>
                    <div className="text-xs text-gray-600">Duration</div>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Cryptographic Proof */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Cryptographic Proof of Agency</h4>
            <div className="space-y-2">
              <div>
                <span className="font-medium text-gray-600">Digital Signature:</span>
                <div className="mt-1 p-3 bg-gray-100 rounded-lg">
                  <p className="font-mono text-xs break-all">{selectedNode.signature}</p>
                </div>
              </div>
              <div className="text-xs text-gray-500 italic">
                This signature provides cryptographic proof that the analysis was performed by the specified agent
              </div>
            </div>
          </div>

          <Separator />

          {/* Data Sources & Provenance */}
          {selectedNode.dataSources.length > 0 && (
            <>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Data Sources & Provenance</h4>
                <div className="flex flex-wrap gap-2">
                  {selectedNode.dataSources.map((source, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {source}
                    </Badge>
                  ))}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Causal Chain */}
          {selectedNode.parentNodes && selectedNode.parentNodes.length > 0 && (
            <>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Causal Chain Dependencies</h4>
                <div className="space-y-2">
                  {selectedNode.parentNodes.map((parentId, index) => {
                    const parentNode = nodes.find(n => n.id === parentId);
                    return (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-red-50 rounded">
                        <Badge variant="outline" className="text-xs font-mono">
                          {parentId.slice(-8)}
                        </Badge>
                        {parentNode && (
                          <span className="text-sm text-gray-600">
                            {parentNode.agentId} ({parentNode.componentType})
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Reasoning */}
          {selectedNode.reasoning && (
            <>
              <div>
                <h4 className="font-semibold text-gray-800 mb-3">Agent Reasoning</h4>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm">{selectedNode.reasoning}</p>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Result Data */}
          {selectedNode.resultData && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">Analysis Results</h4>
              <div className="max-h-60 overflow-auto">
                <pre className="text-xs p-3 bg-gray-50 rounded-lg overflow-x-auto">
                  {JSON.stringify(selectedNode.resultData, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const componentTypes = [...new Set(nodes.map(n => n.componentType))];
  const agentTypes = [...new Set(nodes.map(n => n.agentId.split('-')[0] + '-' + n.agentId.split('-')[1]))];

  return (
    <div className="space-y-6">
      <Card className="shadow-2xl border-0 bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-6 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5 border-b border-gray-200/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {/* Enhanced logo */}
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-xl tracking-wider">DKG</span>
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-white flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              
              <div className="space-y-2">
                <CardTitle className="text-2xl font-bold text-gray-900 tracking-tight">
                  Decentralized Knowledge Graph
                </CardTitle>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                    <Badge className="bg-blue-100/80 text-blue-800 border-blue-200/50 font-semibold px-3 py-1">
                      {nodePositions.length} nodes
                    </Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }}></div>
                    <Badge className="bg-green-100/80 text-green-800 border-green-200/50 font-semibold px-3 py-1">
                      {connections.length} connections
                    </Badge>
                  </div>
                  {loading && (
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"></div>
                      <Badge className="bg-orange-100/80 text-orange-800 border-orange-200/50 font-semibold px-3 py-1">
                        syncing...
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              {/* Enhanced View Mode Controls */}
              <div className="flex bg-white/80 backdrop-blur-sm rounded-2xl border border-gray-200/50 shadow-lg p-1">
                {[
                  { mode: 'network', icon: '🔗', label: 'Network' },
                  { mode: 'timeline', icon: '⏱️', label: 'Timeline' },
                  { mode: 'graph', icon: '📊', label: 'Graph' },
                  { mode: 'list', icon: '📋', label: 'List' }
                ].map(({ mode, icon, label }) => (
                  <Button
                    key={mode}
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewMode(mode as any)}
                    className={`relative px-4 py-2 rounded-xl font-medium transition-all duration-300 ${
                      viewMode === mode 
                        ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105' 
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100/50'
                    }`}
                  >
                    <span className="flex items-center space-x-2">
                      <span>{icon}</span>
                      <span className="hidden sm:inline">{label}</span>
                    </span>
                    {viewMode === mode && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/20 to-indigo-500/20 animate-pulse"></div>
                    )}
                  </Button>
                ))}
              </div>
              
              {/* Enhanced Refresh Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDKGData}
                disabled={loading}
                className="bg-white/80 backdrop-blur-sm border-gray-200/50 hover:bg-white hover:shadow-lg transition-all duration-300 px-4 py-2 rounded-xl font-medium"
              >
                <div className="flex items-center space-x-2">
                  <div className={`transition-transform duration-500 ${loading ? 'animate-spin' : ''}`}>
                    {loading ? '🔄' : '🔄'}
                  </div>
                  <span className="hidden sm:inline">
                    {loading ? 'Syncing...' : 'Refresh'}
                  </span>
                </div>
              </Button>
            </div>
          </div>
          
          {/* Filters */}
          <div className="flex items-center justify-between mt-4 p-3 bg-white rounded-lg border shadow-sm">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Component:</label>
                <select
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filterComponent}
                  onChange={(e) => setFilterComponent(e.target.value)}
                >
                  <option value="all">All Components</option>
                  {componentTypes.map(type => (
                    <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                  ))}
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-sm font-medium text-gray-700">Agent:</label>
                <select
                  className="text-sm border border-gray-300 rounded-md px-3 py-1 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={filterAgent}
                  onChange={(e) => setFilterAgent(e.target.value)}
                >
                  <option value="all">All Agents</option>
                  {agentTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showSignatures}
                  onChange={(e) => setShowSignatures(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Show Signatures</span>
              </label>
              
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={showCostInfo}
                  onChange={(e) => setShowCostInfo(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-gray-700">Show Costs</span>
              </label>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-lg border">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
              <div className="text-gray-600 font-medium">Loading Knowledge Graph...</div>
              <div className="text-gray-500 text-sm mt-1">Fetching node relationships and analysis data</div>
            </div>
          ) : (
            <>
              {viewMode === 'network' && renderNetworkView()}
              {viewMode === 'timeline' && renderTimelineView()}
              {viewMode === 'graph' && renderGraphView()}
              {viewMode === 'list' && renderListView()}
              
              {/* Legend - Always visible */}
              <div className="mt-6 bg-gray-50 rounded-lg p-4 border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <div className="w-4 h-4 bg-blue-600 rounded mr-2"></div>
                      Components
                    </h5>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-blue-500 rounded-full shadow-sm"></div>
                        <span className="text-gray-700">Sentiment</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-green-500 rounded-full shadow-sm"></div>
                        <span className="text-gray-700">Technical</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-purple-500 rounded-full shadow-sm"></div>
                        <span className="text-gray-700">Macro</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 bg-orange-500 rounded-full shadow-sm"></div>
                        <span className="text-gray-700">Insights</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-semibold text-gray-800 mb-3 flex items-center">
                      <div className="w-4 h-1 bg-red-500 rounded mr-2"></div>
                      Connections
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center space-x-2">
                        <svg width="20" height="8" className="flex-shrink-0">
                          <line x1="0" y1="4" x2="20" y2="4" stroke="#ef4444" strokeWidth="2"/>
                        </svg>
                        <span className="text-gray-700">Causal Chain</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg width="20" height="8" className="flex-shrink-0">
                          <line x1="0" y1="4" x2="20" y2="4" stroke="#06b6d4" strokeWidth="2" strokeDasharray="6,3"/>
                        </svg>
                        <span className="text-gray-700">Temporal</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <svg width="20" height="8" className="flex-shrink-0">
                          <line x1="0" y1="4" x2="20" y2="4" stroke="#84cc16" strokeWidth="2" strokeDasharray="10,5"/>
                        </svg>
                        <span className="text-gray-700">Agent Relations</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {renderNodeDetails()}
    </div>
  );
} 