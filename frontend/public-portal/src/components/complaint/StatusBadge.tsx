import React from 'react';
import { getStatusMeta } from '@/lib/formatters';
import { CaseStatus } from '@/types/complaint';
import { cn } from '@/lib/utils';

export interface StatusBadgeProps {
  status: CaseStatus | string;
  className?: string;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  className,
  showDot = true,
}) => {
  const meta = getStatusMeta(status);

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border tracking-wide transition-colors',
        meta.badgeClass,
        className
      )}
      title={meta.description}
    >
      {showDot && <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', meta.dotClass)} />}
      <span>{meta.label}</span>
    </span>
  );
};
