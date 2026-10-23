import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fullComplaintSchema, FullComplaintFormData } from '@/lib/validation';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';

export const SubmitPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const form = useForm<FullComplaintFormData>({ resolver: zodResolver(fullComplaintSchema), mode: 'onTouched', defaultValues: { institution_name: '', institution_permanent_id: '', state: '', district: '', institution_type: '', category: '', subject: '', description: '', incident_date: '', assigned_bureau: 'not_sure', complainant_name: '', complainant_email: '', complainant_phone: '', consent_privacy: false, accuracy_confirmed: false } });
  const submit = async (data: FullComplaintFormData) => {
    setError('');
    try {
      const result = await apiClient.submitComplaint({ institution_name: data.institution_name, institution_permanent_id: data.institution_permanent_id || null, category: data.category, subject: data.subject, description: data.description, source_channel: 'web', complainant_name: data.complainant_name, complainant_email: data.complainant_email });
      navigate(`/confirmation/${result.reference}`, { state: { caseData: result } });
    } catch (err) { setError(err instanceof Error ? err.message : 'Submission failed. Please try again.'); }
  };
  return <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14"><div className="mb-8"><h1 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">Lodge an institutional grievance</h1><p className="mt-1 text-sm text-slate-500">Your complaint is sent to the CASELINK AI backend and assigned a public tracking reference.</p></div>{error && <Alert variant="danger" title="Submission failed" className="mb-6">{error}</Alert>}<form onSubmit={form.handleSubmit(submit)} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8"><section><h2 className="font-bold text-navy-900">Institution</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><Input label="Institution name" required error={form.formState.errors.institution_name?.message} {...form.register('institution_name')} /><Input label="AICTE Permanent ID (if known)" {...form.register('institution_permanent_id')} /><Input label="State" required error={form.formState.errors.state?.message} {...form.register('state')} /><Input label="District" {...form.register('district')} /></div></section><section><h2 className="font-bold text-navy-900">Complaint details</h2><div className="mt-4 grid gap-4"><Input label="Category" required placeholder="Academic, scholarship, infrastructure…" error={form.formState.errors.category?.message} {...form.register('category')} /><Input label="Subject" required error={form.formState.errors.subject?.message} {...form.register('subject')} /><Textarea label="Detailed description" required rows={7} error={form.formState.errors.description?.message} {...form.register('description')} /></div></section><section><h2 className="font-bold text-navy-900">Contact for updates</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><Input label="Name" required error={form.formState.errors.complainant_name?.message} {...form.register('complainant_name')} /><Input label="Email" type="email" required error={form.formState.errors.complainant_email?.message} {...form.register('complainant_email')} /></div></section><label className="flex items-start gap-3 text-sm text-slate-600"><input type="checkbox" className="mt-1" {...form.register('consent_privacy')} /> I consent to CASELINK AI processing this complaint for grievance monitoring and coordination.</label><label className="flex items-start gap-3 text-sm text-slate-600"><input type="checkbox" className="mt-1" {...form.register('accuracy_confirmed')} /> I confirm that the information provided is accurate to the best of my knowledge.</label><Button type="submit" isLoading={form.formState.isSubmitting} className="w-full sm:w-auto">Submit complaint</Button></form></div>;
};
