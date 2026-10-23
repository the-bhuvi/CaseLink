import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import {
  ShieldCheck,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  FileText,
  PlusCircle,
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Submit Complaint', path: '/submit' },
    { label: 'Track Complaint', path: '/track' },
    { label: 'Help & FAQ', path: '/help' },
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Wordmark */}
          <Link
            to="/"
            className="flex items-center gap-3 focus-ring rounded-lg py-1 px-1.5 -ml-1.5 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-navy-900 flex items-center justify-center text-white shadow-subtle">
              <ShieldCheck className="w-5 h-5 text-civic-blue" />
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight text-navy-900 leading-none">
                CASELINK<span className="text-civic-blue ml-1 font-semibold text-xs tracking-wider uppercase bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">AI</span>
              </span>
              <span className="text-[10px] text-slate-500 font-medium tracking-tight mt-0.5">
                Public Grievance Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-3.5 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive(link.path)
                    ? 'text-civic-blue bg-blue-50/70 font-semibold'
                    : 'text-slate-600 hover:text-navy-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth / User Action */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link to="/my-complaints">
                  <Button
                    variant={isActive('/my-complaints') ? 'secondary' : 'outline'}
                    size="sm"
                    leftIcon={<FileText className="w-4 h-4 text-civic-blue" />}
                  >
                    My Complaints
                  </Button>
                </Link>
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-navy-900 font-semibold text-xs" title={user.email}>
                    {user.display_name.charAt(0).toUpperCase()}
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors"
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="outline" size="sm" leftIcon={<UserIcon className="w-4 h-4" />}>
                    Sign in
                  </Button>
                </Link>
                <Link to="/submit">
                  <Button variant="primary" size="sm" leftIcon={<PlusCircle className="w-4 h-4" />}>
                    Submit Complaint
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-navy-900 hover:bg-slate-100 focus-ring"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-5 space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="flex flex-col space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive(link.path)
                    ? 'text-civic-blue bg-blue-50 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-col gap-2">
            {isAuthenticated && user ? (
              <>
                <Link
                  to="/my-complaints"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button variant="secondary" size="md" className="w-full" leftIcon={<FileText className="w-4 h-4" />}>
                    My Complaints ({user.display_name})
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  size="md"
                  className="w-full text-rose-600 hover:bg-rose-50 border-rose-200"
                  leftIcon={<LogOut className="w-4 h-4" />}
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/submit"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button variant="primary" size="md" className="w-full" leftIcon={<PlusCircle className="w-4 h-4" />}>
                    Submit Complaint
                  </Button>
                </Link>
                <Link
                  to="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full"
                >
                  <Button variant="outline" size="md" className="w-full" leftIcon={<UserIcon className="w-4 h-4" />}>
                    Sign in (Demo Complainant)
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
