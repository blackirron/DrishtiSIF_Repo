import type { AnalysisResult, SifLevel } from './types';

interface RuleSignal {
  rule: string;
  keywords: string[];
  hazard: string;
  barrier: string;
  activities: string[];
  consequence: string;
  baseScore: number;
}

const RULE_SIGNALS: RuleSignal[] = [
  {
    rule: 'Energy Isolation',
    keywords: [
      'isolat', 'lockout', 'lock out', 'loto', 'zero energy', 'zero-energy',
      'pressur', 'stored energy', 'flange', 'valve', 'pipeline', 'transfer line',
      'pump', 'compressor', 'depressur', 'vent', 'bleed', 'purge',
      'energy release', 'trapped pressure', 'blowdown', 'hydrogen sulfide',
    ],
    hazard: 'Stored / Pressurized Energy',
    barrier: 'Energy Isolation & Zero-Energy Verification',
    activities: ['Pipeline / Equipment Maintenance', 'Mechanical Maintenance', 'Process Operations'],
    consequence: 'Uncontrolled energy release → Serious Injury / Fatality potential',
    baseScore: 85,
  },
  {
    rule: 'Working at Height',
    keywords: [
      'height', 'guardrail', 'handrail', 'fall protection', 'harness', 'lanyard',
      'scaffold', 'platform', 'elevated', 'roof', 'tower', 'climbing',
      'ladder', 'edge', 'open hole', 'grating', 'fall arrest', 'anchor point',
      'working above', 'mezzanine',
    ],
    hazard: 'Fall from height',
    barrier: 'Fall Protection / Edge Protection',
    activities: ['Working at Height', 'Construction / Fabrication', 'Inspection'],
    consequence: 'Fall from elevation → Serious Injury / Fatality potential',
    baseScore: 82,
  },
  {
    rule: 'Hot Work',
    keywords: [
      'welding', 'weld', 'cutting', 'grinding', 'hot work', 'flame',
      'spark', 'flammm', 'flammable', 'hydrocarbon', 'vapour', 'vapor',
      'gas test', 'gas testing', 'atmospheric test', 'explosive atmosphere',
      'fire watch', 'permit to work', 'combustible', 'ignition',
    ],
    hazard: 'Flammable vapour / Fire',
    barrier: 'Gas Testing & Area Verification',
    activities: ['Hot Work', 'Maintenance', 'Fabrication'],
    consequence: 'Fire / Explosion → Serious Injury / Fatality potential',
    baseScore: 84,
  },
  {
    rule: 'Confined Space Entry',
    keywords: [
      'confined space', 'vessel', 'tank', 'manhole', 'entry permit',
      'atmospheric test', 'gas test', 'entering the vessel', 'purge',
      'ventilation', 'toxic atmosphere', 'oxygen deficient', 'oxygen depletion',
      'rescue plan', 'attendant', 'hole watch',
    ],
    hazard: 'Atmospheric / Physical hazard in confined space',
    barrier: 'Atmospheric Testing & Entry Permit',
    activities: ['Confined Space Entry', 'Vessel / Tank Maintenance', 'Inspection'],
    consequence: 'Asphyxiation / Toxic exposure → Serious Injury / Fatality potential',
    baseScore: 86,
  },
  {
    rule: 'Lifting Operations',
    keywords: [
      'lift', 'crane', 'hoist', 'rigging', 'sling', 'load', 'overhead',
      'suspended load', 'lifting gear', 'tag line', 'bank person', 'rigger',
      'crane operator', 'load chart', 'exclusion zone', 'dropped object',
      'winch', 'derrick',
    ],
    hazard: 'Dropped / Swinging load',
    barrier: 'Lifting Plan & Exclusion Zone',
    activities: ['Lifting Operations', 'Construction', 'Maintenance'],
    consequence: 'Dropped load / Crushing → Serious Injury / Fatality potential',
    baseScore: 78,
  },
  {
    rule: 'Line of Fire',
    keywords: [
      'line of fire', 'pinch point', 'caught between', 'struck by',
      'moving equipment', 'vehicle', 'truck', 'forklift', 'backing',
      'reversing', 'hit by', 'run over', 'moving part', 'rotating',
      'swinging', 'crushing', 'caught in',
    ],
    hazard: 'Struck-by / Caught-between',
    barrier: 'Exclusion Zone / Position of Safety',
    activities: ['Material Handling', 'Vehicle Operations', 'Maintenance'],
    consequence: 'Struck-by / Crushing → Serious Injury / Fatality potential',
    baseScore: 75,
  },
];

