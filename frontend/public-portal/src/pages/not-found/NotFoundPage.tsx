import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Home, Search } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
      <div className="w-16 h-16 bg-slate-100 border border-slate-200 text-slate-400 rounded-2xl flex items-center justify-center mx-auto shadow-subtle">
        <span className="font-mono text-2xl font-bold text-slate-700">404</span>
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-extrabold text-navy-900 tracking-tight">
          Page Not Found
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
          The requested page does not exist or may have been relocated.
          If you are looking for an existing complaint, try tracking by reference number.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
        <Link to="/" className="w-full sm:w-auto">
          <Button variant="primary" size="md" className="w-full sm:w-auto" leftIcon={<Home className="w-4 h-4" />}>
            Return Home
          </Button>
        </Link>
        <Link to="/track" className="w-full sm:w-auto">
          <Button variant="outline" size="md" className="w-full sm:w-auto" leftIcon={<Search className="w-4 h-4" />}>
            Track Complaint
          </Button>
        </Link>
      </div>
    </div>
  );
};
