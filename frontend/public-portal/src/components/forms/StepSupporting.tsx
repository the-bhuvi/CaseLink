import React, { useRef } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import { UploadCloud, FileText, X, Shield } from 'lucide-react';

interface StepSupportingProps {
  form: UseFormReturn<any>;
  selectedFile: File | null;
  onFileSelect: (file: File | null) => void;
}

export const StepSupporting: React.FC<StepSupportingProps> = ({
  form,
  selectedFile,
  onFileSelect,
}) => {
  const {
    register,
    formState: { errors },
  } = form;

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds the 10 MB limit.');
        return;
      }
      onFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-base font-semibold text-navy-900">
          Supporting Documents & Complainant Contact
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Provide your communication details and optional documentary evidence supporting your grievance.
        </p>
      </div>

      {/* Complainant Contact Information */}
      <div className="bg-slate-50/70 rounded-xl p-4 border border-slate-200/80 space-y-4">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-navy-900 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-civic-blue" />
          Complainant Verification Details
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Complainant Full Name"
            required
            placeholder="e.g. Ramesh Kumar"
            error={errors.complainant_name?.message as string}
            {...register('complainant_name')}
          />

          <Input
            type="email"
            label="Email Address (Used for Notifications)"
            required
            placeholder="e.g. complainant@example.com"
            error={errors.complainant_email?.message as string}
            helperText="Status notifications will be tied to this verified identity."
            {...register('complainant_email')}
          />
        </div>

        <Input
          label="Contact Phone Number (Optional)"
          placeholder="e.g. +91 98765 43210"
          error={errors.complainant_phone?.message as string}
          helperText="For SMS status alerts if enabled."
          {...register('complainant_phone')}
        />
      </div>

      {/* Attachment Upload (Optional) */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-navy-900">
          Supporting Document / Evidence (Optional)
        </label>

        {!selectedFile ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-civic-blue hover:bg-blue-50/20 transition-all cursor-pointer group"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
            />
            <UploadCloud className="w-8 h-8 text-slate-400 group-hover:text-civic-blue mx-auto mb-2 transition-colors" />
            <p className="text-sm font-semibold text-navy-900">
              Click to select or drag & drop evidence file
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Supported formats: PDF, JPG, PNG (Maximum 10 MB).
            </p>
            <p className="text-[11px] text-slate-400 mt-2 font-mono">
              Prototype Note: Handled via backend demo metadata attachment handler.
            </p>
          </div>
        ) : (
          <div className="flex items-center justify-between p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-civic-blue text-white flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-navy-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-[11px] text-slate-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || 'Document'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleRemoveFile}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white/80 transition-colors"
              aria-label="Remove uploaded file"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Consent & Acknowledgements */}
      <div className="pt-3 border-t border-slate-200 space-y-3">
        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-civic-blue focus:ring-civic-blue cursor-pointer"
            {...register('consent_privacy')}
          />
          <div className="text-xs leading-relaxed text-slate-700">
            <span className="font-semibold text-navy-900">
              Privacy & Grievance Processing Acknowledgement *
            </span>
            <p className="text-slate-500 mt-0.5">
              I understand that my grievance will be processed under CASELINK AI cross-bureau monitoring protocols and that complaint data is protected. Only public-safe timeline events will be exposed.
            </p>
          </div>
        </label>
        {errors.consent_privacy && (
          <p className="text-xs text-rose-600 font-medium pl-7">
            {errors.consent_privacy.message as string}
          </p>
        )}

        <label className="flex items-start gap-3 cursor-pointer group">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 rounded border-slate-300 text-civic-blue focus:ring-civic-blue cursor-pointer"
            {...register('accuracy_confirmed')}
          />
          <div className="text-xs leading-relaxed text-slate-700">
            <span className="font-semibold text-navy-900">
              Factual Accuracy Confirmation *
            </span>
            <p className="text-slate-500 mt-0.5">
              I solemnly confirm that all information provided in this grievance submission is factual and authentic to the best of my knowledge.
            </p>
          </div>
        </label>
        {errors.accuracy_confirmed && (
          <p className="text-xs text-rose-600 font-medium pl-7">
            {errors.accuracy_confirmed.message as string}
          </p>
        )}
      </div>
    </div>
  );
};
