import React from 'react';
import { TimelineItem } from '@/types/complaint';
import { formatDate } from '@/lib/formatters';
import { StatusBadge } from './StatusBadge';
import { CheckCircle2, Clock, Send, RefreshCw, FileText } from 'lucide-react';

export interface TimelineViewProps {
  timeline: TimelineItem[];
  currentStatus?: string;
}

export const TimelineView: React.FC<TimelineViewProps> = ({ timeline }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="py-8 text-center text-slate-500 text-sm bg-slate-50 rounded-xl border border-dashed border-slate-200">
        <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
        <p className="font-medium text-navy-900">No public events logged yet</p>
        <p className="text-xs text-slate-400 mt-1">
          Public status updates will appear here as your grievance progresses through intake.
        </p>
      </div>
    );
  }

  const getActionIcon = (actionType: string) => {
    switch (actionType.toLowerCase()) {
      case 'submitted':
        return <Send className="w-4 h-4 text-civic-blue" />;
      case 'updated':
        return <RefreshCw className="w-4 h-4 text-amber-600" />;
      case 'action_added':
      case 'action':
        return <FileText className="w-4 h-4 text-blue-600" />;
      case 'disposed':
      case 'closed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      default:
        return <Clock className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {timeline.map((item, index) => {
        const isLatest = index === timeline.length - 1;
        return (
          <div key={item.id} className="relative group">
            {/* Timeline bullet / icon */}
            <div
              className={`absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                isLatest
                  ? 'bg-blue-50 border-civic-blue text-civic-blue shadow-subtle'
                  : 'bg-white border-slate-300 text-slate-500'
              }`}
            >
              {getActionIcon(item.action_type)}
            </div>

            {/* Content card */}
            <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-subtle group-hover:border-slate-300 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {item.action_type.replace(/_/g, ' ')}
                  </span>
                  {item.new_status && (
                    <StatusBadge status={item.new_status} showDot={false} className="py-0 text-[10px]" />
                  )}
                </div>
                <time className="text-xs text-slate-400 font-medium">
                  {formatDate(item.created_at)}
                </time>
              </div>

              <p className="text-sm text-navy-900 leading-relaxed font-normal">
                {item.description}
              </p>

              {item.previous_status && item.new_status && item.previous_status !== item.new_status && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs text-slate-500">
                  <span className="text-slate-400">Status transition:</span>
                  <span className="capitalize font-medium text-slate-600">
                    {item.previous_status.replace(/_/g, ' ')}
                  </span>
                  <span className="text-slate-400">→</span>
                  <span className="capitalize font-semibold text-navy-900">
                    {item.new_status.replace(/_/g, ' ')}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
