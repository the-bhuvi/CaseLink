import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { trackComplaintSchema, TrackComplaintFormData } from '@/lib/validation';
import { apiClient, ApiError } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { CaseResponse } from '@/types/complaint';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { StatusBadge } from '@/components/complaint/StatusBadge';
import { formatDate } from '@/lib/formatters';
import {
  Search,
  Building2,
  ArrowRight,
  UserCheck,
  Lock,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';

export const TrackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const urlRef = searchParams.get('ref') || '';

  const { user, isAuthenticated, login } = useAuth();
  const { showToast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [trackedCase, setTrackedCase] = useState<CaseResponse | null>(null);
  const [trackError, setTrackError] = useState<{ code: string; message: string } | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TrackComplaintFormData>({
    resolver: zodResolver(trackComplaintSchema),
    defaultValues: {
      reference: urlRef,
    },
  });

  const performLookup = async (reference: string) => {
    setIsLoading(true);
    setTrackError(null);
    setTrackedCase(null);

    try {
      if (!isAuthenticated) {
        setTrackError({
          code: 'AUTH_REQUIRED',
          message:
            'Complainant authentication is required to protect private grievance information. Please sign in below.',
        });
        setIsLoading(false);
        return;
      }

      const caseData = await apiClient.trackComplaint(reference);
      setTrackedCase(caseData);
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.status === 403 || err.code === 'FORBIDDEN') {
          setTrackError({
            code: 'FORBIDDEN',
            message:
              'Access denied. You can only view complaints filed under your authenticated complainant identity.',
          });
        } else if (err.status === 404 || err.code === 'NOT_FOUND') {
          setTrackError({
            code: 'NOT_FOUND',
            message: `No complaint found with reference "${reference}". Please check the reference and try again.`,
          });
        } else {
          setTrackError({
            code: err.code || 'API_ERROR',
            message: err.message || 'Failed to retrieve complaint record from the backend.',
          });
        }
      } else {
        setTrackError({
          code: 'UNAVAILABLE',
          message:
            'Unable to reach the CASELINK AI backend service. Please check if the API is running.',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (data: TrackComplaintFormData) => {
    performLookup(data.reference);
  };

  useEffect(() => {
    if (urlRef) {
      setValue('reference', urlRef);
      if (isAuthenticated) {
        performLookup(urlRef);
      }
    }
  }, [urlRef, isAuthenticated, setValue]);

  const handleQuickDemoLogin = async () => {
    try {
      await login({ email: 'complainant@demo.caselink', role: 'complainant' });
      showToast({
        type: 'success',
        title: 'Signed in as Demo Complainant',
        message: 'You can now track complaints belonging to this demo account.',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Authentication Failed',
        message: err.message || 'Unable to connect to demo auth service.',
      });
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      {/* Title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          Track Your Complaint
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">
          Verify current progress and public timeline updates for your institutional grievance.
        </p>
      </div>

      {/* Auth verification notice if not logged in */}
      {!isAuthenticated && (
        <div className="mb-6 p-4 bg-amber-50/90 border border-amber-200 rounded-2xl text-xs text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900">
                Privacy Protection: Authentication Required
              </p>
              <p className="text-amber-800/90 mt-0.5 leading-relaxed">
                To prevent unauthorized inspection of private grievances, tracking is restricted to the complainant who filed the case.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-navy-900 text-white rounded-lg font-semibold hover:bg-navy-950 transition-colors shrink-0 shadow-subtle text-xs"
          >
            <UserCheck className="w-3.5 h-3.5 text-civic-blue" />
            Sign in as Demo Complainant
          </button>
        </div>
      )}

      {/* Lookup Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8 mb-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="flex flex-col sm:flex-row gap-3 items-start">
            <div className="flex-1 w-full">
              <Input
                label="Case Reference Number"
                required
                placeholder="e.g. CL-2026-00001"
                leftIcon={<Search className="w-4 h-4" />}
                error={errors.reference?.message}
                helperText="Format: CL-YYYY-NNNNN (found on your submission confirmation)"
                {...register('reference')}
              />
            </div>
            <div className="sm:mt-7 w-full sm:w-auto">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full sm:w-auto font-semibold px-6"
                isLoading={isLoading}
              >
                Track Case
              </Button>
            </div>
          </div>
        </form>
      </div>

      {/* Error State */}
      {trackError && (
        <Alert
          variant={trackError.code === 'FORBIDDEN' ? 'warning' : 'danger'}
          title={
            trackError.code === 'FORBIDDEN'
              ? 'Access Restricted by Privacy Policy'
              : trackError.code === 'NOT_FOUND'
              ? 'Complaint Not Found'
              : 'Unable to Retrieve Case'
          }
          className="mb-8"
        >
          <p className="mb-2">{trackError.message}</p>
          {trackError.code === 'AUTH_REQUIRED' && (
            <div className="mt-3">
              <Button variant="secondary" size="sm" onClick={handleQuickDemoLogin}>
                Sign in with Demo Identity
              </Button>
            </div>
          )}
          {trackError.code === 'FORBIDDEN' && (
            <p className="text-[11px] text-amber-800 opacity-90 mt-1">
              Currently signed in as: <strong>{user?.email}</strong>. If you submitted this complaint under a different account, please sign in with that identity.
            </p>
          )}
        </Alert>
      )}

      {/* Success Tracked Case Card */}
      {trackedCase && (
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-hover p-6 sm:p-8 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Tracking Result
              </span>
              <h2 className="text-lg font-bold text-navy-900 font-mono mt-0.5">
                {trackedCase.reference}
              </h2>
            </div>
            <StatusBadge status={trackedCase.status} />
          </div>

          <div className="space-y-4 text-xs">
            {/* Institution */}
            <div>
              <span className="text-slate-400 block font-medium">Institution</span>
              <p className="text-sm font-semibold text-navy-900 flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                {trackedCase.institution_name}
              </p>
            </div>

            {/* Subject */}
            <div>
              <span className="text-slate-400 block font-medium">Subject</span>
              <p className="text-sm font-medium text-slate-800 mt-0.5">
                {trackedCase.subject}
              </p>
            </div>

            {/* Meta Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-2">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Category</span>
                <span className="font-semibold text-navy-900 mt-0.5 block truncate">
                  {trackedCase.category}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="text-slate-400 block font-medium">Intake Bureau</span>
                <span className="font-semibold text-navy-900 mt-0.5 block">
                  {trackedCase.assigned_bureau || 'Regional Bureau'}
                </span>
              </div>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 col-span-2 sm:col-span-1">
                <span className="text-slate-400 block font-medium">Submitted</span>
                <span className="font-semibold text-navy-900 mt-0.5 block">
                  {formatDate(trackedCase.received_at)}
                </span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Age: {trackedCase.age_days} day{trackedCase.age_days === 1 ? '' : 's'} since intake
            </span>
            <Link to={`/my-complaints/${trackedCase.id}`}>
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-4 h-4" />}>
                View Full Public Timeline
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};
