'use client';

import { useApp } from '@/app/providers';
import { AgentWorkflow } from '@/components/AgentWorkflow';
import { AgentStatus } from '@/components/AgentStatus';
import { ConnectionStatus } from '@/components/ConnectionStatus';

export default function DashboardPage() {
  const { agents, isConnected } = useApp();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 dark:from-gray-900 dark:via-purple-900 dark:to-blue-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold gradient-text mb-2">
                Agent Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                A2A Agent Workflow Demo
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="/"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                🏠 Home
              </a>
              <a
                href="/demo"
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors"
              >
                💳 Payment Demo
              </a>
            </div>
          </div>
          <div className="text-center">
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              Monitor and interact with AI agents using the A2A (Agent-to-Agent) protocol for real-time collaboration.
            </p>
          </div>
        </div>

        {/* Connection Status */}
        <div className="mb-8">
          <ConnectionStatus />
        </div>

        {!isConnected ? (
          <div className="text-center py-16">
            <div className="glass-card rounded-xl p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-semibold mb-4">Connect to Agents</h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Connect to the A2A gateway to start interacting with AI agents
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Agent Status Overview */}
            <div className="glass-card rounded-xl p-6">
              <h2 className="text-2xl font-semibold mb-4">Agent Status</h2>
              <AgentStatus agents={agents} />
            </div>

            {/* Agent Workflow Demo */}
            <AgentWorkflow />
          </div>
        )}
      </div>
    </div>
  );
} 