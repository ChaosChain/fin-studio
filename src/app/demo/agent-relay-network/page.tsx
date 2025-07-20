'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import AgentRelayNetworkStatus from '@/components/AgentRelayNetworkStatus';

export default function AgentRelayNetworkDemo() {
  const [demoStep, setDemoStep] = useState(0);
  const [isRunningDemo, setIsRunningDemo] = useState(false);
  const [demoLogs, setDemoLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setDemoLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDemo = async (step: number) => {
    setIsRunningDemo(true);
    setDemoStep(step);
    
    try {
      switch (step) {
        case 1:
          await demoAgentDiscovery();
          break;
        case 2:
          await demoServiceRequest();
          break;
        case 3:
          await demoTaskCoordination();
          break;
        case 4:
          await demoNetworkHealth();
          break;
        default:
          await demoFullWorkflow();
      }
    } catch (error) {
      addLog(`❌ Demo error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsRunningDemo(false);
    }
  };

  const demoAgentDiscovery = async () => {
    addLog('🔍 Starting Agent Discovery Demo...');
    
    // Simulate agent discovery
    await new Promise(resolve => setTimeout(resolve, 1000));
    addLog('📡 Scanning relay network for available agents...');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    addLog('🤖 Found Market Research Agent (Reputation: 85%, Cost: $0.01)');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    addLog('🤖 Found Macro Research Agent (Reputation: 78%, Cost: $0.02)');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    addLog('🤖 Found Price Analysis Agent (Reputation: 92%, Cost: $0.005)');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    addLog('🤖 Found Insights Agent (Reputation: 88%, Cost: $0.03)');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    addLog('✅ Agent discovery complete! 4 agents discovered across 3 relay nodes');
  };

  const demoServiceRequest = async () => {
    addLog('📤 Starting Service Request Demo...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    addLog('🎯 Requesting market analysis for AAPL from best available agent...');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    addLog('🔄 Routing request to Price Analysis Agent (highest reputation: 92%)');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    addLog('📊 Agent processing technical analysis...');
    
    await new Promise(resolve => setTimeout(resolve, 2500));
    addLog('📥 Received response: AAPL showing bullish momentum, 65% breakout probability');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    addLog('💰 Payment processed: $0.005 USDC released to agent');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    addLog('✅ Service request completed successfully!');
  };

  const demoTaskCoordination = async () => {
    addLog('🎯 Starting Multi-Agent Task Coordination Demo...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    addLog('📋 Coordinating comprehensive analysis task for AAPL...');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    addLog('🔄 Assigning Market Research Agent: sentiment analysis');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    addLog('🔄 Assigning Macro Research Agent: economic indicators');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    addLog('🔄 Assigning Price Analysis Agent: technical analysis');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    addLog('🔄 Assigning Insights Agent: report synthesis');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    addLog('⚡ All agents working in parallel...');
    
    await new Promise(resolve => setTimeout(resolve, 3000));
    addLog('📊 Market Research: Positive sentiment (confidence: 7.2/10)');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    addLog('📈 Macro Research: Favorable economic conditions (confidence: 6.8/10)');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    addLog('📉 Price Analysis: Bullish technical signals (confidence: 8.1/10)');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    addLog('📋 Insights Agent: Synthesizing final report...');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    addLog('✅ Task coordination complete! All agents reached consensus');
  };

  const demoNetworkHealth = async () => {
    addLog('🏥 Starting Network Health Monitoring Demo...');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    addLog('📡 Pinging all relay nodes...');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    addLog('✅ local-relay-1: Connected (45ms latency)');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    addLog('✅ local-relay-2: Connected (62ms latency)');
    
    await new Promise(resolve => setTimeout(resolve, 800));
    addLog('✅ local-relay-3: Connected (38ms latency)');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    addLog('📊 Network status: 3/3 relays online, 4 agents active');
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    addLog('🔍 Checking agent availability...');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    addLog('✅ All agents responding within acceptable latency');
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    addLog('🎯 Network health: EXCELLENT (100% uptime)');
  };

  const demoFullWorkflow = async () => {
    addLog('🚀 Starting Complete Agent Relay Network Workflow Demo...');
    
    // Run all demos in sequence
    await demoAgentDiscovery();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await demoServiceRequest();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await demoTaskCoordination();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    await demoNetworkHealth();
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    addLog('🎉 Complete workflow demonstration finished!');
  };

  const clearLogs = () => {
    setDemoLogs([]);
    setDemoStep(0);
  };

  const demoSteps = [
    {
      id: 1,
      title: 'Agent Discovery',
      description: 'Discover available agents in the relay network',
      icon: '🔍'
    },
    {
      id: 2,
      title: 'Service Request',
      description: 'Request service from the best available agent',
      icon: '📤'
    },
    {
      id: 3,
      title: 'Task Coordination',
      description: 'Coordinate multi-agent collaborative tasks',
      icon: '🎯'
    },
    {
      id: 4,
      title: 'Network Health',
      description: 'Monitor relay network health and performance',
      icon: '🏥'
    }
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Agent Relay Network Demo</h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Experience decentralized agent discovery, service routing, and task coordination 
          in action. This demo showcases how agents communicate through relay networks 
          to provide efficient and fault-tolerant AI services.
        </p>
      </div>

      {/* Demo Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Interactive Demo Controls</CardTitle>
          <CardDescription>
            Choose a specific feature to demonstrate or run the complete workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {demoSteps.map((step) => (
              <Card 
                key={step.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  demoStep === step.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
                }`}
                onClick={() => !isRunningDemo && runDemo(step.id)}
              >
                <CardContent className="p-4 text-center">
                  <div className="text-2xl mb-2">{step.icon}</div>
                  <h3 className="font-semibold mb-1">{step.title}</h3>
                  <p className="text-sm text-gray-600">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => runDemo(0)}
              disabled={isRunningDemo}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {isRunningDemo ? 'Running Demo...' : '🚀 Run Complete Workflow'}
            </Button>
            
            <Button 
              onClick={clearLogs}
              variant="outline"
              size="lg"
            >
              🧹 Clear Logs
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Demo Logs */}
      {demoLogs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Demo Activity Log</CardTitle>
            <CardDescription>
              Real-time log of Agent Relay Network operations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-green-400 p-4 rounded-lg font-mono text-sm max-h-96 overflow-y-auto">
              {demoLogs.map((log, index) => (
                <div key={index} className="mb-1">
                  {log}
                </div>
              ))}
              {isRunningDemo && (
                <div className="animate-pulse">
                  <span className="inline-block w-2 h-4 bg-green-400 mr-2"></span>
                  Processing...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Live Network Status */}
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">Live Network Status</h2>
        <AgentRelayNetworkStatus />
      </div>

      {/* Feature Highlights */}
      <Card>
        <CardHeader>
          <CardTitle>Agent Relay Network Features</CardTitle>
          <CardDescription>
            Key capabilities demonstrated in this system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                🌐 Decentralized Discovery
              </h3>
              <p className="text-sm text-gray-600">
                Agents automatically discover each other across multiple relay nodes 
                without central coordination.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                🎯 Intelligent Routing
              </h3>
              <p className="text-sm text-gray-600">
                Requests are routed to the best available agent based on capabilities, 
                reputation, and cost.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                ⚡ Multi-Agent Coordination
              </h3>
              <p className="text-sm text-gray-600">
                Complex tasks are coordinated across multiple agents working 
                in parallel for optimal results.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                🏥 Health Monitoring
              </h3>
              <p className="text-sm text-gray-600">
                Real-time monitoring of relay node health, latency, and agent 
                availability.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                💰 Cost Optimization
              </h3>
              <p className="text-sm text-gray-600">
                Automatic selection of cost-effective agents while maintaining 
                quality standards.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-semibold flex items-center gap-2">
                🔒 Fault Tolerance
              </h3>
              <p className="text-sm text-gray-600">
                Multiple relay nodes provide redundancy and ensure system 
                reliability.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Technical Architecture */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Architecture</CardTitle>
          <CardDescription>
            How the Agent Relay Network operates under the hood
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">1. Agent Registration</h4>
              <p className="text-sm text-gray-600">
                Agents announce their capabilities, costs, and specialties to the relay network.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">2. Service Discovery</h4>
              <p className="text-sm text-gray-600">
                Clients discover available agents by capability and select the best match.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">3. Request Routing</h4>
              <p className="text-sm text-gray-600">
                Requests are intelligently routed through relay nodes to target agents.
              </p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-semibold mb-2">4. Task Coordination</h4>
              <p className="text-sm text-gray-600">
                Multi-agent tasks are coordinated with parallel execution and result aggregation.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 