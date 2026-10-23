import React, { useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/Toast';
import {
  ShieldCheck,
  UserCheck,
  Mail,
  Home,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  const [email, setEmail] = useState('complainant@demo.caselink');
  const [displayName, setDisplayName] = useState('Demo Complainant');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const from = (location.state as any)?.from?.pathname || '/my-complaints';

  const handleDemoLogin = async (targetEmail: string, targetName: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await login({
        email: targetEmail,
        display_name: targetName,
        role: 'complainant',
      });
      showToast({
        type: 'success',
        title: 'Demo Session Started',
        message: `Signed in as ${targetEmail}`,
      });
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login failed:', err);
      const msg =
        err?.message ||
        'Authentication failed. Please verify that the FastAPI backend is running at http://localhost:8000.';
      setErrorMessage(msg);
      showToast({
        type: 'error',
        title: 'Authentication Error',
        message: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please enter an email address.');
      return;
    }
    handleDemoLogin(email, displayName || email.split('@')[0]);
  };

  if (isAuthenticated && user) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-subtle">
          <UserCheck className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-navy-900">
            Currently Signed In
          </h2>
          <p className="text-xs text-slate-500 mt-1 font-mono">
            {user.email} ({user.display_name})
          </p>
          <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-civic-blue border border-blue-200 uppercase tracking-wider">
            Role: {user.role}
          </span>
        </div>

        <div className="flex flex-col gap-2 pt-4">
          <Link to="/my-complaints">
            <Button variant="primary" size="md" className="w-full">
              Go to My Complaints Dashboard
            </Button>
          </Link>
          <Button
            variant="outline"
            size="md"
            onClick={logout}
            className="w-full text-rose-600 hover:bg-rose-50 border-rose-200"
          >
            Sign Out
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 sm:px-6 py-12 sm:py-16">
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-card p-6 sm:p-8 space-y-6">
        {/* Brand Icon & Heading */}
        <div className="text-center">
          <div className="w-12 h-12 bg-navy-900 text-white rounded-xl flex items-center justify-center mx-auto mb-3 shadow-subtle">
            <ShieldCheck className="w-6 h-6 text-civic-blue" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-navy-900 tracking-tight">
            Complainant Demo Sign-in
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Access your grievance records using simulated prototype credentials.
          </p>
        </div>

        {/* Prototype explanation alert */}
        <Alert variant="info" className="text-xs">
          <div className="flex items-start gap-1.5">
            <span>
              <strong>Prototype Evaluation Identity:</strong> In accordance with SIH26264 specifications,
              this demo uses a short-lived bearer token signed by the FastAPI service.
            </span>
          </div>
        </Alert>

        {errorMessage && (
          <Alert variant="danger" title="Authentication Error">
            {errorMessage}
          </Alert>
        )}

        {/* One-click primary demo login */}
        <div>
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="w-full font-semibold shadow-subtle"
            isLoading={isLoading}
            onClick={() => handleDemoLogin('complainant@demo.caselink', 'Demo Complainant')}
            leftIcon={<UserCheck className="w-4 h-4" />}
          >
            Sign in as Demo Complainant
          </Button>
          <p className="text-[11px] text-slate-400 text-center mt-1.5">
            Logs in as <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">complainant@demo.caselink</code>
          </p>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400 absolute">
            Or Custom Identity
          </span>
        </div>

        {/* Custom Form for specific testing */}
        <form onSubmit={handleCustomSubmit} className="space-y-4" noValidate>
          <Input
            type="email"
            label="Email Address"
            required
            placeholder="complainant@demo.caselink"
            leftIcon={<Mail className="w-4 h-4" />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            type="text"
            label="Display Name"
            placeholder="Complainant User"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />

          <Button
            type="submit"
            variant="outline"
            size="md"
            className="w-full font-medium"
            isLoading={isLoading}
          >
            Sign In with Entered Identity
          </Button>
        </form>

        <div className="pt-2 text-center border-t border-slate-100">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-navy-900 transition-colors"
          >
            <Home className="w-3.5 h-3.5" />
            Back to Public Portal Home
          </Link>
        </div>
      </div>
    </div>
  );
};
