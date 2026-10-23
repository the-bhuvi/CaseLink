import React from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { CaseResponse } from '@/types/complaint';
import { Button } from '@/components/ui/Button';
import { StatusBadge } from '@/components/complaint/StatusBadge';
import { formatDate } from '@/lib/formatters';
import {
  CheckCircle2,
  Copy,
  ArrowRight,
  Home,
  Shield,
  Building2,
  Clock,
  Search,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export const ConfirmationPage: React.FC = () => {
  const { reference } = useParams<{ reference: string }>();
  const location = useLocation();
  const { showToast } = useToast();

  const passedCase = location.state?.caseData as CaseResponse | undefined;

  // If not passed through route state, attempt to fetch from backend
  const { data: fetchedCase } = useQuery({
    queryKey: ['case-confirmation', reference],
    queryFn: () => apiClient.trackComplaint(reference || ''),
    enabled: !!reference && !passedCase,
    retry: false,
  });

  const caseData = passedCase || fetchedCase;

  const handleCopyReference = () => {
    if (reference) {
      navigator.clipboard.writeText(reference);
      showToast({
        type: 'success',
        title: 'Reference Copied',
        message: `${reference} copied to clipboard`,
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 sm:p-10 text-center">
        {/* Success Icon */}
        <div className="w-16 h-16 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-subtle">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        {/* Title */}
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          Complaint Successfully Lodged
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-md mx-auto">
          Your grievance has been safely transmitted to the CASELINK AI intake queue for initial bureau triage.
        </p>

        {/* Official Reference Box */}
        <div className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-xl max-w-md mx-auto">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
            Official Case Reference
          </span>
          <div className="flex items-center justify-center gap-2">
            <span className="font-mono text-2xl font-bold text-navy-900 tracking-wider">
              {reference || caseData?.reference || 'CL-2026-UNKNOWN'}
            </span>
            <button
              onClick={handleCopyReference}
              className="p-1.5 text-slate-500 hover:text-civic-blue rounded-md hover:bg-slate-200/60 transition-colors"
              title="Copy Case Reference"
              aria-label="Copy Case Reference"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          {caseData?.received_at && (
            <p className="text-[11px] text-slate-400 mt-2 flex items-center justify-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Logged: {formatDate(caseData.received_at)}
            </p>
          )}
        </div>

        {/* Summary Card if caseData is available */}
        {caseData && (
          <div className="mt-8 text-left border-t border-slate-100 pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Submission Summary
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/70 p-4 rounded-xl border border-slate-200/70 text-xs">
              <div>
                <span className="text-slate-400 block font-medium">Institution</span>
                <span className="font-semibold text-navy-900 mt-0.5 block flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {caseData.institution_name}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Current Status</span>
                <div className="mt-1">
                  <StatusBadge status={caseData.status} />
                </div>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Category</span>
                <span className="font-medium text-slate-800 mt-0.5 block">
                  {caseData.category}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Assigned Intake Bureau</span>
                <span className="font-medium text-slate-800 mt-0.5 block">
                  {caseData.assigned_bureau || 'Regional Bureau (RB)'}
                </span>
              </div>
              <div className="sm:col-span-2">
                <span className="text-slate-400 block font-medium">Subject</span>
                <span className="font-medium text-slate-800 mt-0.5 block">
                  {caseData.subject}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Reference Explanation & Disclaimer */}
        <div className="mt-8 text-left bg-blue-50/50 border border-blue-200/70 rounded-xl p-4.5 text-xs text-blue-900 space-y-2">
          <div className="flex items-center gap-2 font-semibold">
            <Shield className="w-4 h-4 text-civic-blue" />
            <span>Important Information Regarding Your Tracking Reference:</span>
          </div>
          <ul className="list-disc pl-5 space-y-1 text-slate-700 leading-relaxed">
            <li>
              Save this reference number. You will need it along with your registered email to check public status milestones.
            </li>
            <li>
              Under CASELINK AI privacy rules, confidential cross-bureau coordination notes and officer comments remain protected.
            </li>
            <li>
              Resolution timelines depend upon the nature and complexity of regulatory inquiries; specific completion dates are determined by supervising authorities.
            </li>
          </ul>
        </div>

        {/* CTAs */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          {reference ? (
            <Link to={`/track?ref=${encodeURIComponent(reference)}`} className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto font-semibold px-6"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                View Complaint Timeline
              </Button>
            </Link>
          ) : (
            <Link to="/track" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="md"
                className="w-full sm:w-auto font-semibold px-6"
                leftIcon={<Search className="w-4 h-4" />}
              >
                Track Status
              </Button>
            </Link>
          )}

          <Link to="/" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto"
              leftIcon={<Home className="w-4 h-4" />}
            >
              Return Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