const BARRIER_FAILURE_INDICATORS = [
  { pattern: /did not verify|not verified|no verification|without verifying|failure to verify/i, failure: 'Zero-energy verification not completed' },
  { pattern: /no gas test|gas testing.*not|gas test.*not done|not tested|testing was not performed|atmospheric testing was not/i, failure: 'Gas testing / atmospheric verification not completed' },
  { pattern: /no fall protection|fall protection.*not|harness.*not|no harness|without.*harness|no.*lanyard|missing guardrail|guardrail.*missing|no guardrail/i, failure: 'Fall protection barrier missing or not used' },
  { pattern: /no permit|permit.*not|without.*permit|no entry permit/i, failure: 'Permit / authorization not obtained' },
  { pattern: /no isolation|not isolated|isolation.*not|without isolat|not locked out|no lockout/i, failure: 'Energy isolation not performed or verified' },
  { pattern: /no exclusion zone|exclusion zone.*not|exclusion.*missing/i, failure: 'Exclusion zone not established' },
  { pattern: /not completed|not performed|not done|not carried out|not conducted/i, failure: 'Required safety procedure not completed' },
];

const BARRIER_SUCCESS_INDICATORS = [
  /isolated and locked out/i,
  /confirmed zero energy/i,
  /verified.*zero/i,
  /tested.*zero/i,
  /confirmed.*no (pressure|energy)/i,
  /gas test.*passed|gas testing.*completed|atmospheric test.*completed/i,
  /harness.*worn|harness.*used|fall protection.*in place|guardrail.*in place/i,
  /permit.*obtained|permit.*in place|authorized.*before/i,
  /exclusion zone.*established|exclusion zone.*in place/i,
];

const LOW_RISK_INDICATORS = [
  'loose papers', 'housekeeping', 'paper', 'litter', 'debris',
  'spill', 'minor', 'tripping hazard', 'cable', 'cord',
  ' signage', 'label', 'tag', 'illumination', 'lighting',
  'walkway', 'minor slip', 'minor trip',
];

function detectBarrierFailure(text: string, rule: string): string {
  for (const indicator of BARRIER_FAILURE_INDICATORS) {
    if (indicator.pattern.test(text)) {
      return indicator.failure;
    }
  }
  const lower = text.toLowerCase();
  if (lower.includes('not') || lower.includes('missing') || lower.includes('without') || lower.includes('absent') || lower.includes('failed')) {
    return `${rule} barrier compromised`;
  }
  return 'None identified';
}

function detectBarrierSuccess(text: string, hasBarrierFailure: boolean): boolean {
  if (hasBarrierFailure) return false;
  return BARRIER_SUCCESS_INDICATORS.some((p) => p.test(text));
}

function extractActivity(text: string, signal: RuleSignal | null): string {
  if (signal) {
    const lower = text.toLowerCase();
    for (const activity of signal.activities) {
      const activityLower = activity.toLowerCase();
      if (lower.includes(activityLower.split(' ')[0])) {
        return activity;
      }
    }
    return signal.activities[0];
  }
  const lower = text.toLowerCase();
  if (lower.includes('maintenan') || lower.includes('repair') || lower.includes('servic')) return 'General Maintenance';
  if (lower.includes('inspect') || lower.includes('audit') || lower.includes('survey')) return 'Inspection';
  if (lower.includes('operat') || lower.includes('production')) return 'Process Operations';
  if (lower.includes('transport') || lower.includes('driving') || lower.includes('vehicle')) return 'Transport / Driving';
  if (lower.includes('construction') || lower.includes('building')) return 'Construction';
  return 'General Operations';
}

function extractEvidence(text: string, signal: RuleSignal | null): string[] {
  const evidence: string[] = [];
  if (signal) {
    for (const kw of signal.keywords) {
      if (text.toLowerCase().includes(kw.toLowerCase())) {
        const cleanKw = kw.replace(/[.*+?^${}()|[\]\\]/g, '');
        if (!evidence.includes(cleanKw)) {
          evidence.push(cleanKw);
        }
      }
    }
  }
  const genericKeywords = ['maintenance', 'pressure', 'isolation', 'height', 'welding', 'gas test', 'confined space', 'lifting', 'crane', 'permit', 'harness', 'guardrail'];
  for (const kw of genericKeywords) {
    if (text.toLowerCase().includes(kw) && !evidence.includes(kw)) {
      evidence.push(kw);
    }
  }
  return evidence.slice(0, 10);
}

