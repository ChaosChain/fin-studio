'use client';

import { DailyInsight } from '@/types/fintech';

interface InsightsFeedProps {
  insights: DailyInsight[];
  loading: boolean;
}

export function InsightsFeed({ insights, loading }: InsightsFeedProps) {
  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="loading-spinner h-8 w-8 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Generating insights...</p>
      </div>
    );
  }

  if (insights.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600 dark:text-gray-400 mb-4">No insights available</p>
        <p className="text-sm text-gray-500 dark:text-gray-500">
          Request daily insights to see AI-generated analysis
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {insights.map((insight) => (
        <div key={insight.id} className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">{insight.title}</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {insight.date.toLocaleDateString()}
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-4">{insight.summary}</p>
          <div className="space-y-4">
            {insight.sections.map((section, index) => (
              <div key={index} className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 className="font-medium text-base mb-2">{section.title}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">{section.content}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
} 