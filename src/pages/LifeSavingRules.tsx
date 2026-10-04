import { useMemo, useState } from 'react';
import { Lock, ChevronRight } from 'lucide-react';
import type { Report } from '@/lib/types';
import type { PageId } from '@/components/Sidebar';

interface LifeSavingRulesProps {
  reports: Report[];
  onNavigate: (page: PageId) => void;
}

interface RuleData {
  rule: string;
  total: number;
  highCount: number;
  mediumCount: number;
  topActivities: { name: string; count: number }[];
  topHazards: { name: string; count: number }[];
  topBarrierFailures: { name: string; count: number }[];
}

export default function LifeSavingRules({ reports, onNavigate }: LifeSavingRulesProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const rules = useMemo(() => {
    const ruleMap: Record<string, RuleData> = {};

    reports.forEach((r) => {
      if (!r.life_saving_rule || r.life_saving_rule === 'None') return;
      if (!ruleMap[r.life_saving_rule]) {
        ruleMap[r.life_saving_rule] = {
          rule: r.life_saving_rule,
          total: 0,
          highCount: 0,
          mediumCount: 0,
          topActivities: [],
          topHazards: [],
          topBarrierFailures: [],
        };
      }
      const rd = ruleMap[r.life_saving_rule];
      rd.total++;
      if (r.sif_level === 'HIGH') rd.highCount++;
      if (r.sif_level === 'MEDIUM') rd.mediumCount++;
    });

    // Aggregate activities, hazards, barrier failures per rule
    Object.keys(ruleMap).forEach((ruleName) => {
      const ruleReports = reports.filter((r) => r.life_saving_rule === ruleName);
      const actCounts: Record<string, number> = {};
      const hazCounts: Record<string, number> = {};
      const barCounts: Record<string, number> = {};

      ruleReports.forEach((r) => {
        actCounts[r.activity] = (actCounts[r.activity] || 0) + 1;
        hazCounts[r.hazard] = (hazCounts[r.hazard] || 0) + 1;
        if (r.barrier_failure && r.barrier_failure !== 'None identified' && !r.barrier_failure.includes('successfully applied')) {
          barCounts[r.barrier_failure] = (barCounts[r.barrier_failure] || 0) + 1;
        }
      });

      ruleMap[ruleName].topActivities = Object.entries(actCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({ name, count }));
      ruleMap[ruleName].topHazards = Object.entries(hazCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({ name, count }));
      ruleMap[ruleName].topBarrierFailures = Object.entries(barCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name, count]) => ({ name, count }));
    });

    return Object.values(ruleMap).sort((a, b) => b.total - a.total);
  }, [reports]);

  return (
    <div className="p-6 max-w-[1200px] mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          IOGP Life-Saving Rules
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-light)' }}>
          Report distribution across configured IOGP Life-Saving Rules
        </p>
      </div>

      <div className="space-y-3">
        {rules.map((rd) => (
          <div key={rd.rule} className="card overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === rd.rule ? null : rd.rule)}
              className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
            >
              <div
                className="w-10 h-10 rounded flex items-center justify-center shrink-0"
                style={{ backgroundColor: 'var(--color-info-bg)', color: 'var(--color-info)' }}
              >
                <Lock size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3">
                  <span className="text-[15px] font-semibold" style={{ color: 'var(--color-text)' }}>
                    {rd.rule}
                  </span>
                  <span className="text-[11px] px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-high-bg)', color: 'var(--color-high)' }}>
                    {rd.highCount} HIGH
                  </span>
                  {rd.mediumCount > 0 && (
                    <span className="text-[11px] px-2 py-0.5 rounded" style={{ backgroundColor: 'var(--color-medium-bg)', color: 'var(--color-medium)' }}>
                      {rd.mediumCount} MEDIUM
                    </span>
                  )}
                </div>
                <div className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-light)' }}>
                  {rd.total} total reports
                </div>
              </div>
              <ChevronRight
                size={18}
                className="shrink-0 transition-transform"
                style={{
                  color: 'var(--color-text-light)',
                  transform: expanded === rd.rule ? 'rotate(90deg)' : 'none',
                }}
              />
            </button>

            {expanded === rd.rule && (
              <div className="border-t p-4 grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in" style={{ borderColor: 'var(--color-border)' }}>
                <BreakdownList title="Top Activities" items={rd.topActivities} />
                <BreakdownList title="Top Hazards" items={rd.topHazards} />
                <BreakdownList title="Top Barrier Failures" items={rd.topBarrierFailures} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6">
        <button
          onClick={() => onNavigate('reports')}
          className="text-[13px] font-medium hover:underline"
          style={{ color: 'var(--color-primary)' }}
        >
          View all reports in SIF Reports →
        </button>
      </div>

      <p className="text-[11px] mt-8" style={{ color: 'var(--color-text-light)' }}>
        Only configured IOGP Life-Saving Rules are shown. AI-assisted screening for HSE review — not a final safety decision.
      </p>
    </div>
  );
}

function BreakdownList({ title, items }: { title: string; items: { name: string; count: number }[] }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-light)' }}>
        {title}
      </div>
      {items.length > 0 ? (
        <div className="space-y-1.5">
          {items.map((item, i) => (
            <div key={i} className="flex items-center justify-between text-[12px]">
              <span style={{ color: 'var(--color-text)' }}>{item.name}</span>
              <span className="font-semibold tabular-nums" style={{ color: 'var(--color-text-light)' }}>{item.count}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-[12px]" style={{ color: 'var(--color-text-light)' }}>No data</div>
      )}
    </div>
  );
}
