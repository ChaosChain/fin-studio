import { NextRequest, NextResponse } from 'next/server';
import { dkgManager, DKGNode } from '@/lib/dkg';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');
    
    // Clean up old nodes to prevent memory buildup
    dkgManager.clearOldNodes();
    
    // Get nodes - if no taskId specified, use current task or most recent task
    let nodes: any[];
    if (taskId) {
      nodes = dkgManager.getNodesByTask(taskId);
      console.log(`DKG API: Retrieved ${nodes.length} nodes for specific task ${taskId}`);
    } else {
      // If no taskId specified, try current task first, then most recent task
      const currentTaskId = dkgManager.getCurrentTaskId();
      if (currentTaskId) {
        nodes = dkgManager.getNodesByTask(currentTaskId);
        console.log(`DKG API: Retrieved ${nodes.length} nodes for current task ${currentTaskId}`);
      } else {
        // No current task, find most recent task
        const allNodes = dkgManager.getAllTimeStats();
        if (Object.keys(allNodes.nodesByTask).length > 0) {
          const taskIds = Object.keys(allNodes.nodesByTask).sort();
          const mostRecentTaskId = taskIds[taskIds.length - 1];
          nodes = dkgManager.getNodesByTask(mostRecentTaskId);
          console.log(`DKG API: Retrieved ${nodes.length} nodes for most recent task ${mostRecentTaskId}`);
        } else {
          nodes = [];
          console.log(`DKG API: No tasks found, returning empty nodes`);
        }
      }
    }
    
    // Transform nodes for visualization
    const transformedNodes = nodes.map((node: DKGNode) => ({
      id: node.id,
      agentId: node.agentId,
      componentType: node.componentType || 'unknown',
      timestamp: node.timestamp,
      signature: node.signature,
      resultData: node.resultData,
      reasoning: node.reasoning,
      dataSources: node.dataSources || [],
      parentNodes: node.parentNodes || [],
      costInfo: node.resultData?.costInfo ? {
        totalTokens: node.resultData.costInfo.totalTokens,
        totalCost: node.resultData.costInfo.totalCost,
        duration: node.resultData.costInfo.duration
      } : undefined
    }));

    // Sort by timestamp (newest first)
    transformedNodes.sort((a: any, b: any) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      success: true,
      nodes: transformedNodes,
      count: transformedNodes.length,
      taskId: taskId || 'all'
    });

  } catch (error) {
    console.error('Error fetching DKG nodes:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch DKG nodes',
      nodes: [],
      count: 0
    }, { status: 500 });
  }
} 