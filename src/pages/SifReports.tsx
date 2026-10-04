import { useState, useMemo } from 'react';
import {
  Search, Eye, X, ClipboardCheck, User, Save, AlertTriangle, Loader2, CheckCircle2,
} from 'lucide-react';
import type { Report, ReviewStatus, SifLevel } from '@/lib/types';
import type { PageId } from '@/components/Sidebar';
import { SifBadge, StatusBadge, ScoreBar } from '@/components/Badges';
import { supabase } from '@/lib/supabase';

interface SifReportsProps {
  reports: Report[];
  onStatusChange: () => void;
}

const SIF_LEVELS: (SifLevel | 'ALL')[] = ['ALL', 'HIGH', 'MEDIUM', 'LOW', 'NON-SIF'];
const REVIEW_STATUSES: (ReviewStatus | 'ALL')[] = ['ALL', 'Pending', 'Reviewed', 'Escalated', 'Dismissed'];

export default function SifReports({ reports, onStatusChange }: SifReportsProps) {
  const [search, setSearch] = useState('');
  const [sifFilter, setSifFilter] = useState<SifLevel | 'ALL'>('ALL');
  const [lsrFilter, setLsrFilter] = useState('ALL');
  const [siteFilter, setSiteFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<ReviewStatus | 'ALL'>('ALL');
  const [selected, setSelected] = useState<Report | null>(null);
  const [updating, setUpdating] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const lsrOptions = useMemo(() => {
    const set = new Set(reports.map((r) => r.life_saving_rule).filter((r) => r && r !== 'None'));
    return Array.from(set).sort();
  }, [reports]);

  const siteOptions = useMemo(() => {
    const set = new Set(reports.map((r) => r.site));
    return Array.from(set).sort();
  }, [reports]);

  const filtered = useMemo(() => {
    return reports.filter((r) => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !r.raw_narrative.toLowerCase().includes(q) &&
          !r.report_id.toLowerCase().includes(q) &&
          !r.activity.toLowerCase().includes(q) &&
          !r.hazard.toLowerCase().includes(q) &&
          !r.barrier_failure.toLowerCase().includes(q)
        ) return false;
      }
      if (sifFilter !== 'ALL' && r.sif_level !== sifFilter) return false;
      if (lsrFilter !== 'ALL' && r.life_saving_rule !== lsrFilter) return false;
      if (siteFilter !== 'ALL' && r.site !== siteFilter) return false;
      if (statusFilter !== 'ALL' && r.review_status !== statusFilter) return false;
      return true;
    });
  }, [reports, search, sifFilter, lsrFilter, siteFilter, statusFilter]);

  const handleStatusUpdate = async (reportId: string, newStatus: ReviewStatus) => {
    setUpdating(true);
    setUpdateMsg(null);
    const { error } = await supabase
      .from('reports')
      .update({ review_status: newStatus })
      .eq('id', reportId);

    setUpdating(false);
    if (error) {
      setUpdateMsg({ type: 'error', text: `Failed to update status: ${error.message}` });
    } else {
      setUpdateMsg({ type: 'success', text: `Review status updated to "${newStatus}"` });
      setSelected((prev) => prev ? { ...prev, review_status: newStatus } : prev);
      onStatusChange();
      setTimeout(() => setUpdateMsg(null), 3000);
    }
  };

  const handleReviewSubmitted = (updated: Report) => {
    setSelected(updated);
    onStatusChange();
  };

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="mb-5">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
          SIF Reports
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-text-light)' }}>
          Searchable history of all analyzed safety reports
        </p>
      </div>

      {updateMsg && (
        <div
          className="mb-4 px-4 py-2.5 rounded text-sm animate-fade-in"
          style={{
            backgroundColor: updateMsg.type === 'success' ? 'var(--color-low-bg)' : 'var(--color-high-bg)',
            color: updateMsg.type === 'success' ? 'var(--color-low)' : 'var(--color-high)',
            border: `1px solid ${updateMsg.type === 'success' ? 'var(--color-low)' : 'var(--color-high)'}`,
          }}
        >
          {updateMsg.text}
        </div>
      )}

      {/* Filters */}
      <div className="card p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-light)' }} />
            <input
              type="text"
              placeholder="Search narrative, ID, activity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-[13px] border rounded outline-none focus:border-[var(--color-primary)]"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
            />
          </div>
          <FilterSelect label="SIF Level" value={sifFilter} onChange={(v) => setSifFilter(v as SifLevel | 'ALL')} options={SIF_LEVELS} />
          <FilterSelect label="Life-Saving Rule" value={lsrFilter} onChange={setLsrFilter} options={['ALL', ...lsrOptions]} />
          <FilterSelect label="Site" value={siteFilter} onChange={setSiteFilter} options={['ALL', ...siteOptions]} />
          <FilterSelect label="Status" value={statusFilter} onChange={(v) => setStatusFilter(v as ReviewStatus | 'ALL')} options={REVIEW_STATUSES} />
        </div>
        <div className="mt-3 text-[12px]" style={{ color: 'var(--color-text-light)' }}>
          Showing {filtered.length} of {reports.length} reports
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[12px]">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--color-border)', backgroundColor: '#f8f9fb' }}>
                <th className="px-4 py-2.5 text-left font-medium" style={{ color: 'var(--color-text-light)' }}>Report ID</th>
                <th className="px-4 py-2.5 text-left font-medium" style={{ color: 'var(--color-text-light)' }}>Date</th>
                <th className="px-4 py-2.5 text-left font-medium" style={{ color: 'var(--color-text-light)' }}>Site</th>
                <th className="px-4 py-2.5 text-left font-medium" style={{ color: 'var(--color-text-light)' }}>Activity</th>
                <th className="px-4 py-2.5 text-center font-medium" style={{ color: 'var(--color-text-light)' }}>SIF</th>
                <th className="px-4 py-2.5 text-left font-medium" style={{ color: 'var(--color-text-light)' }}>Score</th>
                <th className="px-4 py-2.5 text-left font-medium" style={{ color: 'var(--color-text-light)' }}>Life-Saving Rule</th>
                <th className="px-4 py-2.5 text-left font-medium" style={{ color: 'var(--color-text-light)' }}>Barrier Failure</th>
                <th className="px-4 py-2.5 text-center font-medium" style={{ color: 'var(--color-text-light)' }}>Status</th>
                <th className="px-4 py-2.5 text-center font-medium" style={{ color: 'var(--color-text-light)' }}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b cursor-pointer hover:bg-gray-50 transition-colors"
                  style={{ borderColor: 'var(--color-border)' }}
                  onClick={() => setSelected(r)}
                >
                  <td className="px-4 py-2 font-medium" style={{ color: 'var(--color-text)' }}>{r.report_id}</td>
                  <td className="px-4 py-2 tabular-nums" style={{ color: 'var(--color-text-light)' }}>{r.report_date}</td>
                  <td className="px-4 py-2 truncate max-w-[120px]" style={{ color: 'var(--color-text-light)' }}>{r.site}</td>
                  <td className="px-4 py-2 truncate max-w-[130px]" style={{ color: 'var(--color-text-light)' }}>{r.activity}</td>
                  <td className="px-4 py-2 text-center"><SifBadge level={r.sif_level} /></td>
                  <td className="px-4 py-2 w-28"><ScoreBar score={r.priority_score} /></td>
                  <td className="px-4 py-2 truncate max-w-[120px]" style={{ color: 'var(--color-text-light)' }}>{r.life_saving_rule}</td>
                  <td className="px-4 py-2 truncate max-w-[150px]" style={{ color: 'var(--color-text-light)' }}>{r.barrier_failure}</td>
                  <td className="px-4 py-2 text-center"><StatusBadge status={r.review_status} /></td>
                  <td className="px-4 py-2 text-center">
                    <Eye size={14} className="inline" style={{ color: 'var(--color-primary)' }} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center" style={{ color: 'var(--color-text-light)' }}>
                    No reports match the current filters
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <ReportDetailModal
          report={selected}
          onClose={() => setSelected(null)}
          onStatusUpdate={handleStatusUpdate}
          onReviewSubmitted={handleReviewSubmitted}
          updating={updating}
        />
      )}
    </div>
  );
}

function FilterSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      <label className="text-[10px] font-medium uppercase tracking-wide block mb-1" style={{ color: 'var(--color-text-light)' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-[13px] border rounded outline-none focus:border-[var(--color-primary)] bg-white"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt === 'ALL' ? 'All' : opt}</option>
        ))}
      </select>
    </div>
  );
}

function ReportDetailModal({ report, onClose, onStatusUpdate, onReviewSubmitted, updating }: {
  report: Report;
  onClose: () => void;
  onStatusUpdate: (id: string, status: ReviewStatus) => void;
  onReviewSubmitted: (updated: Report) => void;
  updating: boolean;
}) {
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewName, setReviewName] = useState('');
  const [reviewComments, setReviewComments] = useState('');
  const [reviewLevel, setReviewLevel] = useState<SifLevel | ''>('');
  const [reviewAction, setReviewAction] = useState('');
  const [reviewError, setReviewError] = useState('');
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewSaved, setReviewSaved] = useState(false);

  const openReviewForm = () => {
    setReviewName(report.hse_reviewer_name || '');
    setReviewComments(report.hse_review_comments || '');
    setReviewLevel((report.hse_review_level as SifLevel) || '');
    setReviewAction(report.hse_confirmed_action || report.recommended_action);
    setReviewError('');
    setReviewSaved(false);
    setShowReviewForm(true);
  };

  const handleSubmitReview = async () => {
    if (!reviewName.trim()) {
      setReviewError('HSE officer name is required.');
      return;
    }
    setReviewError('');
    setReviewSaving(true);

    const updateData = {
      hse_reviewer_name: reviewName.trim(),
      hse_review_comments: reviewComments.trim() || null,
      hse_review_level: reviewLevel || null,
      hse_confirmed_action: reviewAction.trim() || null,
      hse_reviewed_at: new Date().toISOString(),
      review_status: 'Reviewed' as ReviewStatus,
      sif_level: (reviewLevel || report.sif_level) as SifLevel,
      recommended_action: reviewAction.trim() || report.recommended_action,
    };

    const { error } = await supabase
      .from('reports')
      .update(updateData)
      .eq('id', report.id);

    setReviewSaving(false);

    if (error) {
      setReviewError(`Failed to save review: ${error.message}`);
    } else {
      setReviewSaved(true);
      const updated: Report = {
        ...report,
        ...updateData,
      };
      onReviewSubmitted(updated);
      setTimeout(() => {
        setShowReviewForm(false);
        setReviewSaved(false);
      }, 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto" style={{ backgroundColor: 'rgba(0,0,0,0.4)' }} onClick={onClose}>
      <div
        className="card w-full max-w-3xl my-8 animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>{report.report_id}</h2>
              <SifBadge level={report.sif_level} />
              <StatusBadge status={report.review_status} />
            </div>
            <div className="text-[12px] mt-1" style={{ color: 'var(--color-text-light)' }}>
              {report.report_date} · {report.site} · {report.report_type}
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-gray-100">
            <X size={20} style={{ color: 'var(--color-text-light)' }} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[calc(100vh-200px)] overflow-y-auto">
          {/* Narrative */}
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-light)' }}>
              Raw Narrative
            </div>
            <div className="p-3 rounded text-[13px] leading-relaxed" style={{ backgroundColor: '#f8f9fb', color: 'var(--color-text)' }}>
              {report.raw_narrative}
            </div>
          </div>

          {/* Meta grid */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <DetailField label="IOGP Life-Saving Rule" value={report.life_saving_rule} />
            <DetailField label="Activity" value={report.activity} />
            <DetailField label="Hazard" value={report.hazard} />
            <DetailField label="Barrier" value={report.barrier} />
            <DetailField label="Barrier Failure" value={report.barrier_failure} />
            <DetailField label="Potential Consequence" value={report.potential_consequence} />
          </div>

          {/* Score */}
          <div className="flex items-center gap-4 p-3 rounded" style={{ backgroundColor: '#f8f9fb' }}>
            <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-light)' }}>
              SIF Priority Score
            </div>
            <div className="flex-1 max-w-xs">
              <ScoreBar score={report.priority_score} />
            </div>
            <div className="text-[11px]" style={{ color: 'var(--color-text-light)' }}>
              Prototype scoring — requires validation
            </div>
          </div>

          {/* Explanation */}
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-light)' }}>
              Why Was This Flagged?
            </div>
            <div className="text-[13px] leading-relaxed p-3 rounded border-l-2" style={{ borderColor: 'var(--color-primary)', backgroundColor: 'var(--color-info-bg)', color: 'var(--color-text)' }}>
              {report.explanation}
            </div>
          </div>

          {/* Evidence */}
          {report.evidence && report.evidence.length > 0 && (
            <div>
              <div className="text-[10px] font-medium uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-light)' }}>
                Extracted Evidence
              </div>
              <div className="flex flex-wrap gap-2">
                {report.evidence.map((ev, i) => (
                  <span key={i} className="px-2 py-0.5 rounded text-[11px] font-medium" style={{ backgroundColor: '#e8eef5', color: 'var(--color-info)' }}>
                    {ev}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recommended action */}
          <div>
            <div className="text-[10px] font-medium uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-light)' }}>
              Recommended HSE Action
            </div>
            <div className="text-[13px] leading-relaxed p-3 rounded border-l-2" style={{ borderColor: 'var(--color-medium)', backgroundColor: 'var(--color-medium-bg)', color: 'var(--color-text)' }}>
              {report.recommended_action}
            </div>
            <div className="text-[11px] mt-1.5" style={{ color: 'var(--color-text-light)' }}>
              AI-assisted recommendation — HSE validation required.
            </div>
          </div>

          {/* HSE Officer Review — existing review display */}
          {report.hse_reviewer_name && !showReviewForm && (
            <div
              className="p-4 rounded border-l-2"
              style={{ borderColor: 'var(--color-primary)', backgroundColor: '#f8f9fb' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded flex items-center justify-center"
                    style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                  >
                    <ClipboardCheck size={15} />
                  </div>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text)' }}>
                    HSE Officer Review
                  </span>
                </div>
                <button
                  onClick={openReviewForm}
                  className="text-[11px] font-medium px-2.5 py-1 rounded border hover:bg-white transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
                >
                  Update Review
                </button>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div className="flex items-center gap-2">
                  <User size={13} style={{ color: 'var(--color-text-light)' }} />
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-light)' }}>Reviewed By</div>
                    <div className="text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>{report.hse_reviewer_name}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-light)' }}>Reviewed At</div>
                  <div className="text-[13px]" style={{ color: 'var(--color-text)' }}>
                    {report.hse_reviewed_at ? new Date(report.hse_reviewed_at).toLocaleString() : '—'}
                  </div>
                </div>
                {report.hse_review_level && (
                  <div>
                    <div className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--color-text-light)' }}>Officer SIF Level Override</div>
                    <div className="text-[13px] font-medium" style={{ color: 'var(--color-text)' }}>{report.hse_review_level}</div>
                  </div>
                )}
              </div>
              {report.hse_confirmed_action && (
                <div className="mt-3">
                  <div className="text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-light)' }}>Confirmed Action</div>
                  <div className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text)' }}>{report.hse_confirmed_action}</div>
                </div>
              )}
              {report.hse_review_comments && (
                <div className="mt-3">
                  <div className="text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-light)' }}>Review Comments</div>
                  <div className="text-[13px] leading-relaxed" style={{ color: 'var(--color-text)' }}>{report.hse_review_comments}</div>
                </div>
              )}
            </div>
          )}

          {/* HSE Officer Review Form */}
          {showReviewForm && (
            <div
              className="p-4 rounded border-l-2"
              style={{ borderColor: 'var(--color-primary)', backgroundColor: '#f8f9fb' }}
            >
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'white' }}
                >
                  <ClipboardCheck size={18} />
                </div>
                <div>
                  <div className="text-[14px] font-semibold" style={{ color: 'var(--color-text)' }}>
                    HSE Officer Review
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--color-text-light)' }}>
                    {report.hse_reviewer_name ? 'Update existing review' : 'Add your review of this report'}
                  </div>
                </div>
              </div>

              {/* Reviewer name */}
              <div className="mb-4">
                <label className="text-[10px] font-medium uppercase tracking-wide block mb-1.5" style={{ color: 'var(--color-text-light)' }}>
                  Reviewing Officer Name <span style={{ color: 'var(--color-high)' }}>*</span>
                </label>
                <div className="relative">
                  <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-light)' }} />
                  <input
                    type="text"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder="Enter HSE officer name"
                    className="w-full pl-9 pr-3 py-2 text-[13px] border rounded outline-none focus:border-[var(--color-primary)] bg-white"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  />
                </div>
              </div>

              {/* SIF level override */}
              <div className="mb-4">
                <label className="text-[10px] font-medium uppercase tracking-wide block mb-1.5" style={{ color: 'var(--color-text-light)' }}>
                  Confirm or Override SIF Level
                </label>
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-[12px]" style={{ color: 'var(--color-text-light)' }}>
                    AI assessment:
                  </span>
                  <SifBadge level={report.sif_level} />
                  <span className="text-[12px] mx-1" style={{ color: 'var(--color-text-light)' }}>→</span>
                  <span className="text-[12px]" style={{ color: 'var(--color-text-light)' }}>
                    Officer's call:
                  </span>
                  <select
                    value={reviewLevel}
                    onChange={(e) => setReviewLevel(e.target.value as SifLevel | '')}
                    className="px-3 py-1.5 text-[12px] font-semibold border rounded outline-none focus:border-[var(--color-primary)] bg-white"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  >
                    <option value="">Agree with AI ({report.sif_level})</option>
                    <option value="HIGH">Override: HIGH</option>
                    <option value="MEDIUM">Override: MEDIUM</option>
                    <option value="LOW">Override: LOW</option>
                    <option value="NON-SIF">Override: NON-SIF</option>
                  </select>
                  {reviewLevel && (
                    <span className="text-[11px] px-2 py-0.5 rounded font-medium" style={{ backgroundColor: 'var(--color-medium-bg)', color: 'var(--color-medium)' }}>
                      Overridden to {reviewLevel}
                    </span>
                  )}
                </div>
              </div>

              {/* Confirmed action */}
              <div className="mb-4">
                <label className="text-[10px] font-medium uppercase tracking-wide block mb-1.5" style={{ color: 'var(--color-text-light)' }}>
                  Confirmed HSE Action
                </label>
                <textarea
                  value={reviewAction}
                  onChange={(e) => setReviewAction(e.target.value)}
                  rows={2}
                  className="w-full p-3 text-[13px] leading-relaxed border rounded outline-none focus:border-[var(--color-primary)] resize-y bg-white"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  placeholder="Review and edit the recommended action as needed..."
                />
                <div className="text-[11px] mt-1" style={{ color: 'var(--color-text-light)' }}>
                  Pre-filled from AI recommendation — edit if the officer's assessment differs.
                </div>
              </div>

              {/* Review comments */}
              <div className="mb-4">
                <label className="text-[10px] font-medium uppercase tracking-wide block mb-1.5" style={{ color: 'var(--color-text-light)' }}>
                  Review Comments
                </label>
                <textarea
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  rows={3}
                  className="w-full p-3 text-[13px] leading-relaxed border rounded outline-none focus:border-[var(--color-primary)] resize-y bg-white"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                  placeholder="Add any observations, disagreements, or additional context for this review..."
                />
              </div>

              {/* Validation error */}
              {reviewError && (
                <div className="mb-3 px-3 py-2 rounded text-[12px] flex items-center gap-2" style={{ backgroundColor: 'var(--color-high-bg)', color: 'var(--color-high)' }}>
                  <AlertTriangle size={14} />
                  {reviewError}
                </div>
              )}

              {/* Saved confirmation */}
              {reviewSaved && (
                <div className="mb-3 px-3 py-2 rounded text-[12px] flex items-center gap-2 animate-fade-in" style={{ backgroundColor: 'var(--color-low-bg)', color: 'var(--color-low)' }}>
                  <CheckCircle2 size={14} />
                  Review saved successfully.
                </div>
              )}

              {/* Buttons */}
              <div className="flex items-center gap-2">
                {!reviewSaved && (
                  <button
                    onClick={handleSubmitReview}
                    disabled={reviewSaving}
                    className="btn-primary px-4 py-2 rounded text-[13px] font-semibold flex items-center gap-2 disabled:opacity-60"
                  >
                    {reviewSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {reviewSaving ? 'Saving...' : 'Submit Review'}
                  </button>
                )}
                <button
                  onClick={() => setShowReviewForm(false)}
                  disabled={reviewSaving}
                  className="px-4 py-2 rounded text-[13px] font-medium border hover:bg-gray-50 transition-colors"
                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Add Review button (only if no review exists and form not shown) */}
          {!report.hse_reviewer_name && !showReviewForm && (
            <button
              onClick={openReviewForm}
              className="w-full py-2.5 rounded-lg border-2 border-dashed text-[13px] font-medium flex items-center justify-center gap-2 transition-colors hover:bg-white"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-primary)' }}
            >
              <ClipboardCheck size={16} />
              Add HSE Officer Review
            </button>
          )}
        </div>

        {/* Status update */}
        <div className="px-5 py-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <div className="text-[10px] font-medium uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-light)' }}>
            Update Review Status
          </div>
          <div className="flex gap-2 flex-wrap">
            {(['Pending', 'Reviewed', 'Escalated', 'Dismissed'] as ReviewStatus[]).map((status) => (
              <button
                key={status}
                disabled={updating || report.review_status === status}
                onClick={() => onStatusUpdate(report.id, status)}
                className="px-3 py-1.5 rounded text-[12px] font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  borderColor: report.review_status === status ? 'var(--color-primary)' : 'var(--color-border)',
                  backgroundColor: report.review_status === status ? 'var(--color-primary)' : 'white',
                  color: report.review_status === status ? 'white' : 'var(--color-text)',
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-wide mb-1" style={{ color: 'var(--color-text-light)' }}>
        {label}
      </div>
      <div className="text-[13px]" style={{ color: 'var(--color-text)' }}>{value}</div>
    </div>
  );
}
