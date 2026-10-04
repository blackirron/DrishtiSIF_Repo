import { useMemo } from 'react';
import {
  FileText, AlertTriangle, TrendingUp, Clock,
  BarChart3,
} from 'lucide-react';
import type { Report } from '@/lib/types';
import type { PageId } from '@/components/Sidebar';
import { SifBadge, ScoreBar, StatusBadge } from '@/components/Badges';

interface OverviewProps {
  reports: Report[];
  onNavigate: (page: PageId) => void;
}

export default function Overview({ reports, onNavigate }: OverviewProps) {
  const stats = useMemo(() => {
    const total = reports.length;
    const sifPotential = reports.filter(
      (r) => r.sif_level === 'HIGH' || r.sif_level === 'MEDIUM',
    ).length;
    const highCount = reports.filter((r) => r.sif_level === 'HIGH').length;
    const mediumCount = reports.filter((r) => r.sif_level === 'MEDIUM').length;
    const lowCount = reports.filter((r) => r.sif_level === 'LOW' || r.sif_level === 'NON-SIF').length;
    const pending = reports.filter((r) => r.review_status === 'Pending').length;
    const sifRate = total > 0 ? ((sifPotential / total) * 100).toFixed(1) : '0.0';

    return { total, sifPotential, highCount, mediumCount, lowCount, pending, sifRate };
  }, [reports]);

  const lsrCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => {
      if (r.life_saving_rule && r.life_saving_rule !== 'None') {
        counts[r.life_saving_rule] = (counts[r.life_saving_rule] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [reports]);

  const activityCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    reports
      .filter((r) => r.sif_level === 'HIGH' || r.sif_level === 'MEDIUM')
      .forEach((r) => {
        counts[r.activity] = (counts[r.activity] || 0) + 1;
      });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [reports]);

  const siteCounts = useMemo(() => {
    const counts: Record<string, { total: number; sif: number }> = {};
    reports.forEach((r) => {
      if (!counts[r.site]) counts[r.site] = { total: 0, sif: 0 };
      counts[r.site].total++;
      if (r.sif_level === 'HIGH' || r.sif_level === 'MEDIUM') counts[r.site].sif++;
    });
    return Object.entries(counts)
      .map(([site, c]) => ({ site, ...c }))
      .sort((a, b) => b.sif - a.sif)
      .slice(0, 6);
  }, [reports]);

  const barrierFailures = useMemo(() => {
    const counts: Record<string, number> = {};
    reports
      .filter((r) => r.barrier_failure && r.barrier_failure !== 'None identified' && !r.barrier_failure.includes('successfully applied'))
      .forEach((r) => {
        counts[r.barrier_failure] = (counts[r.barrier_failure] || 0) + 1;
      });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  }, [reports]);

  const recentHigh = useMemo(() => {
    return reports
      .filter((r) => r.sif_level === 'HIGH')
      .slice(0, 8);
  }, [reports]);

  const maxLsr = Math.max(...lsrCounts.map(([, v]) => v), 1);
  const maxActivity = Math.max(...activityCounts.map(([, v]) => v), 1);
  const maxSite = Math.max(...siteCounts.map((s) => s.sif), 1);
  const maxBarrier = Math.max(...barrierFailures.map(([, v]) => v), 1);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Safety Intelligence Overview
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-light)' }}>
          AI-assisted detection of Serious Injury & Fatality precursors
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={<FileText size={20} />}
          label="Total Reports"
          value={stats.total.toLocaleString()}
          color="var(--color-primary)"
        />
        <KpiCard
          icon={<AlertTriangle size={20} />}
          label="SIF-Potential Reports"
          value={stats.sifPotential.toLocaleString()}
          sublabel={`${stats.highCount} HIGH · ${stats.mediumCount} MEDIUM`}
          color="var(--color-high)"
        />
        <KpiCard
          icon={<TrendingUp size={20} />}
          label="SIF Rate"
          value={`${stats.sifRate}%`}
          sublabel="of all reports flagged"
          color="var(--color-medium)"
        />
        <KpiCard
          icon={<Clock size={20} />}
          label="HSE Review Pending"
          value={stats.pending.toLocaleString()}
          color="var(--color-info)"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Donut */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            SIF Potential Distribution
          </h3>
          <DonutChart
            segments={[
              { label: 'High SIF', value: stats.highCount, color: 'var(--color-high)' },
              { label: 'Medium', value: stats.mediumCount, color: 'var(--color-medium)' },
              { label: 'Low / Non-SIF', value: stats.lowCount, color: 'var(--color-low)' },
            ]}
          />
        </div>

        {/* Life-Saving Rules bar */}
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            IOGP Life-Saving Rule Distribution
          </h3>
          <div className="space-y-2.5">
            {lsrCounts.map(([rule, count]) => (
              <div key={rule} className="flex items-center gap-3">
                <div className="w-40 text-[12px] truncate" style={{ color: 'var(--color-text)' }}>
                  {rule}
                </div>
                <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-300 flex items-center justify-end px-1.5"
                    style={{
                      width: `${(count / maxLsr) * 100}%`,
                      backgroundColor: 'var(--color-primary)',
                    }}
                  >
                    <span className="text-[10px] text-white font-semibold tabular-nums">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Activity */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            SIF Precursors by Activity
          </h3>
          <div className="space-y-2.5">
            {activityCounts.map(([activity, count]) => (
              <div key={activity} className="flex items-center gap-3">
                <div className="w-48 text-[12px] truncate" style={{ color: 'var(--color-text)' }}>
                  {activity}
                </div>
                <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-300 flex items-center justify-end px-1.5"
                    style={{
                      width: `${(count / maxActivity) * 100}%`,
                      backgroundColor: 'var(--color-high)',
                    }}
                  >
                    <span className="text-[10px] text-white font-semibold tabular-nums">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Site */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            SIF Potential by Site
          </h3>
          <div className="space-y-2.5">
            {siteCounts.map((s) => (
              <div key={s.site} className="flex items-center gap-3">
                <div className="w-40 text-[12px] truncate" style={{ color: 'var(--color-text)' }}>
                  {s.site}
                </div>
                <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-300 flex items-center justify-end px-1.5"
                    style={{
                      width: `${(s.sif / maxSite) * 100}%`,
                      backgroundColor: 'var(--color-medium)',
                    }}
                  >
                    <span className="text-[10px] text-white font-semibold tabular-nums">{s.sif}</span>
                  </div>
                </div>
                <div className="text-[10px] w-16 text-right" style={{ color: 'var(--color-text-light)' }}>
                  / {s.total}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Barrier failure + Recent table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Barrier Failure Analysis
          </h3>
          <div className="space-y-2.5">
            {barrierFailures.map(([failure, count]) => (
              <div key={failure} className="flex items-center gap-3">
                <div className="flex-1 text-[12px]" style={{ color: 'var(--color-text)' }}>
                  {failure}
                </div>
                <div className="w-24 h-5 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-300 flex items-center justify-end px-1.5"
                    style={{
                      width: `${(count / maxBarrier) * 100}%`,
                      backgroundColor: 'var(--color-info)',
                    }}
                  >
                    <span className="text-[10px] text-white font-semibold tabular-nums">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="p-5 pb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <BarChart3 size={14} />
              Recent High-Priority Reports
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr className="border-y" style={{ borderColor: 'var(--color-border)', backgroundColor: '#f8f9fb' }}>
                  <th className="px-4 py-2 text-left font-medium" style={{ color: 'var(--color-text-light)' }}>Report ID</th>
                  <th className="px-4 py-2 text-left font-medium" style={{ color: 'var(--color-text-light)' }}>Site</th>
                  <th className="px-4 py-2 text-left font-medium" style={{ color: 'var(--color-text-light)' }}>Activity</th>
                  <th className="px-4 py-2 text-center font-medium" style={{ color: 'var(--color-text-light)' }}>SIF</th>
                  <th className="px-4 py-2 text-left font-medium" style={{ color: 'var(--color-text-light)' }}>Score</th>
                  <th className="px-4 py-2 text-left font-medium" style={{ color: 'var(--color-text-light)' }}>Rule</th>
                  <th className="px-4 py-2 text-center font-medium" style={{ color: 'var(--color-text-light)' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentHigh.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b cursor-pointer hover:bg-gray-50"
                    style={{ borderColor: 'var(--color-border)' }}
                    onClick={() => onNavigate('reports')}
                  >
                    <td className="px-4 py-2 font-medium" style={{ color: 'var(--color-text)' }}>{r.report_id}</td>
                    <td className="px-4 py-2 truncate max-w-[120px]" style={{ color: 'var(--color-text-light)' }}>{r.site}</td>
                    <td className="px-4 py-2 truncate max-w-[140px]" style={{ color: 'var(--color-text-light)' }}>{r.activity}</td>
                    <td className="px-4 py-2 text-center"><SifBadge level={r.sif_level} /></td>
                    <td className="px-4 py-2 w-28"><ScoreBar score={r.priority_score} /></td>
                    <td className="px-4 py-2 truncate max-w-[120px]" style={{ color: 'var(--color-text-light)' }}>{r.life_saving_rule}</td>
                    <td className="px-4 py-2 text-center"><StatusBadge status={r.review_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <p className="text-[11px] mt-8" style={{ color: 'var(--color-text-light)' }}>
        AI-assisted screening for HSE review — not a final safety decision.
      </p>
    </div>
  );
}

function KpiCard({
  icon, label, value, sublabel, color,
}: { icon: React.ReactNode; label: string; value: string; sublabel?: string; color: string }) {
  return (
    <div className="card p-5">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded flex items-center justify-center"
          style={{ backgroundColor: `${color}18`, color }}
        >
          {icon}
        </div>
      </div>
      <div className="text-[11px] font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-light)' }}>
        {label}
      </div>
      <div className="text-2xl font-bold tabular-nums" style={{ color: 'var(--color-text)' }}>
        {value}
      </div>
      {sublabel && (
        <div className="text-[11px] mt-1" style={{ color: 'var(--color-text-light)' }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

function DonutChart({ segments }: { segments: { label: string; value: number; color: string }[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  let offset = 0;
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex items-center gap-5">
      <svg width="140" height="140" viewBox="0 0 140 140" className="shrink-0">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e8edf2" strokeWidth="16" />
        {segments.map((seg, i) => {
          const dash = (seg.value / total) * circumference;
          const circle = (
            <circle
              key={i}
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth="16"
              strokeDasharray={`${dash} ${circumference - dash}`}
              strokeDashoffset={-offset}
              transform="rotate(-90 70 70)"
              style={{ transition: 'stroke-dasharray 0.3s' }}
            />
          );
          offset += dash;
          return circle;
        })}
        <text x="70" y="68" textAnchor="middle" className="text-[22px] font-bold" fill="var(--color-text)">
          {total}
        </text>
        <text x="70" y="84" textAnchor="middle" className="text-[10px]" fill="var(--color-text-light)">
          Reports
        </text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: seg.color }} />
            <span className="text-[12px]" style={{ color: 'var(--color-text)' }}>{seg.label}</span>
            <span className="text-[12px] font-semibold tabular-nums" style={{ color: 'var(--color-text-light)' }}>
              {seg.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
