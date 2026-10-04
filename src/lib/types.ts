export type SifLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'NON-SIF';

export type ReviewStatus = 'Pending' | 'Reviewed' | 'Escalated' | 'Dismissed';

export interface AnalysisResult {
  sifLevel: SifLevel;
  priorityScore: number;
  lifeSavingRule: string;
  activity: string;
  hazard: string;
  barrier: string;
  barrierFailure: string;
  potentialConsequence: string;
  explanation: string;
  evidence: string[];
  recommendedAction: string;
  insufficientSignal: boolean;
}

export interface Report {
  id: string;
  report_id: string;
  report_date: string;
  site: string;
  report_type: string;
  raw_narrative: string;
  activity: string;
  sif_level: SifLevel;
  priority_score: number;
  life_saving_rule: string;
  hazard: string;
  barrier: string;
  barrier_failure: string;
  potential_consequence: string;
  explanation: string;
  evidence: string[];
  recommended_action: string;
  review_status: ReviewStatus;
  is_seed: boolean;
  created_at: string;
  hse_reviewer_name: string | null;
  hse_review_comments: string | null;
  hse_review_level: string | null;
  hse_confirmed_action: string | null;
  hse_reviewed_at: string | null;
}

export interface ReportInsert {
  report_id: string;
  report_date: string;
  site: string;
  report_type: string;
  raw_narrative: string;
  activity: string;
  sif_level: SifLevel;
  priority_score: number;
  life_saving_rule: string;
  hazard: string;
  barrier: string;
  barrier_failure: string;
  potential_consequence: string;
  explanation: string;
  evidence: string[];
  recommended_action: string;
  review_status: ReviewStatus;
  is_seed: boolean;
  hse_reviewer_name?: string | null;
  hse_review_comments?: string | null;
  hse_review_level?: string | null;
  hse_confirmed_action?: string | null;
  hse_reviewed_at?: string | null;
}
