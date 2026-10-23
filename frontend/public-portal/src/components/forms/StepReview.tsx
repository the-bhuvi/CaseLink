import React from 'react';
import { Alert } from '@/components/ui/Alert';
import { FullComplaintFormData } from '@/lib/validation';
import {
  Building2,
  FileText,
  User,
  Paperclip,
  CheckCircle2,
  Edit2,
} from 'lucide-react';

interface StepReviewProps {
  formData: FullComplaintFormData;
  selectedFile: File | null;
  onEditStep: (step: number) => void;
  submissionError: string | null;
}

export const StepReview: React.FC<StepReviewProps> = ({
  formData,
  selectedFile,
  onEditStep,
  submissionError,
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h3 className="text-base font-semibold text-navy-900">
          Review & Confirmation
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Carefully review all details before final transmission to CASELINK AI grievance intake.
        </p>
      </div>

      {submissionError && (
        <Alert variant="danger" title="Submission Error">
          {submissionError}
        </Alert>
      )}

      {/* Review Section 1: Institution */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-card p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <Building2 className="w-4 h-4 text-civic-blue" />
            <span>Institution Information</span>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(1)}
            className="inline-flex items-center gap-1 text-xs text-civic-blue hover:text-civic-blue-hover font-semibold transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Institution Name</span>
            <span className="font-semibold text-navy-900 mt-0.5 block text-sm">
              {formData.institution_name}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Permanent AICTE ID</span>
            <span className="font-medium text-slate-800 mt-0.5 block">
              {formData.institution_permanent_id || 'Not specified'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">State / Region</span>
            <span className="font-medium text-slate-800 mt-0.5 block">
              {formData.state} {formData.district ? `(${formData.district})` : ''}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Institution Type</span>
            <span className="font-medium text-slate-800 mt-0.5 block">
              {formData.institution_type || 'General Institution'}
            </span>
          </div>
        </div>
      </div>

      {/* Review Section 2: Complaint Details */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-card p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <FileText className="w-4 h-4 text-civic-blue" />
            <span>Complaint Specifics</span>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(2)}
            className="inline-flex items-center gap-1 text-xs text-civic-blue hover:text-civic-blue-hover font-semibold transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-slate-400 block font-medium">Category</span>
              <span className="font-semibold text-navy-900 mt-0.5 block">
                {formData.category}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block font-medium">Incident Date</span>
              <span className="font-medium text-slate-800 mt-0.5 block">
                {formData.incident_date || 'Ongoing / Unspecified'}
              </span>
            </div>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Subject</span>
            <span className="font-semibold text-navy-900 mt-0.5 block text-sm">
              {formData.subject}
            </span>
          </div>

          <div>
            <span className="text-slate-400 block font-medium">Description</span>
            <p className="font-normal text-slate-700 mt-1 whitespace-pre-wrap bg-slate-50 p-3 rounded-lg border border-slate-100 text-xs leading-relaxed">
              {formData.description}
            </p>
          </div>
        </div>
      </div>

      {/* Review Section 3: Contact & Supporting */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-card p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-navy-900">
            <User className="w-4 h-4 text-civic-blue" />
            <span>Complainant Details & Supporting Document</span>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(3)}
            className="inline-flex items-center gap-1 text-xs text-civic-blue hover:text-civic-blue-hover font-semibold transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <span className="text-slate-400 block font-medium">Complainant Name</span>
            <span className="font-medium text-slate-800 mt-0.5 block">
              {formData.complainant_name}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Email Address</span>
            <span className="font-medium text-slate-800 mt-0.5 block">
              {formData.complainant_email}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Phone</span>
            <span className="font-medium text-slate-800 mt-0.5 block">
              {formData.complainant_phone || 'None provided'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Attached File</span>
            <span className="font-medium text-slate-800 mt-0.5 block flex items-center gap-1.5">
              {selectedFile ? (
                <>
                  <Paperclip className="w-3.5 h-3.5 text-civic-blue" />
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </>
              ) : (
                'No attachment selected'
              )}
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-start gap-3">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          Ready for secure transmission. Upon clicking <strong>Submit Complaint</strong>, an official tracking reference number will be generated by the CASELINK AI backend.
        </p>
      </div>
    </div>
  );
};
