import React, { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { TimelineView } from '@/components/complaint/TimelineView';
import { StatusBadge } from '@/components/complaint/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { Alert } from '@/components/ui/Alert';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatDate, formatTimeAgo } from '@/lib/formatters';
import {
  ArrowLeft,
  Building2,
  Clock,
  FileText,
  Tag,
  Paperclip,
  Upload,
  ShieldCheck,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export const ComplaintDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Fetch Case Details
  const {
    data: caseData,
    isLoading: caseLoading,
    isError: caseError,
    error: caseErrorObj,
    refetch: refetchCase,
  } = useQuery({
    queryKey: ['case-detail', id],
    queryFn: () => apiClient.getCaseById(id || ''),
    enabled: !!id,
    retry: 1,
  });

  // Fetch Public Timeline
  const {
    data: timeline,
    isLoading: timelineLoading,
    refetch: refetchTimeline,
  } = useQuery({
    queryKey: ['case-timeline', id],
    queryFn: () => apiClient.getTimeline(id || ''),
    enabled: !!id,
    retry: 1,
  });

  // Mutation for uploading additional attachment
  const uploadMutation = useMutation({
    mutationFn: (file: File) => apiClient.uploadAttachment(id || '', file),
    onSuccess: (data) => {
      showToast({
        type: 'success',
        title: 'Evidence Uploaded',
        message: data.note || 'Document attached successfully to your case.',
      });
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      queryClient.invalidateQueries({ queryKey: ['case-timeline', id] });
    },
    onError: (err: any) => {
      showToast({
        type: 'error',
        title: 'Upload Failed',
        message: err.message || 'Could not upload attachment.',
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds the 10 MB limit.');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUploadSubmit = () => {
    if (selectedFile) {
      uploadMutation.mutate(selectedFile);
    }
  };

  if (caseLoading || timelineLoading) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-10 w-96" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-80 lg:col-span-2 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (caseError || !caseData) {
    return (
      <div className="max-w-lg mx-auto py-16 px-4">
        <ErrorState
          title="Complaint Record Unavailable"
          message={
            (caseErrorObj as any)?.message ||
            'Unable to load the requested complaint details. The record may belong to another complainant or has been archived.'
          }
          onRetry={() => {
            refetchCase();
            refetchTimeline();
          }}
        />
      </div>
    );
  }

  const isAwaitingInfo = caseData.status === 'awaiting_information';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Breadcrumb / Back Link */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Link to="/my-complaints" className="hover:text-navy-900 transition-colors flex items-center gap-1">
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to My Complaints
        </Link>
        <span>/</span>
        <span className="font-mono font-medium text-navy-900">{caseData.reference}</span>
      </div>

      {/* Main Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 sm:p-8">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-sm font-bold bg-slate-100 text-navy-900 px-2.5 py-1 rounded-md border border-slate-200">
                {caseData.reference}
              </span>
              <StatusBadge status={caseData.status} />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-navy-900 tracking-tight pt-1">
              {caseData.subject}
            </h1>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <strong className="text-slate-700">{caseData.institution_name}</strong>
              {caseData.institution_permanent_id && (
                <span>(ID: {caseData.institution_permanent_id})</span>
              )}
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-slate-100 sm:pl-6 text-xs text-slate-500 shrink-0">
            <span className="block text-slate-400">Intake Received</span>
            <span className="font-semibold text-navy-900 mt-0.5 block">
              {formatDate(caseData.received_at)}
            </span>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              {formatTimeAgo(caseData.received_at)}
            </span>
          </div>
        </div>

        {/* Overview Meta Tags */}
        <div className="pt-4 flex flex-wrap items-center gap-3 text-xs">
          <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-medium text-slate-700">
            <Tag className="w-3.5 h-3.5 text-slate-400" />
            Category: <strong>{caseData.category}</strong>
          </span>
          <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-medium text-slate-700">
            <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
            Bureau: <strong>{caseData.assigned_bureau || 'Regional Bureau'}</strong>
          </span>
          <span className="inline-flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-200 font-medium text-slate-700">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Active Duration: <strong>{caseData.age_days} days</strong>
          </span>
        </div>
      </div>

      {/* Awaiting Information Notification if active */}
      {isAwaitingInfo && (
        <Alert
          variant="warning"
          title="Clarification Requested by Review Officers"
          className="shadow-subtle"
        >
          <p className="mb-3">
            Oversight officers have marked this complaint as awaiting additional documentation or clarification.
            Please submit any requested receipts or records below.
          </p>
          <div className="flex items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              leftIcon={<Upload className="w-3.5 h-3.5" />}
            >
              Select Clarification File
            </Button>
            {selectedFile && (
              <div className="flex items-center gap-2 text-xs font-medium text-navy-900">
                <Paperclip className="w-3.5 h-3.5 text-civic-blue" />
                <span>{selectedFile.name}</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleUploadSubmit}
                  isLoading={uploadMutation.isPending}
                >
                  Upload Evidence
                </Button>
              </div>
            )}
          </div>
        </Alert>
      )}

      {/* Main Grid: Description & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Complaint Description & Supporting Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description Card */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-civic-blue" />
              Grievance Description
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50/60 p-4 rounded-xl border border-slate-100 font-normal">
              {caseData.description || 'No detailed description recorded.'}
            </p>
          </div>

          {/* Privacy & Safe Public Progress Notice */}
          <div className="bg-blue-50/60 border border-blue-200/80 rounded-2xl p-5 text-xs text-blue-900">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-civic-blue shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-navy-900 mb-0.5">
                  Safe Public Progress Guarantee
                </h4>
                <p className="text-slate-600 leading-relaxed">
                  Only public milestone updates, official status transitions, and authorized communications are visible on this timeline.
                  Internal AI cross-case similarity computations and confidential officer discussions remain protected to ensure administrative integrity.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Public Action Timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Clock className="w-4 h-4 text-civic-blue" />
              Public Action Timeline
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {timeline?.length || 0} event{timeline?.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6">
            <TimelineView
              timeline={timeline || []}
              currentStatus={caseData.public_status || caseData.status}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
