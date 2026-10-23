import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  Search,
  ArrowRight,
  EyeOff,
  CheckCircle2,
  Lock,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [quickReference, setQuickReference] = useState('');
  const navigate = useNavigate();

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickReference.trim()) {
      navigate(`/track?ref=${encodeURIComponent(quickReference.trim())}`);
    }
  };

  return (
    <div className="space-y-16 sm:space-y-24">
      {/* Hero Section */}
      <section className="relative pt-12 sm:pt-20 pb-16 bg-gradient-to-b from-white via-white to-civic-off-white border-b border-slate-200/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-civic-blue text-xs font-semibold uppercase tracking-wider mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-civic-blue animate-pulse" />
            Institution Grievance Tracking
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl font-extrabold text-navy-900 tracking-tight leading-[1.15] max-w-3xl mx-auto">
            Your Complaint.{' '}
            <span className="text-civic-blue">A Clearer Path to Resolution.</span>
          </h1>

          {/* Supporting Copy */}
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Submit your institution-related concern and securely monitor public-facing progress.
            CASELINK AI provides transparent milestone tracking while safeguarding confidential administrative deliberations.
          </p>

          {/* Primary & Secondary CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link to="/submit" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto font-semibold px-8 shadow-card"
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Submit a Complaint
              </Button>
            </Link>
            <Link to="/track" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto font-semibold px-8"
                leftIcon={<Search className="w-4 h-4 text-slate-500" />}
              >
                Track a Complaint
              </Button>
            </Link>
          </div>

          {/* Quick Track Widget */}
          <div className="mt-12 max-w-lg mx-auto bg-white rounded-2xl border border-slate-200 p-2.5 shadow-card">
            <form onSubmit={handleQuickTrack} className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={quickReference}
                  onChange={(e) => setQuickReference(e.target.value)}
                  placeholder="Enter reference number (e.g. CL-2026-00001)"
                  className="w-full pl-10 pr-3 py-2 text-sm text-navy-900 placeholder:text-slate-400 bg-transparent border-0 focus:outline-none focus:ring-0"
                />
              </div>
              <Button type="submit" variant="secondary" size="sm">
                Lookup
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-semibold text-civic-blue uppercase tracking-wider mb-2">
            Transparent Workflow
          </h2>
          <h3 className="text-2xl sm:text-3xl font-bold text-navy-900 tracking-tight">
            How Grievance Tracking Works
          </h3>
          <p className="mt-2 text-sm text-slate-600">
            A structured, three-phase model designed for accountability and fairness.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Step 1 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-subtle hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-civic-blue flex items-center justify-center font-bold text-base mb-4">
              1
            </div>
            <h4 className="text-base font-semibold text-navy-900 mb-2">
              Submit Your Concern
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Identify the institution, choose the appropriate issue category, and describe your grievance in four guided steps with optional supporting documentation.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-subtle hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-civic-blue flex items-center justify-center font-bold text-base mb-4">
              2
            </div>
            <h4 className="text-base font-semibold text-navy-900 mb-2">
              Complaint is Reviewed
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Assigned oversight officers evaluate jurisdiction and coordinate with relevant institutional bureaus to initiate formal inquiry and compliance checks.
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-subtle hover:border-slate-300 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 text-civic-blue flex items-center justify-center font-bold text-base mb-4">
              3
            </div>
            <h4 className="text-base font-semibold text-navy-900 mb-2">
              Follow Available Status Updates
            </h4>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Access authenticated milestone timelines to verify that your complaint has been received, investigated, and brought to disposition.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Privacy Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-navy-900 text-white rounded-2xl p-8 sm:p-12 shadow-card border border-navy-800">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-navy-800 border border-navy-700 text-civic-blue text-xs font-semibold mb-4">
              <Lock className="w-3.5 h-3.5" />
              Confidentiality & Data Protection
            </div>
            <h3 className="text-2xl sm:text-3xl font-bold tracking-tight text-white mb-4">
              Privacy Designed by Architecture
            </h3>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6">
              CASELINK AI strictly segregates public-facing milestone tracking from internal administrative deliberations.
              Access to grievance information is protected by authenticated complainant credentials.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <strong className="text-white block font-semibold">Protected Access:</strong>
                  Only you can view your filed complaint records and timeline events.
                </div>
              </div>
              <div className="flex items-start gap-3">
                <EyeOff className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  <strong className="text-white block font-semibold">Restricted Notes:</strong>
                  Internal officer notes and cross-bureau overlap analysis remain confidential.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pre-footer Call to Action */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center pb-8">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-10 shadow-card">
          <h3 className="text-xl sm:text-2xl font-bold text-navy-900 mb-2">
            Ready to lodge an institutional grievance?
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto mb-6">
            Our structured submission wizard will guide you step by step to ensure your complaint is complete and properly routed.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Link to="/submit">
              <Button variant="primary" size="md">
                Begin Complaint Submission
              </Button>
            </Link>
            <Link to="/help">
              <Button variant="outline" size="md">
                Read Submission Guide
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
