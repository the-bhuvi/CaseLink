import React from 'react';
import { Check } from 'lucide-react';

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
  steps: { number: number; label: string; description: string }[];
  onStepClick?: (step: number) => void;
}

export const WizardProgress: React.FC<WizardProgressProps> = ({
  currentStep,
  totalSteps,
  steps,
  onStepClick,
}) => {
  return (
    <div className="w-full">
      {/* Mobile step display */}
      <div className="sm:hidden mb-6 flex items-center justify-between bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-subtle">
        <div>
          <span className="text-xs font-semibold text-civic-blue uppercase tracking-wider">
            Step {currentStep} of {totalSteps}
          </span>
          <p className="text-sm font-semibold text-navy-900 mt-0.5">
            {steps[currentStep - 1]?.label}
          </p>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {Math.round((currentStep / totalSteps) * 100)}% Complete
        </div>
      </div>

      {/* Desktop step indicators */}
      <div className="hidden sm:grid grid-cols-4 gap-4 mb-8">
        {steps.map((step) => {
          const isCompleted = step.number < currentStep;
          const isCurrent = step.number === currentStep;
          const isClickable = isCompleted && onStepClick;

          return (
            <div
              key={step.number}
              onClick={() => isClickable && onStepClick(step.number)}
              className={`relative flex flex-col p-3.5 rounded-xl border transition-all duration-200 ${
                isCurrent
                  ? 'bg-white border-civic-blue shadow-subtle'
                  : isCompleted
                  ? 'bg-slate-50/80 border-slate-200 cursor-pointer hover:bg-slate-100/80'
                  : 'bg-white/50 border-slate-200/60 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5 mb-1.5">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 transition-colors ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-civic-blue text-white ring-4 ring-blue-50'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.number}
                </div>
                <span
                  className={`text-xs font-semibold tracking-tight ${
                    isCurrent ? 'text-navy-900 font-bold' : 'text-slate-600'
                  }`}
                >
                  {step.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 pl-8 line-clamp-1 leading-snug">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};
