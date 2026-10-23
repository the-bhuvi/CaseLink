import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { Menu, X, FilePlus2, Search, HelpCircle } from 'lucide-react';

export const Header: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-900 font-bold text-white">C</span>
          <span className="font-bold tracking-tight text-navy-900">CASELINK <span className="text-civic-blue">AI</span></span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          <Link to="/submit"><Button variant={isActive('/submit') ? 'secondary' : 'ghost'} size="sm" leftIcon={<FilePlus2 className="h-4 w-4" />}>Submit complaint</Button></Link>
          <Link to="/track"><Button variant={isActive('/track') ? 'secondary' : 'ghost'} size="sm" leftIcon={<Search className="h-4 w-4" />}>Track case</Button></Link>
          <Link to="/help"><Button variant={isActive('/help') ? 'secondary' : 'ghost'} size="sm" leftIcon={<HelpCircle className="h-4 w-4" />}>Guidance</Button></Link>
        </nav>
        <button className="rounded-lg p-2 text-navy-900 md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} aria-label="Toggle navigation">{mobileMenuOpen ? <X /> : <Menu />}</button>
      </div>
      {mobileMenuOpen && <nav className="border-t border-slate-100 bg-white p-4 md:hidden"><div className="flex flex-col gap-2"><Link onClick={() => setMobileMenuOpen(false)} to="/submit" className="rounded-lg px-3 py-2 text-sm font-semibold text-navy-900">Submit complaint</Link><Link onClick={() => setMobileMenuOpen(false)} to="/track" className="rounded-lg px-3 py-2 text-sm font-semibold text-navy-900">Track case</Link><Link onClick={() => setMobileMenuOpen(false)} to="/help" className="rounded-lg px-3 py-2 text-sm font-semibold text-navy-900">Guidance</Link></div></nav>}
    </header>
  );
};
