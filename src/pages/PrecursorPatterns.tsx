import { useMemo } from 'react';
import { TrendingUp, AlertCircle, Layers } from 'lucide-react';
import type { Report } from '@/lib/types';

interface PrecursorPatternsProps {
  reports: Report[];
}

export default function PrecursorPatterns({ reports }: PrecursorPatternsProps) {
  const insights = useMemo(() => {
    const sifReports = reports.filter((r) => r.sif_level === 'HIGH' || r.sif_level === 'MEDIUM');
    const highReports = reports.filter((r) => r.sif_level === 'HIGH');

    const lsrCounts: Record<string, number> = {};
    highReports.forEach((r) => {
      if (r.life_saving_rule && r.life_saving_rule !== 'None') {
        lsrCounts[r.life_saving_rule] = (lsrCounts[r.life_saving_rule] || 0) + 1;
      }
    });
    const topLsr = Object.entries(lsrCounts).sort((a, b) => b[1] - a[1])[0];

    const barrierCounts: Record<string, number> = {};
    sifReports.forEach((r) => {
      if (r.barrier_failure && r.barrier_failure !== 'None identified' && !r.barrier_failure.includes('successfully applied')) {
        barrierCounts[r.barrier_failure] = (barrierCounts[r.barrier_failure] || 0) + 1;
      }
    });
    const topBarrier = Object.entries(barrierCounts).sort((a, b) => b[1] - a[1])[0];

    const activityCounts: Record<string, number> = {};
    highReports.forEach((r) => {
      activityCounts[r.activity] = (activityCounts[r.activity] || 0) + 1;
    });
    const topActivity = Object.entries(activityCounts).sort((a, b) => b[1] - a[1])[0];

    const siteCounts: Record<string, number> = {};
    highReports.forEach((r) => {
      siteCounts[r.site] = (siteCounts[r.site] || 0) + 1;
    });
    const topSite = Object.entries(siteCounts).sort((a, b) => b[1] - a[1])[0];

    return { topLsr, topBarrier, topActivity, topSite, highCount: highReports.length, sifCount: sifReports.length };
  }, [reports]);

  const activityBreakdown = useMemo(() => {
    const counts: Record<string, { high: number; medium: number; total: number }> = {};
    reports.forEach((r) => {
      if (!counts[r.activity]) counts[r.activity] = { high: 0, medium: 0, total: 0 };
      counts[r.activity].total++;
      if (r.sif_level === 'HIGH') counts[r.activity].high++;
      if (r.sif_level === 'MEDIUM') counts[r.activity].medium++;
    });
    return Object.entries(counts)
      .map(([activity, c]) => ({ activity, ...c }))
      .sort((a, b) => (b.high + b.medium) - (a.high + a.medium))
      .slice(0, 10);
  }, [reports]);

  const hazardBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    reports
      .filter((r) => r.sif_level === 'HIGH' || r.sif_level === 'MEDIUM')
      .forEach((r) => {
        counts[r.hazard] = (counts[r.hazard] || 0) + 1;
      });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [reports]);

  const barrierBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    reports
      .filter((r) => r.barrier_failure && r.barrier_failure !== 'None identified' && !r.barrier_failure.includes('successfully applied'))
      .forEach((r) => {
        counts[r.barrier_failure] = (counts[r.barrier_failure] || 0) + 1;
      });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 8);
  }, [reports]);

  const lsrBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    reports.forEach((r) => {
      if (r.life_saving_rule && r.life_saving_rule !== 'None') {
        counts[r.life_saving_rule] = (counts[r.life_saving_rule] || 0) + 1;
      }
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [reports]);

  const siteBreakdown = useMemo(() => {
    const counts: Record<string, { total: number; sif: number }> = {};
    reports.forEach((r) => {
      if (!counts[r.site]) counts[r.site] = { total: 0, sif: 0 };
      counts[r.site].total++;
      if (r.sif_level === 'HIGH' || r.sif_level === 'MEDIUM') counts[r.site].sif++;
    });
    return Object.entries(counts)
      .map(([site, c]) => ({ site, ...c }))
      .sort((a, b) => b.sif - a.sif);
  }, [reports]);

  const maxActivity = Math.max(...activityBreakdown.map((a) => a.high + a.medium), 1);
  const maxHazard = Math.max(...hazardBreakdown.map(([, v]) => v), 1);
  const maxBarrier = Math.max(...barrierBreakdown.map(([, v]) => v), 1);
  const maxLsr = Math.max(...lsrBreakdown.map(([, v]) => v), 1);
  const maxSite = Math.max(...siteBreakdown.map((s) => s.sif), 1);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          Recurring Precursor Patterns
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-light)' }}>
          Trend analysis across all SIF-potential reports — derived from live data
        </p>
      </div>

      {/* Insight cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {insights.topLsr && (
          <InsightCard
            icon={<Layers size={18} />}
            title="Most Frequent Rule"
            value={insights.topLsr[0]}
            detail={`${insights.topLsr[1]} high-priority reports`}
            color="var(--color-primary)"
          />
        )}
        {insights.topBarrier && (
          <InsightCard
            icon={<AlertCircle size={18} />}
            title="Top Barrier Failure"
            value={insights.topBarrier[0]}
            detail={`${insights.topBarrier[1]} SIF-potential reports`}
            color="var(--color-high)"
          />
        )}
        {insights.topActivity && (
          <InsightCard
            icon={<TrendingUp size={18} />}
            title="Highest-Risk Activity"
            value={insights.topActivity[0]}
            detail={`${insights.topActivity[1]} high-SIF reports`}
            color="var(--color-medium)"
          />
        )}
        {insights.topSite && (
          <InsightCard
            icon={<AlertCircle size={18} />}
            title="Highest Precursor Density Site"
            value={insights.topSite[0]}
            detail={`${insights.topSite[1]} high-SIF reports`}
            color="var(--color-info)"
          />
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Activity breakdown */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            SIF Reports by Activity
          </h3>
          <div className="space-y-2.5">
            {activityBreakdown.map((a) => (
              <div key={a.activity} className="flex items-center gap-3">
                <div className="w-44 text-[12px] truncate" style={{ color: 'var(--color-text)' }}>{a.activity}</div>
                <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden flex">
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${(a.high / maxActivity) * 100}%`, backgroundColor: 'var(--color-high)' }}
                  />
                  <div
                    className="h-full transition-all duration-300"
                    style={{ width: `${(a.medium / maxActivity) * 100}%`, backgroundColor: 'var(--color-medium)' }}
                  />
                </div>
                <div className="text-[11px] w-16 text-right tabular-nums" style={{ color: 'var(--color-text-light)' }}>
                  {a.high + a.medium} SIF
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-4 mt-4 text-[11px]" style={{ color: 'var(--color-text-light)' }}>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--color-high)' }} /> High
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: 'var(--color-medium)' }} /> Medium
            </div>
          </div>
        </div>

        {/* Hazard breakdown */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Top Hazards
          </h3>
          <div className="space-y-2.5">
            {hazardBreakdown.map(([hazard, count]) => (
              <div key={hazard} className="flex items-center gap-3">
                <div className="flex-1 text-[12px] truncate" style={{ color: 'var(--color-text)' }}>{hazard}</div>
                <div className="w-28 h-5 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-300 flex items-center justify-end px-1.5"
                    style={{ width: `${(count / maxHazard) * 100}%`, backgroundColor: 'var(--color-high)' }}
                  >
                    <span className="text-[10px] text-white font-semibold tabular-nums">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Barrier failure breakdown */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Barrier Failure Frequency
          </h3>
          <div className="space-y-2.5">
            {barrierBreakdown.map(([failure, count]) => (
              <div key={failure} className="flex items-center gap-3">
                <div className="flex-1 text-[12px] truncate" style={{ color: 'var(--color-text)' }}>{failure}</div>
                <div className="w-28 h-5 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-300 flex items-center justify-end px-1.5"
                    style={{ width: `${(count / maxBarrier) * 100}%`, backgroundColor: 'var(--color-info)' }}
                  >
                    <span className="text-[10px] text-white font-semibold tabular-nums">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* LSR breakdown */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Life-Saving Rule Distribution
          </h3>
          <div className="space-y-2.5">
            {lsrBreakdown.map(([rule, count]) => (
              <div key={rule} className="flex items-center gap-3">
                <div className="w-44 text-[12px] truncate" style={{ color: 'var(--color-text)' }}>{rule}</div>
                <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                  <div
                    className="h-full rounded transition-all duration-300 flex items-center justify-end px-1.5"
                    style={{ width: `${(count / maxLsr) * 100}%`, backgroundColor: 'var(--color-primary)' }}
                  >
                    <span className="text-[10px] text-white font-semibold tabular-nums">{count}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Site breakdown */}
      <div className="card p-5 mb-6">
        <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
          Site Precursor Density
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5">
          {siteBreakdown.map((s) => (
            <div key={s.site} className="flex items-center gap-3">
              <div className="w-40 text-[12px] truncate" style={{ color: 'var(--color-text)' }}>{s.site}</div>
              <div className="flex-1 h-5 bg-gray-100 rounded overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-300 flex items-center justify-end px-1.5"
                  style={{ width: `${(s.sif / maxSite) * 100}%`, backgroundColor: 'var(--color-medium)' }}
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

      <p className="text-[11px]" style={{ color: 'var(--color-text-light)' }}>
        All insights are calculated from the live report dataset. AI-assisted screening for HSE review — not a final safety decision.
      </p>
    </div>
  );
}

function InsightCard({ icon, title, value, detail, color }: {
  icon: React.ReactNode;
  title: string;
  value: string;
  detail: string;
  color: string;
}) {
  return (
    <div className="card p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-8 h-8 rounded flex items-center justify-center" style={{ backgroundColor: `${color}18`, color }}>
          {icon}
        </div>
        <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-light)' }}>
          {title}
        </span>
      </div>
      <div className="text-[14px] font-semibold leading-snug" style={{ color: 'var(--color-text)' }}>
        {value}
      </div>
      <div className="text-[11px] mt-1" style={{ color: 'var(--color-text-light)' }}>
        {detail}
      </div>
    </div>
  );
}
