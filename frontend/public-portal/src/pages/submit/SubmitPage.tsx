import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  fullComplaintSchema,
  FullComplaintFormData,
} from '@/lib/validation';
import { WizardProgress } from '@/components/forms/WizardProgress';
import { StepInstitution } from '@/components/forms/StepInstitution';
import { StepDetails } from '@/components/forms/StepDetails';
import { StepSupporting } from '@/components/forms/StepSupporting';
import { StepReview } from '@/components/forms/StepReview';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { apiClient, ApiError } from '@/lib/api-client';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, ArrowRight, Send, UserCheck, LogIn } from 'lucide-react';

const STEPS = [
  { number: 1, label: 'Institution', description: 'Institution name & location' },
  { number: 2, label: 'Complaint', description: 'Category & details' },
  { number: 3, label: 'Supporting', description: 'Contact & documents' },
  { number: 4, label: 'Review', description: 'Confirm & submit' },
];

export const SubmitPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const { user, isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const form = useForm<FullComplaintFormData>({
    resolver: zodResolver(fullComplaintSchema),
    mode: 'onTouched',
    defaultValues: {
      institution_name: '',
      institution_permanent_id: '',
      state: '',
      district: '',
      institution_type: '',
      category: '',
      subject: '',
      description: '',
      incident_date: '',
      assigned_bureau: 'not_sure',
      complainant_name: user?.display_name || '',
      complainant_email: user?.email || '',
      complainant_phone: '',
      consent_privacy: false,
      accuracy_confirmed: false,
    },
  });

  // Pre-fill user data if user signs in while on page
  useEffect(() => {
    if (user) {
      if (!form.getValues('complainant_name')) {
        form.setValue('complainant_name', user.display_name);
      }
      if (!form.getValues('complainant_email')) {
        form.setValue('complainant_email', user.email);
      }
    }
  }, [user, form]);

  const validateStep = async (step: number): Promise<boolean> => {
    let fieldsToValidate: (keyof FullComplaintFormData)[] = [];

    if (step === 1) {
      fieldsToValidate = ['institution_name', 'institution_permanent_id', 'state', 'district', 'institution_type'];
    } else if (step === 2) {
      fieldsToValidate = ['category', 'subject', 'description', 'incident_date', 'assigned_bureau'];
    } else if (step === 3) {
      fieldsToValidate = ['complainant_name', 'complainant_email', 'complainant_phone', 'consent_privacy', 'accuracy_confirmed'];
    }

    const isValid = await form.trigger(fieldsToValidate);
    return isValid;
  };

  const handleNext = async () => {
    setSubmissionError(null);
    const stepValid = await validateStep(currentStep);
    if (stepValid) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setSubmissionError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleStepJump = async (targetStep: number) => {
    if (targetStep < currentStep) {
      setCurrentStep(targetStep);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (targetStep > currentStep) {
      const stepValid = await validateStep(currentStep);
      if (stepValid) {
        setCurrentStep(targetStep);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handleQuickDemoLogin = async () => {
    try {
      await login({ email: 'complainant@demo.caselink', role: 'complainant' });
      showToast({
        type: 'success',
        title: 'Demo Session Active',
        message: 'Signed in as Demo Complainant (complainant@demo.caselink)',
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Authentication Failed',
        message: err.message || 'Could not initiate demo session.',
      });
    }
  };

  const onSubmit = async (data: FullComplaintFormData) => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      // Ensure complainant is authenticated as required by backend contract
      if (!isAuthenticated) {
        try {
          await login({
            email: data.complainant_email || 'complainant@demo.caselink',
            display_name: data.complainant_name || 'Complainant User',
            role: 'complainant',
          });
        } catch (loginErr: any) {
          throw new ApiError(
            'Authentication is required to lodge a grievance. Please click "Sign in as Demo Complainant" above.',
            'UNAUTHORIZED',
            401
          );
        }
      }

      // Step 1: Submit complaint to FastAPI backend
      const caseResponse = await apiClient.submitComplaint({
        institution_name: data.institution_name,
        institution_permanent_id: data.institution_permanent_id || null,
        category: data.category,
        subject: data.subject,
        description: data.description,
        source_channel: 'web',
      });

      // Step 2: Upload attachment if provided
      if (selectedFile && caseResponse.id) {
        try {
          await apiClient.uploadAttachment(caseResponse.id, selectedFile);
        } catch (attErr) {
          console.warn('Attachment upload failed or skipped:', attErr);
          // Case was successfully created, so we do not fail the overall submission
        }
      }

      showToast({
        type: 'success',
        title: 'Complaint Lodged Successfully',
        message: `Your reference is ${caseResponse.reference}`,
      });

      // Navigate to confirmation page using the actual backend-generated reference
      navigate(`/confirmation/${caseResponse.reference}`, {
        state: {
          caseData: caseResponse,
        },
      });
    } catch (err: any) {
      console.error('Submission failed:', err);
      const errorMessage =
        err?.message ||
        'Failed to submit grievance. Please verify all fields and check if the backend service is reachable.';
      setSubmissionError(errorMessage);
      showToast({
        type: 'error',
        title: 'Submission Failed',
        message: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Header */}
      <div className="mb-8 text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight">
          Lodge an Institutional Grievance
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Complete the four-step submission wizard to register your complaint in CASELINK AI.
        </p>
      </div>

      {/* Auth helper banner if not signed in */}
      {!isAuthenticated && (
        <div className="mb-6 p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
          <div className="flex items-center gap-2">
            <LogIn className="w-4 h-4 text-civic-blue shrink-0" />
            <span>
              <strong>Complainant Session:</strong> Submissions require a verified complainant account.
              You can start a one-click prototype demo session.
            </span>
          </div>
          <button
            type="button"
            onClick={handleQuickDemoLogin}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-civic-blue text-white rounded-lg font-semibold hover:bg-civic-blue-hover transition-colors shrink-0 shadow-subtle"
          >
            <UserCheck className="w-3.5 h-3.5" />
            Quick Demo Login
          </button>
        </div>
      )}

      {/* Progress indicator */}
      <WizardProgress
        currentStep={currentStep}
        totalSteps={4}
        steps={STEPS}
        onStepClick={handleStepJump}
      />

      {/* Wizard Form Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-card p-6 sm:p-8">
        <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
          {currentStep === 1 && <StepInstitution form={form} />}

          {currentStep === 2 && <StepDetails form={form} />}

          {currentStep === 3 && (
            <StepSupporting
              form={form}
              selectedFile={selectedFile}
              onFileSelect={setSelectedFile}
            />
          )}

          {currentStep === 4 && (
            <StepReview
              formData={form.getValues()}
              selectedFile={selectedFile}
              onEditStep={(step) => setCurrentStep(step)}
              submissionError={submissionError}
            />
          )}

          {/* Form Actions Footer */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleBack}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                disabled={isSubmitting}
              >
                Back
              </Button>
            ) : (
              <div /> // Spacer
            )}

            {currentStep < 4 ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                onClick={handleNext}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Continue
              </Button>
            ) : (
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={isSubmitting}
                leftIcon={<Send className="w-4 h-4" />}
                className="font-semibold px-6"
              >
                Submit Complaint
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
