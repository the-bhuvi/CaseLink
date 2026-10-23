import React from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Alert } from '@/components/ui/Alert';
import { INDIAN_STATES, INSTITUTION_TYPES } from '@/lib/validation';
import { Building2, MapPin } from 'lucide-react';

interface StepInstitutionProps {
  form: UseFormReturn<any>;
}

export const StepInstitution: React.FC<StepInstitutionProps> = ({ form }) => {
  const {
    register,
    formState: { errors },
  } = form;

  const stateOptions = INDIAN_STATES.map((s) => ({ value: s, label: s }));
  const typeOptions = INSTITUTION_TYPES.map((t) => ({ value: t, label: t }));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-base font-semibold text-navy-900">
          Institution Information
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Specify the educational institution against which you are lodging this grievance.
        </p>
      </div>

      <Alert variant="info" className="text-xs">
        <div className="flex items-start gap-2">
          <span>
            <strong>Institution Matching Notice:</strong> CASELINK AI checks submitted names against institutional registries.
            Entering details here does not constitute official regulatory endorsement or immediate verification.
          </span>
        </div>
      </Alert>

      <div className="space-y-4">
        {/* Institution Name */}
        <Input
          label="Institution Full Name"
          required
          placeholder="e.g. Apex Institute of Technology & Engineering"
          leftIcon={<Building2 className="w-4 h-4" />}
          error={errors.institution_name?.message as string}
          helperText="Enter the official complete name as printed on notices or fee receipts."
          {...register('institution_name')}
        />

        {/* AICTE Permanent ID */}
        <Input
          label="AICTE Permanent ID (Optional)"
          placeholder="e.g. 1-4321987654"
          error={errors.institution_permanent_id?.message as string}
          helperText="Found on institutional approval letters, website, or portal receipts if known."
          {...register('institution_permanent_id')}
        />

        {/* State & District Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="State / Union Territory"
            required
            placeholder="-- Select State / UT --"
            options={stateOptions}
            error={errors.state?.message as string}
            {...register('state')}
          />

          <Input
            label="District (Optional)"
            placeholder="e.g. Pune, Bengaluru Urban, Jaipur"
            leftIcon={<MapPin className="w-4 h-4" />}
            error={errors.district?.message as string}
            {...register('district')}
          />
        </div>

        {/* Institution Type */}
        <Select
          label="Institution Type (Optional)"
          placeholder="-- Select Institution Category --"
          options={typeOptions}
          error={errors.institution_type?.message as string}
          {...register('institution_type')}
        />
      </div>
    </div>
  );
};
