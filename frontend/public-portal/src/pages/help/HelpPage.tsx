import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import {
  HelpCircle,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Search,
  PlusCircle,
} from 'lucide-react';

interface FaqItem {
  question: string;
  answer: string | React.ReactNode;
  category: string;
}

const FAQS: FaqItem[] = [
  {
    category: 'Submission',
    question: 'How do I lodge a complaint against an educational institution?',
    answer:
      'Click "Submit Complaint" and complete the 4-step wizard: (1) Identify the institution name and state, (2) Specify the grievance category, subject, and description, (3) Provide your contact details and optional document attachments, and (4) Review your summary before submission.',
  },
  {
    category: 'Submission',
    question: 'Do I need to know the AICTE Permanent ID of the institution?',
    answer:
      'No. The AICTE Permanent ID is optional. If you have it from official approval orders or admission receipts, it helps automate institutional matching; otherwise, entering the accurate full institution name is sufficient.',
  },
  {
    category: 'Tracking & Privacy',
    question: 'What information is shown on the tracking page?',
    answer:
      'Tracking uses the generated reference and returns only public-safe case milestones. Internal notes, relationship evidence, attachments, and other complainants\' information are not exposed.',
  },
  {
    category: 'Tracking & Privacy',
    question: 'What do the different complaint statuses mean?',
    answer: (
      <div className="space-y-2 mt-1">
        <p><strong>Received:</strong> The grievance has been safely logged in the system and queued for bureau assignment.</p>
        <p><strong>Under Review:</strong> Intake officers are assessing jurisdiction and institutional history.</p>
        <p><strong>In Progress:</strong> Formal inquiry, cross-bureau coordination, or institution communication is active.</p>
        <p><strong>Awaiting Information:</strong> Review officers have requested additional documents or clarification from you.</p>
        <p><strong>Escalated:</strong> Case has been referred for elevated supervisory oversight.</p>
        <p><strong>Disposed:</strong> The inquiry has concluded and the final disposition action has been recorded.</p>
      </div>
    ),
  },
  {
    category: 'AI & Coordination',
    question: 'What is cross-bureau coordination in CASELINK AI?',
    answer:
      'Institutions frequently receive related grievances across separate regulatory divisions (such as the Regional Bureau and the Public Grievance Redressal Cell). CASELINK AI uses semantic natural-language matching to alert officers to connected issues at the same institution, preventing redundant actions and accelerating coordinated resolution.',
  },
  {
    category: 'AI & Coordination',
    question: 'Can I see the internal officer notes or similarity scores?',
    answer:
      'No. To protect administrative integrity and unbiased deliberation, internal officer comments, audit logs, and AI confidence scores are restricted to authorized regulatory staff. Complainants receive only public milestones and official status updates.',
  },
  {
    category: 'Disclaimer',
    question: 'Is this an official AICTE regulatory portal?',
    answer:
      'No. CASELINK AI is a prototype developed for Smart India Hackathon (Problem Statement SIH26264). It is not an official AICTE or Ministry of Education website. Data submitted here is handled in a simulated testing environment and is not forwarded to official government grievance systems.',
  },
];

export const HelpPage: React.FC = () => {
  const [openIndexes, setOpenIndexes] = useState<number[]>([0, 1]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const toggleFaq = (index: number) => {
    setOpenIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const categories = ['All', 'Submission', 'Tracking & Privacy', 'AI & Coordination', 'Disclaimer'];

  const filteredFaqs = FAQS.filter(
    (faq) => selectedCategory === 'All' || faq.category === selectedCategory
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-12">
      {/* Title */}
      <div className="text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-civic-blue text-xs font-semibold mb-3">
          <HelpCircle className="w-3.5 h-3.5" />
          Complainant Support & Knowledge Base
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-navy-900 tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto leading-relaxed">
          Learn how complaint intake works, why privacy is protected, and how to track the status of your institutional grievance.
        </p>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center justify-center gap-1.5 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              selectedCategory === cat
                ? 'bg-navy-900 text-white shadow-subtle'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* FAQ Accordion List */}
      <div className="space-y-3">
        {filteredFaqs.map((faq, idx) => {
          const isOpen = openIndexes.includes(idx);
          return (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 shadow-subtle overflow-hidden transition-colors"
            >
              <button
                onClick={() => toggleFaq(idx)}
                className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex items-center gap-3">
                  <span className="text-[11px] font-semibold text-civic-blue bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                    {faq.category}
                  </span>
                  <span className="text-sm font-semibold text-navy-900">
                    {faq.question}
                  </span>
                </div>
                <div className="text-slate-400 shrink-0">
                  {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 animate-in fade-in duration-150">
                  {faq.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Prototype Advisory Banner */}
      <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-6 text-xs text-amber-950 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="font-semibold text-amber-900 text-sm">
            Prototype Evaluation Guidance
          </h4>
          <p className="leading-relaxed">
            CASELINK AI is an explainable AI system demonstration designed for cross-bureau coordination.
            If you need to submit an actual urgent legal grievance regarding an educational institution,
            please visit the officially authorized central or state government portals.
          </p>
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-4">
        <h3 className="text-lg font-bold text-navy-900">
          Still have questions or ready to lodge a grievance?
        </h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Start your complaint submission or check the public progress of an existing reference.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <Link to="/submit">
            <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />}>
              Submit Complaint
            </Button>
          </Link>
          <Link to="/track">
            <Button variant="outline" size="md" leftIcon={<Search className="w-4 h-4" />}>
              Track Existing Case
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
