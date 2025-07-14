'use client';

import { AgentIdentity } from '@/types/a2a';

interface AgentStatusProps {
  agents: AgentIdentity[];
}

export function AgentStatus({ agents }: AgentStatusProps) {
  if (agents.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-gray-500 dark:text-gray-400 mb-2">No agents connected</div>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Make sure the agent manager is running and accessible
        </p>
      </div>
    );
  }

  const getStatusColor = (agentType: string) => {
    switch (agentType) {
      case 'market_research':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'macro_research':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'price_analysis':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'insights_reporter':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getAgentIcon = (agentType: string) => {
    switch (agentType) {
      case 'market_research':
        return '📊';
      case 'macro_research':
        return '🌍';
      case 'price_analysis':
        return '📈';
      case 'insights_reporter':
        return '📝';
      default:
        return '🤖';
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {agents.map((agent) => (
        <div
          key={agent.id}
          className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-2xl">{getAgentIcon(agent.type)}</span>
              <div>
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">
                  {agent.name}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  v{agent.version}
                </p>
              </div>
            </div>
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                Active
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(agent.type)}`}>
              {agent.type.replace('_', ' ').toUpperCase()}
            </div>
            
            <div className="text-xs text-gray-600 dark:text-gray-400">
              <div className="font-medium mb-1">Capabilities:</div>
              <div className="flex flex-wrap gap-1">
                {agent.capabilities.slice(0, 3).map((capability, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300"
                  >
                    {capability.replace('_', ' ')}
                  </span>
                ))}
                {agent.capabilities.length > 3 && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                    +{agent.capabilities.length - 3} more
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
} 