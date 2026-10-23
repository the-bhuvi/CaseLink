import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient, isUsingMockFallback } from '@/lib/api-client';
import { AlertTriangle, WifiOff, RefreshCw } from 'lucide-react';

export const ServiceBanner: React.FC = () => {
  const { isError, refetch, isFetching } = useQuery({
    queryKey: ['backend-health'],
    queryFn: () => apiClient.checkHealth(),
    retry: false,
    staleTime: 30000,
    refetchInterval: 60000,
  });

  if (isUsingMockFallback) {
    return (
      <div className="bg-amber-500 text-navy-950 px-4 py-2 text-xs font-medium border-b border-amber-600 flex items-center justify-between">
        <div className="max-w-7xl mx-auto flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-navy-900 shrink-0" />
          <span>
            <strong>Local Prototype Mode:</strong> Backend server is currently offline or unreachable at{' '}
            <code className="bg-amber-400 px-1 py-0.5 rounded text-[11px]">
              {import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}
            </code>
            . Showing simulated fixture data.
          </span>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-rose-50 text-rose-900 px-4 py-2 text-xs border-b border-rose-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Backend Disconnected:</strong> Cannot connect to FastAPI backend service at{' '}
              <span className="font-mono text-rose-700">{import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}</span>.
              Please ensure the backend is running.
            </span>
          </div>
          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white rounded border border-rose-300 text-rose-800 text-xs font-semibold hover:bg-rose-100/50 transition-colors"
          >
            <RefreshCw className={`w-3 h-3 ${isFetching ? 'animate-spin' : ''}`} />
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  return null;
};