function generateExplanation(
  text: string,
  signal: RuleSignal | null,
  barrierFailure: string,
  isLowRisk: boolean,
  barrierSuccess: boolean,
): string {
  if (isLowRisk) {
    return 'The report describes a minor housekeeping or general condition issue with no significant SIF potential. No Life-Saving Rule exposure was identified.';
  }
  if (!signal) {
    return 'Insufficient safety signals were detected in the report to confidently classify SIF potential. Manual triage by an HSE professional is recommended.';
  }
  const lower = text.toLowerCase();
  const parts: string[] = [];
  parts.push(`The report describes exposure to ${signal.hazard.toLowerCase()} during ${signal.activities[0].toLowerCase()}.`);

  if (barrierSuccess) {
    parts.push(`The safety barrier (${signal.barrier}) appears to have been successfully applied, which prevented escalation.`);
  } else if (barrierFailure !== 'None identified') {
    parts.push(`The analysis indicates that ${barrierFailure.toLowerCase()}, which removed a critical safety barrier.`);
  } else {
    parts.push(`The report references activities associated with ${signal.rule} risk.`);
  }

  if (lower.includes('nobody was injured') || lower.includes('no injuries') || lower.includes('no one was hurt') || lower.includes('no casualty')) {
    parts.push('While no injury occurred in this instance, the potential for serious harm was present — the absence of an outcome does not negate the SIF precursor.');
  }

  parts.push(`This maps to the IOGP Life-Saving Rule: ${signal.rule}.`);

  return parts.join(' ');
}

function generateRecommendedAction(signal: RuleSignal | null, barrierFailure: string, barrierSuccess: boolean): string {
  if (!signal) {
    return 'Conduct manual HSE triage to assess the report and determine appropriate follow-up actions.';
  }
  if (barrierSuccess) {
    return `Document as a positive safety observation. Reinforce the successful application of ${signal.barrier} during ${signal.activities[0].toLowerCase()}.`;
  }
  const actions: Record<string, string> = {
    'Energy Isolation': 'Verify isolation and zero-energy state before continuing maintenance. Conduct toolbox talk on energy isolation verification.',
    'Working at Height': 'Suspend work at height until fall protection is verified and in place. Inspect all guardrails and anchor points before resuming.',
    'Hot Work': 'Stop all hot work until gas testing is completed and the area is verified safe. Reinforce hot work permit requirements.',
    'Confined Space Entry': 'Suspend confined space entry until atmospheric testing is completed and a valid entry permit is in place. Review confined space entry procedures.',
    'Lifting Operations': 'Suspend lifting operations until a valid lift plan and exclusion zone are established. Verify rigging equipment and load charts.',
    'Line of Fire': 'Reinforce exclusion zone requirements and positioning of personnel. Review line-of-fire awareness during toolbox talk.',
  };
  return actions[signal.rule] || `Review ${signal.rule} procedures and verify barrier integrity before resuming work.`;
}

function isLowRiskReport(text: string): boolean {
  const lower = text.toLowerCase();
  const lowHits = LOW_RISK_INDICATORS.filter((kw) => lower.includes(kw)).length;
  const sifHits = RULE_SIGNALS.reduce((count, sig) => {
    return count + sig.keywords.filter((kw) => lower.includes(kw.toLowerCase())).length;
  }, 0);
  return lowHits >= 1 && sifHits === 0;
}

