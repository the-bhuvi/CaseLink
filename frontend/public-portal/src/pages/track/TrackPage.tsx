import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useSearchParams } from 'react-router-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { trackComplaintSchema, TrackComplaintFormData } from '@/lib/validation';
import { apiClient, ApiError } from '@/lib/api-client';
import { CaseResponse } from '@/types/complaint';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { StatusBadge } from '@/components/complaint/StatusBadge';
import { formatDate } from '@/lib/formatters';
import { Search, Building2 } from 'lucide-react';

export const TrackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [trackedCase, setTrackedCase] = useState<CaseResponse | null>(null);
  const [error, setError] = useState('');
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<TrackComplaintFormData>({ resolver: zodResolver(trackComplaintSchema), defaultValues: { reference: searchParams.get('ref') || '' } });
  const lookup = async (reference: string) => {
    setError('');
    setTrackedCase(null);
    try { setTrackedCase(await apiClient.trackComplaint(reference)); }
    catch (err) { setError(err instanceof ApiError ? err.message : 'Unable to retrieve this case.'); }
  };
  useEffect(() => { const reference = searchParams.get('ref'); if (reference) { setValue('reference', reference); void lookup(reference); } }, [searchParams, setValue]);
  return <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
    <div className="mb-8 text-center"><h1 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">Track your complaint</h1><p className="mx-auto mt-1 max-w-md text-sm text-slate-500">Enter the public reference from your submission confirmation.</p></div>
    <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8"><form onSubmit={handleSubmit((data) => lookup(data.reference))} className="flex flex-col items-start gap-3 sm:flex-row"><div className="w-full flex-1"><Input label="Case reference number" required placeholder="e.g. CL-2026-A1B2C3" leftIcon={<Search className="h-4 w-4" />} error={errors.reference?.message} {...register('reference')} /></div><div className="w-full sm:mt-7 sm:w-auto"><Button type="submit" isLoading={isSubmitting} className="w-full px-6 sm:w-auto">Track case</Button></div></form></div>
    {error && <Alert variant="danger" title="Unable to retrieve case" className="mb-8">{error}</Alert>}
    {trackedCase && <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div><div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Public reference</div><h2 className="mt-1 text-2xl font-bold text-navy-900">{trackedCase.reference}</h2></div><StatusBadge status={trackedCase.status} /></div><div className="mt-6 grid gap-4 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-wide text-slate-500">Institution</div><div className="mt-1 flex items-center gap-2 font-semibold text-navy-900"><Building2 className="h-4 w-4 text-civic-blue" />{trackedCase.institution_name}</div></div><div className="rounded-xl bg-slate-50 p-4"><div className="text-xs uppercase tracking-wide text-slate-500">Last updated</div><div className="mt-1 font-semibold text-navy-900">{formatDate(trackedCase.updated_at)}</div></div></div><p className="mt-6 text-sm leading-6 text-slate-600">Public tracking shows only the current status and public case information. Internal notes and coordination evidence are not exposed here.</p></div>}
  </div>;
};
