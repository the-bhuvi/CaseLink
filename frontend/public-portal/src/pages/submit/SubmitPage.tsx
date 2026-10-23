import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { fullComplaintSchema, FullComplaintFormData } from '@/lib/validation';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import type { AdministrativeDistrict, AdministrativeState, Institution } from '@/types/complaint';

type TaxonomyItem = { id: string; label: string; subcategories: { id: string; label: string; issues: string[] }[] };

export const SubmitPage: React.FC = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [institutionQuery, setInstitutionQuery] = useState('');
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState<Institution | null>(null);
  const [institutionLoading, setInstitutionLoading] = useState(false);
  const [institutionError, setInstitutionError] = useState('');
  const [showNotFound, setShowNotFound] = useState(false);
  const [verificationDetails, setVerificationDetails] = useState('');
  const [verificationMessage, setVerificationMessage] = useState('');
  const [verificationSubmitting, setVerificationSubmitting] = useState(false);
  const [states, setStates] = useState<AdministrativeState[]>([]);
  const [districts, setDistricts] = useState<AdministrativeDistrict[]>([]);
  const [referenceError, setReferenceError] = useState('');
  const [taxonomy, setTaxonomy] = useState<TaxonomyItem[]>([]);
  const [taxonomyError, setTaxonomyError] = useState('');
  const form = useForm<FullComplaintFormData>({
    resolver: zodResolver(fullComplaintSchema),
    mode: 'onTouched',
    defaultValues: {
      institution_id: '', institution_name: '', institution_permanent_id: '', state: '', district: '',
      institution_type: '', category: '', subcategory: '', specific_issue: '', subject: '', description: '',
      incident_date: '', assigned_bureau: 'not_sure', complainant_name: '', complainant_email: '',
      complainant_phone: '', consent_privacy: false, accuracy_confirmed: false,
    },
  });
  const category = form.watch('category');
  const subcategory = form.watch('subcategory');
  const state = form.watch('state');
  const district = form.watch('district');
  const chosenCategory = taxonomy.find((item) => item.id === category);
  const chosenSubcategory = chosenCategory?.subcategories.find((item) => item.id === subcategory);

  useEffect(() => {
    void Promise.all([apiClient.states(), apiClient.grievanceTaxonomy()]).then(([stateRows, taxonomyRows]) => {
      setStates(stateRows);
      setTaxonomy(taxonomyRows);
    }).catch(() => {
      setReferenceError('Reference data could not be loaded. Please retry before submitting.');
      setTaxonomyError('Categories are temporarily unavailable.');
    });
  }, []);

  useEffect(() => {
    const selected = states.find((item) => item.name === state);
    form.setValue('district', selectedInstitution?.state === state ? selectedInstitution.district : '');
    setDistricts([]);
    if (!selected) return;
    void apiClient.districts(selected.id).then(setDistricts).catch(() => setReferenceError('District data could not be loaded. Please retry.'));
  }, [state, states, form, selectedInstitution]);

  useEffect(() => {
    if (!institutionQuery.trim()) {
      setInstitutions([]);
      return;
    }
    const timer = window.setTimeout(() => {
      setInstitutionLoading(true);
      setInstitutionError('');
        void apiClient.institutions(institutionQuery)
        .then(setInstitutions)
        .catch(() => setInstitutionError('Institution search failed.'))
        .finally(() => setInstitutionLoading(false));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [institutionQuery, state, district]);

  useEffect(() => {
    if (selectedInstitution && state && selectedInstitution.state !== state) {
      setSelectedInstitution(null);
      setInstitutionQuery('');
      form.setValue('institution_id', '', { shouldValidate: true });
      form.setValue('institution_name', '');
      form.setValue('institution_permanent_id', '');
    }
  }, [state, selectedInstitution, form]);

  useEffect(() => {
    if (chosenSubcategory?.issues.length && !form.getValues('subject')) {
      form.setValue('subject', chosenSubcategory.issues[0]);
    }
  }, [chosenSubcategory, form]);

  const subcategoryOptions = useMemo(() => chosenCategory?.subcategories.map(({ id, label }) => ({ value: id, label })) || [], [chosenCategory]);
  const issueOptions = useMemo(() => chosenSubcategory?.issues.map((label) => ({ value: label, label })) || [], [chosenSubcategory]);

  const selectInstitution = (institution: Institution) => {
    setSelectedInstitution(institution);
    setInstitutions([]);
    setInstitutionQuery(institution.name);
    form.setValue('institution_id', institution.id, { shouldValidate: true });
    form.setValue('institution_name', institution.name, { shouldValidate: true });
    form.setValue('institution_permanent_id', institution.aicte_permanent_id || '');
    if (institution.state && institution.state !== 'Unknown') {
      form.setValue('state', institution.state, { shouldValidate: true });
      form.setValue('district', institution.district === 'Unknown' ? '' : institution.district);
    }
  };

  const submit = async (data: FullComplaintFormData) => {
    setError('');
    try {
      const result = await apiClient.submitComplaint({
        institution_id: data.institution_id,
        institution_name: data.institution_name,
        institution_permanent_id: data.institution_permanent_id || null,
        state: data.state,
        district: data.district || null,
        category: chosenCategory?.label || data.category,
        subcategory: chosenSubcategory?.label || data.subcategory,
        specific_issue: data.specific_issue,
        subject: data.subject,
        description: data.description,
        source_channel: 'web',
        complainant_name: data.complainant_name,
        complainant_email: data.complainant_email,
      });
      navigate(`/confirmation/${result.reference}`, { state: { caseData: result } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed. Please try again.');
    }
  };

  const requestVerification = async () => {
    if (!institutionQuery.trim() || verificationDetails.trim().length < 10) return;
    setVerificationSubmitting(true);
    setVerificationMessage('');
    try {
      const result = await apiClient.requestInstitutionVerification({
        submitted_name: institutionQuery.trim(),
        state: state || undefined,
        district: district || undefined,
        details: verificationDetails.trim(),
        contact_email: form.getValues('complainant_email') || undefined,
      });
      setVerificationMessage(result.message);
      setVerificationDetails('');
    } catch (err) {
      setVerificationMessage(err instanceof Error ? err.message : 'Verification request could not be submitted.');
    } finally {
      setVerificationSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="mb-8"><h1 className="text-2xl font-extrabold text-navy-900 sm:text-3xl">Lodge an institutional grievance</h1><p className="mt-1 text-sm text-slate-500">Select verified records so your complaint is linked to the correct institution.</p></div>
      {error && <Alert variant="danger" title="Submission failed" className="mb-6">{error}</Alert>}
      {referenceError && <Alert variant="danger" title="Reference data unavailable" className="mb-6">{referenceError} Refresh the page and retry.</Alert>}
      <form onSubmit={form.handleSubmit(submit)} className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-card sm:p-8">
        <section>
          <h2 className="font-bold text-navy-900">Institution</h2>
          <div className="mt-4 space-y-4">
            <div className="relative">
              <Input label="Search verified institution" required value={institutionQuery} onChange={(event) => { setInstitutionQuery(event.target.value); setSelectedInstitution(null); form.setValue('institution_id', ''); }} placeholder="Search official name or AICTE Permanent ID" helperText="Search results come from the connected Supabase institution directory." error={form.formState.errors.institution_id?.message} />
              {institutionQuery && !selectedInstitution && <div className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-slate-200 bg-white shadow-lg">{institutionLoading ? <p className="p-3 text-sm text-slate-500">Searching…</p> : institutionError ? <p className="p-3 text-sm text-rose-600">{institutionError}</p> : institutions.length ? institutions.map((item) => <button type="button" key={item.id} className="block w-full border-b border-slate-100 px-3 py-3 text-left hover:bg-slate-50" onClick={() => selectInstitution(item)}><span className="block text-sm font-semibold text-navy-900">{item.name}</span><span className="text-xs text-slate-500">{item.state} · {item.district}{item.aicte_permanent_id ? ` · ${item.aicte_permanent_id}` : ''}</span></button>) : <p className="p-3 text-sm text-slate-500">No verified institutions found.</p>}</div>}
            </div>
            {selectedInstitution && <p className="text-xs text-emerald-700">Selected: {selectedInstitution.name} · {selectedInstitution.state}, {selectedInstitution.district}</p>}
            <div className="grid gap-4 sm:grid-cols-2">
              <Select label="State / Union Territory" required placeholder="-- Select --" options={states.map((item) => ({ value: item.name, label: `${item.name}${item.kind === 'union_territory' ? ' (UT)' : ''}` }))} error={form.formState.errors.state?.message} {...form.register('state')} />
              <Select label="District" required disabled={!state} placeholder={state ? '-- Select district --' : 'Select state first'} options={districts.map((item) => ({ value: item.name, label: item.name }))} error={form.formState.errors.district?.message} {...form.register('district')} />
            </div>
            <button type="button" className="text-sm font-semibold text-blue-700 underline" onClick={() => setShowNotFound((value) => !value)}>Institution not found?</button>
            {showNotFound && <div className="space-y-3"><Alert variant="info" className="text-sm">The directory contains verified records only. You can request a review here; this will not create an officially verified institution.</Alert><Textarea label="Details for verification review" rows={3} value={verificationDetails} onChange={(event) => setVerificationDetails(event.target.value)} placeholder="Provide the official website, campus location, or other details that may help verification." /><Button type="button" variant="secondary" disabled={verificationDetails.trim().length < 10 || verificationSubmitting} onClick={() => void requestVerification()}>{verificationSubmitting ? 'Sending…' : 'Send for verification review'}</Button>{verificationMessage && <p className="text-sm text-slate-600">{verificationMessage}</p>}</div>}
          </div>
        </section>
        <section>
          <h2 className="font-bold text-navy-900">Complaint details</h2>
          <div className="mt-4 grid gap-4">
            {taxonomyError ? <Alert variant="danger">{taxonomyError}</Alert> : <><Select label="Grievance category" required placeholder="-- Select category --" options={taxonomy.map(({ id, label }) => ({ value: id, label }))} error={form.formState.errors.category?.message} {...form.register('category', { onChange: () => { form.setValue('subcategory', ''); form.setValue('specific_issue', ''); } })} /><Select label="Subcategory" required disabled={!chosenCategory} placeholder="-- Select subcategory --" options={subcategoryOptions} error={form.formState.errors.subcategory?.message} {...form.register('subcategory', { onChange: () => form.setValue('specific_issue', '') })} /><Select label="Specific issue" required disabled={!chosenSubcategory} placeholder="-- Select specific issue --" options={issueOptions} error={form.formState.errors.specific_issue?.message} {...form.register('specific_issue')} /></>}
            <Input label="Subject" required placeholder="Concise summary of the grievance" error={form.formState.errors.subject?.message} {...form.register('subject')} />
            <Textarea label="Detailed description" required rows={7} placeholder="What happened, when did it happen, what response was received, and what resolution is requested? Avoid unnecessary personal or sensitive information." error={form.formState.errors.description?.message} {...form.register('description')} />
          </div>
        </section>
        <section><h2 className="font-bold text-navy-900">Contact for updates</h2><div className="mt-4 grid gap-4 sm:grid-cols-2"><Input label="Name" required error={form.formState.errors.complainant_name?.message} {...form.register('complainant_name')} /><Input label="Email" type="email" required error={form.formState.errors.complainant_email?.message} {...form.register('complainant_email')} /></div></section>
        <label className="flex items-start gap-3 text-sm text-slate-600"><input type="checkbox" className="mt-1" {...form.register('consent_privacy')} /> I consent to CASELINK AI processing this complaint for grievance monitoring and coordination.</label>
        <label className="flex items-start gap-3 text-sm text-slate-600"><input type="checkbox" className="mt-1" {...form.register('accuracy_confirmed')} /> I confirm that the information provided is accurate to the best of my knowledge.</label>
        <Button type="submit" isLoading={form.formState.isSubmitting} className="w-full sm:w-auto">Submit complaint</Button>
      </form>
    </div>
  );
};
