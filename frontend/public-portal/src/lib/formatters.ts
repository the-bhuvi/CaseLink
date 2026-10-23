import { CaseStatus } from '@/types/complaint';

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatDateOnly(dateString?: string | null): string {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return new Intl.DateTimeFormat('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateString;
  }
}

export function formatTimeAgo(dateString?: string | null): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 60) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 30) return `${diffDays}d ago`;
    return formatDateOnly(dateString);
  } catch {
    return '';
  }
}

export interface StatusMeta {
  label: string;
  badgeClass: string;
  dotClass: string;
  description: string;
}

export function getStatusMeta(status: CaseStatus | string): StatusMeta {
  const norm = (status || '').toLowerCase().replace(/\s+/g, '_');
  switch (norm) {
    case 'received':
      return {
        label: 'Received',
        badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
        dotClass: 'bg-slate-400',
        description: 'Your complaint has been logged and assigned for initial intake review.',
      };
    case 'under_review':
      return {
        label: 'Under Review',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
        dotClass: 'bg-amber-500',
        description: 'Assigned officers are evaluating jurisdiction and complaint specifics.',
      };
    case 'in_progress':
      return {
        label: 'In Progress',
        badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
        dotClass: 'bg-blue-500',
        description: 'Coordinated inquiry or institutional communication is actively underway.',
      };
    case 'awaiting_information':
      return {
        label: 'Awaiting Info',
        badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
        dotClass: 'bg-purple-500',
        description: 'Additional documentation or clarification has been requested.',
      };
    case 'escalated':
      return {
        label: 'Escalated',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
        dotClass: 'bg-rose-500',
        description: 'Case has been referred for elevated supervisory oversight.',
      };
    case 'disposed':
      return {
        label: 'Disposed',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        dotClass: 'bg-emerald-500',
        description: 'Case inquiry has concluded and final disposition action has been recorded.',
      };
    default:
      return {
        label: status || 'Pending',
        badgeClass: 'bg-gray-100 text-gray-700 border-gray-200',
        dotClass: 'bg-gray-400',
        description: 'Case is progressing through the grievance review cycle.',
      };
  }
}