export function analyzeReport(text: string): AnalysisResult {
  const trimmed = text.trim();

  if (trimmed.length < 15) {
    return {
      sifLevel: 'NON-SIF',
      priorityScore: 0,
      lifeSavingRule: 'None',
      activity: 'Not identified',
      hazard: 'Not identified',
      barrier: 'Not identified',
      barrierFailure: 'None identified',
      potentialConsequence: 'Insufficient narrative to assess',
      explanation: 'The submitted text is too short to analyze. Please provide a more detailed safety report.',
      evidence: [],
      recommendedAction: 'Request a more detailed report from the submitter before proceeding with analysis.',
      insufficientSignal: true,
    };
  }

  const lower = trimmed.toLowerCase();

  // Check for low risk first
  if (isLowRiskReport(trimmed)) {
    return {
      sifLevel: 'LOW',
      priorityScore: 12,
      lifeSavingRule: 'None',
      activity: extractActivity(trimmed, null),
      hazard: 'Minor / housekeeping issue',
      barrier: 'Not applicable',
      barrierFailure: 'None identified',
      potentialConsequence: 'No significant SIF consequence identified',
      explanation: generateExplanation(trimmed, null, 'None identified', true, false),
      evidence: extractEvidence(trimmed, null),
      recommendedAction: 'Address the housekeeping issue and document as a general observation. No SIF follow-up required.',
      insufficientSignal: false,
    };
  }

  // Match against rule signals
  let bestSignal: RuleSignal | null = null;
  let bestScore = 0;
  let secondBest: RuleSignal | null = null;
  let secondScore = 0;

  for (const signal of RULE_SIGNALS) {
    let hits = 0;
    for (const kw of signal.keywords) {
      if (lower.includes(kw.toLowerCase())) {
        hits++;
      }
    }
    if (hits > bestScore) {
      secondBest = bestSignal;
      secondScore = bestScore;
      bestSignal = signal;
      bestScore = hits;
    } else if (hits > secondScore) {
      secondBest = signal;
      secondScore = hits;
    }
  }

  if (!bestSignal || bestScore === 0) {
    return {
      sifLevel: 'LOW',
      priorityScore: 20,
      lifeSavingRule: 'None',
      activity: extractActivity(trimmed, null),
      hazard: 'Not identified',
      barrier: 'Not identified',
      barrierFailure: 'None identified',
      potentialConsequence: 'Insufficient signal to determine potential consequence',
      explanation: generateExplanation(trimmed, null, 'None identified', false, false),
      evidence: extractEvidence(trimmed, null),
      recommendedAction: 'Conduct manual HSE triage to assess the report and determine appropriate follow-up actions.',
      insufficientSignal: true,
    };
  }

  // Score calculation
  const barrierFailure = detectBarrierFailure(trimmed, bestSignal.rule);
  const hasBarrierFailure = barrierFailure !== 'None identified';

  // Check if barrier was successfully applied (only if no failure detected)
  const barrierSuccess = detectBarrierSuccess(trimmed, hasBarrierFailure);

  let score = bestSignal.baseScore;

  // Keyword density bonus
  if (bestScore >= 3) score += 8;
  if (bestScore >= 5) score += 5;

  // Barrier failure is the critical SIF amplifier
  if (hasBarrierFailure) {
    score += 12;
  }

  // Successful barrier is the critical SIF reducer
  if (barrierSuccess) {
    score -= 55;
  }

  // Secondary rule match adds some weight
  if (secondBest && secondScore >= 2) {
    score += 5;
  }

  // "Nobody was injured" does NOT reduce score — it's a precursor regardless
  // But explicitly stated successful incidents with no barrier failure can be slightly lower
  if (lower.includes('nobody was injured') && !hasBarrierFailure && !barrierSuccess) {
    // No reduction — it's still a precursor
  }

  // Clamp
  score = Math.max(5, Math.min(100, score));

  let sifLevel: SifLevel;
  if (barrierSuccess && score < 40) {
    sifLevel = 'NON-SIF';
  } else if (score >= 70) {
    sifLevel = 'HIGH';
  } else if (score >= 40) {
    sifLevel = 'MEDIUM';
  } else {
    sifLevel = 'LOW';
  }

  const activity = extractActivity(trimmed, bestSignal);
  const evidence = extractEvidence(trimmed, bestSignal);

  let explanation = generateExplanation(trimmed, bestSignal, barrierFailure, false, barrierSuccess);

  // Add secondary rule mention in explanation
  if (secondBest && secondScore >= 2) {
    explanation += ` A secondary exposure to ${secondBest.rule} was also detected in the narrative.`;
  }

  const recommendedAction = generateRecommendedAction(bestSignal, barrierFailure, barrierSuccess);

  let potentialConsequence = bestSignal.consequence;
  if (barrierSuccess) {
    potentialConsequence = 'Barrier successfully applied — consequence prevented';
  }

  return {
    sifLevel,
    priorityScore: score,
    lifeSavingRule: bestSignal.rule,
    activity,
    hazard: bestSignal.hazard,
    barrier: bestSignal.barrier,
    barrierFailure: barrierSuccess ? 'None identified — barrier successfully applied' : barrierFailure,
    potentialConsequence,
    explanation,
    evidence,
    recommendedAction,
    insufficientSignal: false,
  };
}
