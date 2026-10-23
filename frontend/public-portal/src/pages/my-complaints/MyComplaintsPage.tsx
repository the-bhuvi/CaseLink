import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/context/AuthContext';
import { CaseResponse } from '@/types/complaint';
import { ComplaintCard } from '@/components/complaint/ComplaintCard';
import { StatusBadge } from '@/components/complaint/StatusBadge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { formatTimeAgo } from '@/lib/formatters';
import {
  Search,
  PlusCircle,
  Clock,
  AlertCircle,
  CheckCircle2,
  Inbox,
  LayoutGrid,
  List,
  ChevronRight,
  UserCheck,
  Lock,
} from 'lucide-react';

export const MyComplaintsPage: React.FC = () => {
  const { user, isAuthenticated, login, isLoading: authLoading } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const page = 1;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['my-complaints', page],
    queryFn: () => apiClient.getMyComplaints(page, 50),
    enabled: isAuthenticated,
    retry: 1,
  });

  const rawItems: CaseResponse[] = data?.items || [];

  // Calculate dynamic stats strictly from API data
  const stats = useMemo(() => {
    return {
      total: data?.total || rawItems.length,
      underReview: rawItems.filter((c) => c.status === 'under_review').length,
      awaitingInfo: rawItems.filter((c) => c.status === 'awaiting_information').length,
      disposed: rawItems.filter((c) => c.status === 'disposed').length,
    };
  }, [data, rawItems]);

  // Filter items by search query & status filter
  const filteredItems = useMemo(() => {
    return rawItems.filter((item) => {
      const matchesSearch =
        searchQuery === '' ||
        item.reference.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.institution_name.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [rawItems, searchQuery, statusFilter]);

  if (authLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-24 rounded-xl" />
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  // Not authenticated prompt
  if (!isAuthenticated) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 bg-blue-50 border border-blue-200 text-civic-blue rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-subtle">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-navy-900 mb-2">
          Complainant Dashboard Protected
        </h2>
        <p className="text-sm text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">
          Please sign in to access your submitted institutional complaints and real-time public milestone updates.
        </p>
        <Button
          variant="primary"
          size="lg"
          onClick={() => login({ email: 'complainant@demo.caselink', role: 'complainant' })}
          leftIcon={<UserCheck className="w-4 h-4" />}
          className="shadow-subtle"
        >
          Sign in as Demo Complainant (complainant@demo.caselink)
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-civic-blue">
            Authenticated Complainant
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 tracking-tight mt-0.5">
            My Complaints Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Logged in as <strong className="text-navy-900">{user?.email}</strong>. Showing records associated with your profile.
          </p>
        </div>

        <Link to="/submit">
          <Button variant="primary" size="md" leftIcon={<PlusCircle className="w-4 h-4" />} className="shadow-subtle">
            Lodge New Complaint
          </Button>
        </Link>
      </div>

      {/* Dynamic Metric Cards (Calculated strictly from API data) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Submitted */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4.5 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">Total Submitted</span>
            <Inbox className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-navy-900 mt-2 font-mono">
            {stats.total}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Grievances filed</p>
        </div>

        {/* Under Review */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4.5 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700">Under Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-amber-700 mt-2 font-mono">
            {stats.underReview}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Intake assessment</p>
        </div>

        {/* Awaiting Information */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4.5 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-700">Awaiting Info</span>
            <AlertCircle className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-purple-700 mt-2 font-mono">
            {stats.awaitingInfo}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Action required</p>
        </div>

        {/* Resolved / Disposed */}
        <div className="bg-white rounded-xl border border-slate-200/90 p-4.5 shadow-subtle">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700">Resolved / Disposed</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-700 mt-2 font-mono">
            {stats.disposed}
          </p>
          <p className="text-[11px] text-slate-400 mt-1">Concluded matters</p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-subtle flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by reference, subject, institution..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-navy-900 placeholder:text-slate-400 focus-ring"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0 text-xs">
            {[
              { id: 'all', label: 'All' },
              { id: 'received', label: 'Received' },
              { id: 'under_review', label: 'Under Review' },
              { id: 'in_progress', label: 'In Progress' },
              { id: 'awaiting_information', label: 'Awaiting Info' },
              { id: 'disposed', label: 'Disposed' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  statusFilter === tab.id
                    ? 'bg-navy-900 text-white font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* View Mode Toggle */}
          <div className="hidden sm:flex items-center gap-1 border-l border-slate-200 pl-3">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md ${
                viewMode === 'grid' ? 'bg-slate-200 text-navy-900' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Card Grid View"
              aria-label="Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md ${
                viewMode === 'table' ? 'bg-slate-200 text-navy-900' : 'text-slate-400 hover:text-slate-700'
              }`}
              title="Compact Table View"
              aria-label="Compact Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area: Loading / Error / Empty / List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      ) : isError ? (
        <ErrorState
          title="Could not load complaints"
          message={(error as any)?.message || 'An error occurred while fetching your records from the server.'}
          onRetry={() => refetch()}
        />
      ) : rawItems.length === 0 ? (
        <EmptyState
          icon={<Inbox className="w-8 h-8 text-slate-400" />}
          title="No complaints filed yet"
          description="You haven't submitted any institutional grievances under this complainant account."
          actionLabel="Submit Your First Complaint"
          actionHref="/submit"
        />
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center max-w-md mx-auto">
          <Search className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-navy-900">No matching grievances found</h3>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            No complaints match your current search query or status filter.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('all');
            }}
          >
            Clear Filters
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredItems.map((complaint) => (
            <ComplaintCard key={complaint.id} complaint={complaint} />
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-subtle overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Institution</th>
                  <th className="py-3 px-4">Subject</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Submitted</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((complaint) => (
                  <tr key={complaint.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-navy-900">
                      {complaint.reference}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-navy-900 max-w-[200px] truncate">
                      {complaint.institution_name}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 max-w-[260px] truncate">
                      {complaint.subject}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {complaint.category}
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={complaint.status} />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      {formatTimeAgo(complaint.received_at)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        to={`/my-complaints/${complaint.id}`}
                        className="font-semibold text-civic-blue hover:text-civic-blue-hover inline-flex items-center gap-0.5"
                      >
                        Timeline <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
