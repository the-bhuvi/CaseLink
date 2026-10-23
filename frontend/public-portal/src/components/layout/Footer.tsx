import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-navy-900 text-slate-300 border-t border-navy-800 text-sm mt-auto">
      {/* Disclaimer Banner */}
      <div className="bg-navy-950 border-b border-navy-800/80 py-3 px-4">
        <div className="max-w-7xl mx-auto flex items-start sm:items-center gap-2.5 text-xs text-amber-200/90">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
          <p>
            <strong className="font-semibold text-amber-300">Prototype Disclaimer (SIH26264):</strong>{' '}
            CASELINK AI is an academic research prototype developed for Smart India Hackathon 2024 (Problem Statement SIH26264).
            It is not an official AICTE or government website and does not submit records to official regulatory systems.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Identity & Tagline */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-civic-blue flex items-center justify-center text-white">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <span className="font-bold text-lg text-white tracking-tight">
                CASELINK AI
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md">
              An Explainable Cross-Bureau Institution Complaint Monitoring and Coordination System.
              Connecting institutional inquiries across disparate oversight bureaus for transparent, unified resolution tracking.
            </p>
            <p className="text-xs font-medium text-civic-blue tracking-wide">
              One Institution. Connected Cases. Coordinated Action.
            </p>
          </div>

          {/* Quick Navigation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
              Complainant Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link to="/submit" className="hover:text-white transition-colors">
                  Submit a Complaint
                </Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-white transition-colors">
                  Track Existing Complaint
                </Link>
              </li>
              <li>
                <Link to="/help" className="hover:text-white transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* Privacy & Trust */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
              Trust & Data Safety
            </h4>
            <p className="text-xs text-slate-400 leading-relaxed mb-3">
              Public tracking exposes only safe timeline events. Internal review notes and administrative coordination data remain restricted to the backend demonstration workflow.
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-navy-800 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} CASELINK AI — Prototype SIH26264. All rights reserved.</p>
          <div className="flex items-center gap-6 text-slate-400">
            <Link to="/help" className="hover:text-slate-200 transition-colors">
              Data Privacy Architecture
            </Link>
            <Link to="/help" className="hover:text-slate-200 transition-colors">
              Security Notice
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
