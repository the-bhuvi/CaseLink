import React from 'react';
import { Link } from 'react-router-dom';
import { CaseResponse } from '@/types/complaint';
import { StatusBadge } from './StatusBadge';
import { formatDateOnly, formatTimeAgo } from '@/lib/formatters';
import { Building2, Calendar, ChevronRight, Tag, Hash } from 'lucide-react';

export interface ComplaintCardProps {
  complaint: CaseResponse;
}

export const ComplaintCard: React.FC<ComplaintCardProps> = ({ complaint }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 shadow-card hover:shadow-hover hover:border-slate-300 transition-all duration-200 p-5 group flex flex-col justify-between">
      <div className="space-y-3">
        {/* Top bar: Reference & Status */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <Hash className="w-3.5 h-3.5 text-civic-blue" />
            <span className="font-mono text-navy-900 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {complaint.reference}
            </span>
          </div>
          <StatusBadge status={complaint.status} />
        </div>

        {/* Institution */}
        <div className="flex items-start gap-2">
          <Building2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <h4 className="text-sm font-semibold text-navy-900 line-clamp-1 leading-snug">
              {complaint.institution_name}
            </h4>
            {complaint.institution_permanent_id && (
              <p className="text-[11px] text-slate-500">
                AICTE ID: {complaint.institution_permanent_id}
              </p>
            )}
          </div>
        </div>

        {/* Subject */}
        <div>
          <p className="text-sm font-medium text-slate-800 line-clamp-2 leading-relaxed">
            {complaint.subject}
          </p>
        </div>
      </div>

      {/* Bottom meta & action */}
      <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded text-[11px] font-medium text-slate-600 border border-slate-200/60">
            <Tag className="w-3 h-3 text-slate-400" />
            {complaint.category}
          </span>
          <span className="inline-flex items-center gap-1 text-[11px]" title={formatDateOnly(complaint.received_at)}>
            <Calendar className="w-3 h-3 text-slate-400" />
            {formatTimeAgo(complaint.received_at)}
          </span>
        </div>

        <Link
          to={`/my-complaints/${complaint.id}`}
          className="inline-flex items-center gap-1 font-semibold text-civic-blue hover:text-civic-blue-hover text-xs group-hover:translate-x-0.5 transition-transform"
        >
          <span>View Timeline</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
};
