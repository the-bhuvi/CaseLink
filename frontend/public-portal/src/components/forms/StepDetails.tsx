import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { COMPLAINT_CATEGORIES } from '@/lib/validation';
import { Calendar } from 'lucide-react';

interface StepDetailsProps {
  form: UseFormReturn<any>;
}

export const StepDetails: React.FC<StepDetailsProps> = ({ form }) => {
  const {
    register,
    watch,
    formState: { errors },
  } = form;

  const descriptionValue = watch('description') || '';

  const categoryOptions = COMPLAINT_CATEGORIES.map((c) => ({
    value: c.value,
    label: c.label,
  }));

  const bureauOptions = [
    { value: 'not_sure', label: 'I am not sure / Automated bureau routing' },
    { value: 'RB', label: 'Regional Bureau (RB) — Regional oversight & compliance' },
    { value: 'PGRC', label: 'Public Grievance Redressal Cell (PGRC) — Student & faculty welfare' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-base font-semibold text-navy-900">
          Complaint Specifics
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Provide accurate details regarding your grievance for proper categorization and routing.
        </p>
      </div>

      <div className="space-y-4">
        {/* Category */}
        <Select
          label="Grievance Category"
          required
          placeholder="-- Select Applicable Category --"
          options={categoryOptions}
          error={errors.category?.message as string}
          helperText="Select the primary issue area that best describes this matter."
          {...register('category')}
        />

        {/* Subject */}
        <Input
          label="Complaint Subject"
          required
          placeholder="e.g. Delayed scholarship stipend and missing disbursement receipts"
          error={errors.subject?.message as string}
          helperText="A clear, succinct one-line summary of the core issue."
          {...register('subject')}
        />

        {/* Description */}
        <div className="space-y-1">
          <Textarea
            label="Detailed Description"
            required
            rows={5}
            placeholder="Describe the sequence of events, institutional responses received so far, affected parties, and the exact resolution requested..."
            error={errors.description?.message as string}
            {...register('description')}
          />
          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Minimum 10 characters required</span>
            <span>{descriptionValue.length} / 5000 characters</span>
          </div>
        </div>

        {/* Incident Date & Bureau */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <Input
            type="date"
            label="Incident Date (Optional)"
            leftIcon={<Calendar className="w-4 h-4" />}
            error={errors.incident_date?.message as string}
            helperText="Date when the incident occurred or when notice was served."
            {...register('incident_date')}
          />

          <Select
            label="Target Bureau / Division (If known)"
            options={bureauOptions}
            error={errors.assigned_bureau?.message as string}
            helperText="Select 'I am not sure' if you want CASELINK AI to triage automatically."
            {...register('assigned_bureau')}
          />
        </div>
      </div>
    </div>
  );
};
