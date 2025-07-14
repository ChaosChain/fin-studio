'use client';

import { useApp } from '@/app/providers';

export function ConnectionStatus() {
  const { isConnected, agents, loading } = useApp();

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="loading-spinner h-4 w-4"></div>
        <span className="text-sm text-gray-600 dark:text-gray-400">Connecting...</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
          Connected ({agents.length} agents)
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
      <span className="text-sm text-red-600 dark:text-red-400 font-medium">
        Disconnected
      </span>
    </div>
  );
} 