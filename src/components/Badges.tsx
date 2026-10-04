import type { SifLevel, ReviewStatus } from '@/lib/types';

export function SifBadge({ level }: { level: SifLevel }) {
  const config: Record<SifLevel, { label: string; cls: string }> = {
    HIGH: { label: 'HIGH', cls: 'sif-badge-high' },
    MEDIUM: { label: 'MEDIUM', cls: 'sif-badge-medium' },
    LOW: { label: 'LOW', cls: 'sif-badge-low' },
    'NON-SIF': { label: 'NON-SIF', cls: 'sif-badge-nonsif' },
  };
  const c = config[level];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${c.cls}`}>
      {c.label}
    </span>
  );
}

export function StatusBadge({ status }: { status: ReviewStatus }) {
  const config: Record<ReviewStatus, { label: string; cls: string }> = {
    Pending: { label: 'Pending', cls: 'status-badge-pending' },
    Reviewed: { label: 'Reviewed', cls: 'status-badge-reviewed' },
    Escalated: { label: 'Escalated', cls: 'status-badge-escalated' },
    Dismissed: { label: 'Dismissed', cls: 'status-badge-dismissed' },
  };
  const c = config[status];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${c.cls}`}>
      {c.label}
    </span>
  );
}

export function ScoreBar({ score }: { score: number }) {
  const color =
    score >= 70 ? 'var(--color-high)' :
    score >= 40 ? 'var(--color-medium)' :
    'var(--color-low)';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-gray-200 overflow-hidden min-w-[60px]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[12px] font-semibold tabular-nums" style={{ color }}>
        {score}
      </span>
    </div>
  );
}
