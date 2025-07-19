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

  // Advanced layout calculation with force-directed positioning
  const calculateAdvancedLayout = (nodeList: DKGNode[]) => {
    const positions: NodePosition[] = [];
    const connections: Connection[] = [];
    
    // Filter nodes based on current filters
    const filteredNodes = nodeList.filter(node => {
      const componentMatch = filterComponent === 'all' || node.componentType === filterComponent;
      const agentMatch = filterAgent === 'all' || node.agentId.includes(filterAgent);
      return componentMatch && agentMatch;
    });

    // Create initial positions using force-directed layout
    const centerX = 400;
    const centerY = 300;
    const componentTypes = [...new Set(filteredNodes.map(n => n.componentType))];
    const agentTypes = [...new Set(filteredNodes.map(n => n.agentId.split('-')[0] + '-' + n.agentId.split('-')[1]))];
    
    filteredNodes.forEach((node, index) => {
      const componentIndex = componentTypes.indexOf(node.componentType);
      const agentBaseType = node.agentId.split('-')[0] + '-' + node.agentId.split('-')[1];
      const agentIndex = agentTypes.indexOf(agentBaseType);
      const isGpt4o = node.agentId.includes('gpt4o');
      
      // Circular layout with component-based clustering
      const angle = (componentIndex / componentTypes.length) * 2 * Math.PI;
      const radius = 150 + (agentIndex * 80);
      const offsetRadius = isGpt4o ? 40 : 0;
      
      const x = centerX + Math.cos(angle) * (radius + offsetRadius);
      const y = centerY + Math.sin(angle) * (radius + offsetRadius);
      
      positions.push({ 
        x: Math.max(50, Math.min(750, x)), 
        y: Math.max(50, Math.min(550, y)), 
        id: node.id, 
        node 
      });
    });

    // Calculate connections
    positions.forEach((pos, index) => {
      const node = pos.node;
      
      // Parent-child relationships (causal chains) - if they exist
      if (node.parentNodes && node.parentNodes.length > 0) {
        node.parentNodes.forEach(parentId => {
          const parentPos = positions.find(p => p.id === parentId);
          if (parentPos) {
            connections.push({
              from: parentPos,
              to: pos,
              type: 'causal'
            });
          }
        });
      }
      
      // Temporal connections (same component, different agents)
      positions.forEach(otherPos => {
        if (pos.id !== otherPos.id && 
            pos.node.componentType === otherPos.node.componentType) {
          // Only create one connection per pair to avoid duplicates
          if (pos.id < otherPos.id) {
            connections.push({
              from: pos,
              to: otherPos,
              type: 'temporal'
            });
          }
        }
      });
      
      // Agent relationships (same base agent type, different components)
      const baseAgentType = pos.node.agentId.split('-').slice(0, -1).join('-');
      positions.forEach(otherPos => {
        const otherBaseAgentType = otherPos.node.agentId.split('-').slice(0, -1).join('-');
        if (pos.id !== otherPos.id && 
            baseAgentType === otherBaseAgentType &&
            pos.node.componentType !== otherPos.node.componentType) {
          // Only create one connection per pair to avoid duplicates
          if (pos.id < otherPos.id) {
            connections.push({
              from: pos,
              to: otherPos,
              type: 'agent'
            });
          }
        }
      });
      
      // Cross-component connections (insights connects to all other components)
      if (pos.node.componentType === 'insights') {
        positions.forEach(otherPos => {
          if (pos.id !== otherPos.id && otherPos.node.componentType !== 'insights') {
            connections.push({
              from: otherPos,
              to: pos,
              type: 'causal'
            });
          }
        });
      }
    });
    
    console.log(`DKG Visualizer: Calculated ${positions.length} positions and ${connections.length} connections`);
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
    <div className="relative w-full h-[700px] border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      {/* Background grid pattern */}
      <div className="absolute inset-0 opacity-20">
        <svg className="w-full h-full">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e5e7eb" strokeWidth="1"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <svg className="absolute inset-0 w-full h-full z-10">
        {/* Render connections */}
        {connections.map((conn, index) => (
          <g key={index}>
            <line
              x1={conn.from.x + getNodeSize(conn.from.node) / 2}
              y1={conn.from.y + getNodeSize(conn.from.node) / 2}
              x2={conn.to.x + getNodeSize(conn.to.node) / 2}
              y2={conn.to.y + getNodeSize(conn.to.node) / 2}
              stroke={getConnectionColor(conn.type)}
              strokeWidth={conn.type === 'causal' ? 3 : 2}
              strokeDasharray={conn.type === 'temporal' ? '6,3' : conn.type === 'agent' ? '10,5' : 'none'}
              opacity={0.7}
              markerEnd="url(#arrowhead)"
              className="transition-opacity hover:opacity-100"
            />
          </g>
        ))}
        
        {/* Arrow marker definitions */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="8"
            markerHeight="6"
            refX="7"
            refY="3"
            orient="auto"
          >
            <polygon
              points="0 0, 8 3, 0 6"
              fill="#6b7280"
            />
          </marker>
        </defs>
      </svg>
      
      {/* Empty state overlay when no nodes */}
      {nodePositions.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-30 bg-white bg-opacity-90">
          <div className="text-center p-6">
            <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="text-gray-600 font-medium mb-2">No Analysis Data</div>
            <div className="text-gray-500 text-sm max-w-xs">
              Run an analysis to see agent nodes and connections appear here
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
            className={`absolute cursor-pointer transition-all duration-300 z-20 ${
              isSelected ? 'ring-3 ring-blue-500 ring-opacity-60' : ''
            } ${isHovered ? 'scale-110' : ''}`}
            style={{ 
              left: pos.x, 
              top: pos.y,
              width: size,
              height: size
            }}
            onClick={() => setSelectedNode(node)}
            onMouseEnter={() => setHoveredNode(node.id)}
            onMouseLeave={() => setHoveredNode(null)}
          >
            {/* Node circle with gradient */}
            <div 
              className="w-full h-full rounded-full shadow-xl border-3 border-white flex items-center justify-center relative overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${getNodeColor(node)}, ${getNodeColor(node)}dd)`
              }}
            >
              {/* Inner glow effect */}
              <div className="absolute inset-1 rounded-full bg-white bg-opacity-10"></div>
              
              {/* Component icon */}
              <span className="text-white text-sm font-bold relative z-10">
                {node.componentType.slice(0, 1).toUpperCase()}
              </span>
              
              {/* Model indicator */}
              <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full border border-white"
                   style={{ backgroundColor: node.agentId.includes('gpt4o') ? '#f97316' : '#3b82f6' }}>
              </div>
            </div>
            
            {/* Node label */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 mt-2 text-center">
              <div className="text-xs font-semibold text-gray-800 bg-white px-2 py-1 rounded-md shadow-sm border">
                {node.componentType}
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {node.agentId.includes('gpt4o') ? 'GPT-4o' : 'GPT-4.1'}
              </div>
              {showCostInfo && node.costInfo && (
                <div className="text-xs text-gray-500 mt-1">
                  ${node.costInfo.totalCost.toFixed(3)}
                </div>
              )}
            </div>
            
            {/* Hover tooltip */}
            {isHovered && (
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 bg-gray-900 text-white p-3 rounded-lg text-xs whitespace-nowrap z-40 shadow-xl border border-gray-700">
                <div className="font-semibold text-blue-300">{node.componentType.charAt(0).toUpperCase() + node.componentType.slice(1)} Analysis</div>
                <div className="text-gray-300 mt-1">{node.agentId}</div>
                <div className="text-gray-400 mt-1">{formatTimestamp(node.timestamp)}</div>
                {node.costInfo && (
                  <div className="text-green-400 mt-1">
                    {node.costInfo.totalTokens.toLocaleString()} tokens • ${node.costInfo.totalCost.toFixed(4)}
                  </div>
                )}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
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
      <Card className="shadow-lg border-0 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">DKG</span>
              </div>
              <div>
                <CardTitle className="text-xl font-bold text-gray-900">Decentralized Knowledge Graph</CardTitle>
                <div className="flex items-center space-x-3 mt-1">
                  <Badge className="bg-blue-100 text-blue-800 border-blue-200">{nodePositions.length} nodes</Badge>
                  <Badge className="bg-green-100 text-green-800 border-green-200">{connections.length} connections</Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {/* View Mode Controls */}
              <div className="flex bg-white rounded-lg border shadow-sm">
                <Button
                  variant={viewMode === 'network' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('network')}
                  className={`rounded-r-none ${viewMode === 'network' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
                >
                  Network
                </Button>
                <Button
                  variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('timeline')}
                  className={`rounded-none border-x ${viewMode === 'timeline' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
                >
                  Timeline
                </Button>
                <Button
                  variant={viewMode === 'graph' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('graph')}
                  className={`rounded-none border-x ${viewMode === 'graph' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
                >
                  Graph
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className={`rounded-l-none ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}
                >
                  List
                </Button>
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDKGData}
                disabled={loading}
                className="bg-white border-gray-300 hover:bg-gray-50"
              >
                {loading ? 'Loading...' : 'Refresh'}
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