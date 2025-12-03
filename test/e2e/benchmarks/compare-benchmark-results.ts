import { promises as fs } from 'fs';
import * as path from 'path';
import { hideBin } from 'yargs/helpers';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const yargs = require('yargs/yargs');
import { exitWithError } from '../../../development/lib/exit-with-error';
import { BenchmarkResults } from './types-generated';

/**
 * Flow report from the benchmark run
 */
type FlowReport = {
  flowName: string;
  status: 'success' | 'failure' | 'skipped';
  retriesUsed: number;
  totalRetries: number;
  errors: string[];
  warnings: string[];
  iterationsCompleted: number;
  iterationsRequested: number;
  browserLoadsCompleted: number;
  browserLoadsRequested: number;
};

/**
 * Report metadata from benchmark run
 */
type BenchmarkReport = {
  startTime: string;
  endTime: string;
  durationMs: number;
  flowReports: FlowReport[];
  summary: {
    totalFlows: number;
    successfulFlows: number;
    failedFlows: number;
    skippedFlows: number;
  };
};

/**
 * Full benchmark file structure (new schema)
 */
type BenchmarkFile = {
  report?: BenchmarkReport;
  results: Record<string, BenchmarkResults>;
};

/**
 * Data quality assessment for a metric
 */
type MetricDataQuality = {
  coefficientOfVariation: number; // CV% - stdDev/mean * 100
  isReliable: boolean; // CV < threshold
  hasOutliers: boolean; // Based on IQR method
  sampleSize: number;
  qualityLevel: 'good' | 'acceptable' | 'poor' | 'unreliable';
  warnings: string[];
};

/**
 * Data quality assessment for a flow
 */
type FlowDataQuality = {
  beforeQuality: Record<string, MetricDataQuality>;
  afterQuality: Record<string, MetricDataQuality>;
  isComparable: boolean;
  overallReliability: 'reliable' | 'partial' | 'unreliable';
  warnings: string[];
};

/**
 * Comparison result for a single metric
 */
type MetricComparison = {
  metric: string;
  before: number;
  after: number;
  change: number;
  changePercent: number;
  improvement: 'better' | 'worse' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  explanation: string;
  // Extended data for rich reporting
  beforeAssessment?: ValueAssessment;
  afterAssessment?: ValueAssessment;
  beforeCommentary?: string;
  afterCommentary?: string;
  metricDescription?: string;
  reactCompilerRelevance?: string;
  whatToLookFor?: string;
  dataQuality?: {
    beforeCV: number;
    afterCV: number;
    isStatisticallySignificant: boolean;
    reliability: 'reliable' | 'partial' | 'unreliable';
  };
};

/**
 * Flow comparison result
 */
type FlowComparison = {
  flowName: string;
  metrics: MetricComparison[];
  overallImpact: 'high' | 'medium' | 'low';
  summary: string;
  recommendations: string[];
  dataQuality?: FlowDataQuality;
};

/**
 * Overall comparison result
 */
type ComparisonReport = {
  beforeFile: string;
  afterFile: string;
  timestamp: number;
  beforeReport?: BenchmarkReport;
  afterReport?: BenchmarkReport;
  flows: FlowComparison[];
  overallSummary: string;
  keyFindings: string[];
  dataQualityWarnings: string[];
};

// ============================================================================
// DATA QUALITY & STATISTICAL FUNCTIONS
// ============================================================================

/**
 * CV thresholds for data quality assessment
 */
const CV_THRESHOLDS = {
  good: 15, // CV < 15% is good
  acceptable: 30, // CV < 30% is acceptable
  poor: 50, // CV < 50% is poor but usable
  // CV >= 50% is unreliable
};

/**
 * Minimum iterations required for reliable comparison
 */
const MIN_ITERATIONS_REQUIRED = 4;

/**
 * Timeout threshold - values above this are likely errors
 */
const TIMEOUT_THRESHOLD_MS = 10000;

/**
 * Calculate coefficient of variation (CV%)
 */
function calculateCV(mean: number, stdDev: number): number {
  if (mean === 0) return 0;
  return (stdDev / Math.abs(mean)) * 100;
}

/**
 * Assess quality level based on CV
 */
function assessQualityLevel(
  cv: number,
): 'good' | 'acceptable' | 'poor' | 'unreliable' {
  if (cv < CV_THRESHOLDS.good) return 'good';
  if (cv < CV_THRESHOLDS.acceptable) return 'acceptable';
  if (cv < CV_THRESHOLDS.poor) return 'poor';
  return 'unreliable';
}

/**
 * Detect outliers using IQR method
 * Returns true if max or min values appear to be outliers
 */
function hasOutliers(
  mean: number,
  min: number,
  max: number,
  stdDev: number,
): boolean {
  if (stdDev === 0) return false;

  // Using modified Z-score approach (approximation from summary stats)
  const zMin = Math.abs((min - mean) / stdDev);
  const zMax = Math.abs((max - mean) / stdDev);

  // Z-score > 2.5 suggests outlier
  return zMin > 2.5 || zMax > 2.5;
}

/**
 * Perform Welch's t-test for statistical significance
 * Returns true if the difference is statistically significant at alpha = 0.05
 */
function isStatisticallySignificant(
  mean1: number,
  stdDev1: number,
  n1: number,
  mean2: number,
  stdDev2: number,
  n2: number,
): boolean {
  // Need sufficient samples
  if (n1 < 2 || n2 < 2) return false;

  // Calculate pooled standard error
  const se1 = (stdDev1 * stdDev1) / n1;
  const se2 = (stdDev2 * stdDev2) / n2;
  const se = Math.sqrt(se1 + se2);

  if (se === 0) return mean1 !== mean2;

  // Calculate t-statistic
  const t = Math.abs(mean1 - mean2) / se;

  // Welch-Satterthwaite degrees of freedom (approximation)
  const df =
    Math.pow(se1 + se2, 2) /
    (Math.pow(se1, 2) / (n1 - 1) + Math.pow(se2, 2) / (n2 - 1));

  // Critical t-value for two-tailed test at alpha = 0.05
  // Using approximation for df > 30: ~2.0, for smaller df: ~2.1-2.5
  const criticalT = df > 30 ? 2.0 : df > 10 ? 2.2 : 2.5;

  return t > criticalT;
}

/**
 * Assess data quality for a single metric
 */
function assessMetricQuality(
  mean: number,
  min: number,
  max: number,
  stdDev: number,
  iterationsCompleted: number,
  metricName: string,
): MetricDataQuality {
  const cv = calculateCV(mean, stdDev);
  const qualityLevel = assessQualityLevel(cv);
  const outliers = hasOutliers(mean, min, max, stdDev);
  const warnings: string[] = [];

  // Check for timeout values
  if (
    ['inp', 'fcp', 'lcp', 'interactionLatency'].includes(metricName) &&
    max > TIMEOUT_THRESHOLD_MS
  ) {
    warnings.push(
      `Max value (${max.toFixed(0)}ms) exceeds timeout threshold - likely includes error iterations`,
    );
  }

  // Check for zero minimum on metrics that shouldn't be zero
  if (['inp', 'inpCount'].includes(metricName) && min === 0 && mean > 0) {
    warnings.push(
      `Min value is 0, suggesting some iterations failed to capture ${metricName}`,
    );
  }

  // Sample size warning
  if (iterationsCompleted < MIN_ITERATIONS_REQUIRED) {
    warnings.push(
      `Only ${iterationsCompleted} iterations completed (minimum ${MIN_ITERATIONS_REQUIRED} recommended)`,
    );
  }

  // High variance warning
  if (qualityLevel === 'poor') {
    warnings.push(`High variance detected (CV: ${cv.toFixed(1)}%)`);
  } else if (qualityLevel === 'unreliable') {
    warnings.push(
      `Unreliable data - extremely high variance (CV: ${cv.toFixed(1)}%)`,
    );
  }

  // Outlier warning
  if (outliers) {
    warnings.push(
      `Potential outliers detected (range: ${min.toFixed(2)} - ${max.toFixed(2)})`,
    );
  }

  return {
    coefficientOfVariation: cv,
    isReliable: qualityLevel === 'good' || qualityLevel === 'acceptable',
    hasOutliers: outliers,
    sampleSize: iterationsCompleted,
    qualityLevel,
    warnings,
  };
}

/**
 * Determine overall metric reliability from before and after quality
 */
function determineMetricReliability(
  beforeQuality: MetricDataQuality | undefined,
  afterQuality: MetricDataQuality | undefined,
): 'reliable' | 'partial' | 'unreliable' {
  if (!beforeQuality || !afterQuality) return 'unreliable';

  const beforeOk =
    beforeQuality.qualityLevel === 'good' ||
    beforeQuality.qualityLevel === 'acceptable';
  const afterOk =
    afterQuality.qualityLevel === 'good' ||
    afterQuality.qualityLevel === 'acceptable';

  if (beforeOk && afterOk) return 'reliable';
  if (beforeOk || afterOk) return 'partial';
  return 'unreliable';
}

/**
 * Type guard to check if data is new schema (BenchmarkFile)
 * New schema has a 'report' key with metadata and 'results' key with flow data
 */
function isBenchmarkFile(data: Record<string, unknown>): data is BenchmarkFile {
  // New schema uniquely has 'report' key with metadata
  if (!('report' in data) || typeof data.report !== 'object') {
    return false;
  }
  // Verify it has results key
  if (!('results' in data) || typeof data.results !== 'object') {
    return false;
  }
  return true;
}

/**
 * Extracts benchmark results from file data, handling both old and new schema formats
 */
function extractResults(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
): Record<string, BenchmarkResults> {
  // New schema: results are nested under 'results' key
  if (isBenchmarkFile(data)) {
    return data.results;
  }
  // Old schema: results are at the top level
  return data as Record<string, BenchmarkResults>;
}

/**
 * Extracts report metadata from file data if available
 */
function extractReport(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
): BenchmarkReport | undefined {
  if (isBenchmarkFile(data) && data.report) {
    return data.report;
  }
  return undefined;
}

/**
 * Thresholds for determining impact levels
 */
const IMPACT_THRESHOLDS = {
  renderCount: { high: 0.2, medium: 0.1 }, // 20%+ = high, 10%+ = medium
  renderTime: { high: 0.2, medium: 0.1 },
  averageRenderTime: { high: 0.15, medium: 0.08 },
  inp: { high: 50, medium: 25 }, // milliseconds
  fcp: { high: 200, medium: 100 }, // milliseconds
  lcp: { high: 500, medium: 250 }, // milliseconds
  tbt: { high: 200, medium: 100 }, // milliseconds
  cls: { high: 0.1, medium: 0.05 },
  interactionLatency: { high: 0.2, medium: 0.1 },
};

/**
 * Metrics where lower values indicate better performance
 */
const LOWER_IS_BETTER_METRICS = [
  'numNetworkReqs', // Fewer network requests = more efficient
  'renderCount', // Fewer re-renders = better memoization
  'renderTime', // Less time rendering = faster
  'averageRenderTime', // Less time per render = faster
  'inp', // Interaction to Next Paint - lower = more responsive
  'fcp', // First Contentful Paint - lower = faster initial render
  'lcp', // Largest Contentful Paint - lower = faster main content
  'tbt', // Total Blocking Time - lower = less blocking
  'cls', // Cumulative Layout Shift - lower = more stable
  'interactionLatency', // Lower = more responsive interactions
  'load', // Page load time - lower = faster
  'domContentLoaded', // DOM ready time - lower = faster
  'firstPaint', // First paint - lower = faster
  'scrollToLoadLatency', // Scroll to load - lower = faster lazy loading
  'cumulativeLoadTime', // Total load time - lower = faster
];

/**
 * Metrics that are informational/neutral (neither better nor worse)
 */
const NEUTRAL_METRICS = [
  'inpCount', // Count of INP interactions measured - informational
  'scrollEventCount', // Number of scroll events - informational
  'totalScrollDistance', // Total pixels scrolled - informational
  'assetsLoadedPerScroll', // Assets loaded - depends on context
];

// ============================================================================
// EXPECTED VALUE RANGES & METRIC METADATA
// ============================================================================

/**
 * Expected value ranges for metrics based on Google Core Web Vitals and
 * internal benchmarks. These help contextualize whether a value is
 * good, acceptable, or needs improvement.
 */
type MetricExpectation = {
  excellent: number; // Top-tier performance
  good: number; // Acceptable for production
  needsWork: number; // Should be improved
  unit: string; // Display unit
  description: string; // What this metric measures
  reactCompilerRelevance: string; // How React Compiler affects this metric
  whatToLookFor: string; // What improvement indicates
};

const METRIC_EXPECTATIONS: Record<string, MetricExpectation> = {
  // Web Vitals (per-interaction, but 75th percentile across flow)
  inp: {
    excellent: 200,
    good: 500,
    needsWork: 1000,
    unit: 'ms',
    description:
      '75th percentile interaction-to-paint time across all user interactions',
    reactCompilerRelevance:
      'React Compiler reduces INP by memoizing components, preventing re-renders that block the main thread.',
    whatToLookFor:
      'Lower INP = snappier interactions. Key benefit of memoization.',
  },
  fcp: {
    excellent: 300,
    good: 500,
    needsWork: 1000,
    unit: 'ms',
    description: 'First Contentful Paint at flow start',
    reactCompilerRelevance:
      'FCP is less affected by React Compiler - it measures initial paint before React hydration.',
    whatToLookFor:
      'FCP changes are usually bundle size or SSR related, not memoization.',
  },
  tbt: {
    excellent: 500,
    good: 2000,
    needsWork: 5000,
    unit: 'ms',
    description: 'Cumulative main thread blocking time across entire flow',
    reactCompilerRelevance:
      'React Compiler reduces TBT by eliminating unnecessary render work that blocks the main thread.',
    whatToLookFor:
      'Significant TBT reduction indicates compiler is preventing expensive re-renders.',
  },

  // React-specific metrics (PRIMARY indicators)
  renderCount: {
    excellent: 200,
    good: 500,
    needsWork: 1000,
    unit: 'renders',
    description:
      'Total React component renders across all interactions in the flow',
    reactCompilerRelevance:
      '⭐ PRIMARY METRIC - React Compiler auto-memoizes to skip unnecessary renders.',
    whatToLookFor:
      '20-60% reduction typical. This is THE metric to watch for compiler effectiveness.',
  },
  renderTime: {
    excellent: 500,
    good: 1500,
    needsWork: 3000,
    unit: 'ms',
    description:
      'Cumulative time spent in React render phase across entire flow',
    reactCompilerRelevance:
      '⭐ PRIMARY METRIC - Directly measures time saved by skipping renders.',
    whatToLookFor:
      'Lower renderTime + lower renderCount = compiler working effectively.',
  },
  averageRenderTime: {
    excellent: 2,
    good: 5,
    needsWork: 10,
    unit: 'ms/render',
    description: 'Average time per render (renderTime / renderCount)',
    reactCompilerRelevance:
      'May increase slightly if cheap renders are eliminated, leaving only necessary ones.',
    whatToLookFor:
      'Slight increase is OK if total renderTime decreases. Measures render efficiency.',
  },

  // Network metrics
  numNetworkReqs: {
    excellent: 30,
    good: 80,
    needsWork: 150,
    unit: 'requests',
    description: 'Total network requests made during the flow',
    reactCompilerRelevance:
      'Not directly affected. Changes may indicate useEffect optimization or side effect deduplication.',
    whatToLookFor:
      'Should stay roughly constant. Reduction may indicate useEffect fixes.',
  },

  // Flow timing metrics (cumulative over all actions)
  interactionLatency: {
    excellent: 10000,
    good: 30000,
    needsWork: 60000,
    unit: 'ms',
    description: 'Total end-to-end time for entire user flow',
    reactCompilerRelevance:
      'Benefits from reduced render time. Faster renders = faster flow completion.',
    whatToLookFor:
      'Overall UX improvement metric. Reduction = tangible user benefit.',
  },
  scrollToLoadLatency: {
    excellent: 2000,
    good: 5000,
    needsWork: 10000,
    unit: 'ms',
    description: 'Cumulative scroll-to-content-appear time during scroll flows',
    reactCompilerRelevance:
      'Benefits from memoized list items that render faster during virtualized scrolling.',
    whatToLookFor: 'Smoother scrolling with less jank.',
  },
  cumulativeLoadTime: {
    excellent: 5000,
    good: 12000,
    needsWork: 20000,
    unit: 'ms',
    description: 'Total asset loading time across entire flow',
    reactCompilerRelevance:
      'Network-bound metric, not directly affected by React Compiler.',
    whatToLookFor:
      'Should stay constant. Changes indicate test variance, not compiler effect.',
  },
};

/**
 * Flow-specific expected values - adjusted for flow complexity
 */
const FLOW_SPECIFIC_EXPECTATIONS: Record<
  string,
  Partial<Record<string, Partial<MetricExpectation>>>
> = {
  'Power User: Tab Switching': {
    interactionLatency: { excellent: 2000, good: 5000, needsWork: 10000 },
    renderCount: { excellent: 400, good: 700, needsWork: 1200 },
  },
  'Power User: Network Switching': {
    interactionLatency: { excellent: 30000, good: 80000, needsWork: 150000 },
    numNetworkReqs: { excellent: 30, good: 70, needsWork: 120 },
  },
  'Power User: Network Adding': {
    interactionLatency: { excellent: 20000, good: 50000, needsWork: 100000 },
  },
  'Power User: Tokens List Scrolling': {
    renderCount: { excellent: 350, good: 550, needsWork: 900 },
    tbt: { excellent: 1500, good: 3500, needsWork: 6000 },
  },
  'Power User: Nft List Scrolling': {
    renderCount: { excellent: 450, good: 700, needsWork: 1100 },
    tbt: { excellent: 1500, good: 3500, needsWork: 6000 },
    numNetworkReqs: { excellent: 90, good: 150, needsWork: 250 },
  },
};

/**
 * Get expected values for a metric, with flow-specific overrides
 */
function getMetricExpectation(
  metric: string,
  flowName?: string,
): MetricExpectation | undefined {
  const base = METRIC_EXPECTATIONS[metric];
  if (!base) return undefined;

  // Check for flow-specific overrides
  if (flowName && FLOW_SPECIFIC_EXPECTATIONS[flowName]?.[metric]) {
    return { ...base, ...FLOW_SPECIFIC_EXPECTATIONS[flowName][metric] };
  }

  return base;
}

/**
 * Assess a value against expectations
 */
type ValueAssessment = {
  rating: 'excellent' | 'good' | 'needsWork' | 'poor';
  emoji: string;
  label: string;
  percentOfGood: number; // How far from "good" threshold
};

function assessValue(
  value: number,
  expectation: MetricExpectation,
): ValueAssessment {
  if (value <= expectation.excellent) {
    return {
      rating: 'excellent',
      emoji: '🟢',
      label: 'Excellent',
      percentOfGood: (value / expectation.good) * 100,
    };
  }
  if (value <= expectation.good) {
    return {
      rating: 'good',
      emoji: '🟡',
      label: 'Good',
      percentOfGood: (value / expectation.good) * 100,
    };
  }
  if (value <= expectation.needsWork) {
    return {
      rating: 'needsWork',
      emoji: '🟠',
      label: 'Needs Work',
      percentOfGood: (value / expectation.good) * 100,
    };
  }
  return {
    rating: 'poor',
    emoji: '🔴',
    label: 'Poor',
    percentOfGood: (value / expectation.good) * 100,
  };
}

/**
 * Generate commentary comparing a value to expected ranges
 */
function generateValueCommentary(
  metric: string,
  value: number,
  flowName?: string,
): string {
  const expectation = getMetricExpectation(metric, flowName);
  if (!expectation) return '';

  const assessment = assessValue(value, expectation);
  const unit = expectation.unit ? ` ${expectation.unit}` : '';

  if (assessment.rating === 'excellent') {
    return `${assessment.emoji} **${value.toFixed(1)}${unit}** is excellent (target: <${expectation.excellent}${unit})`;
  }
  if (assessment.rating === 'good') {
    return `${assessment.emoji} **${value.toFixed(1)}${unit}** is acceptable (target: <${expectation.good}${unit})`;
  }
  if (assessment.rating === 'needsWork') {
    const overGood = (
      ((value - expectation.good) / expectation.good) *
      100
    ).toFixed(0);
    return `${assessment.emoji} **${value.toFixed(1)}${unit}** needs improvement (+${overGood}% over target ${expectation.good}${unit})`;
  }
  const overNeedsWork = (
    ((value - expectation.needsWork) / expectation.needsWork) *
    100
  ).toFixed(0);
  return `${assessment.emoji} **${value.toFixed(1)}${unit}** is poor (+${overNeedsWork}% over threshold ${expectation.needsWork}${unit})`;
}

/**
 * Determines if a metric improvement is better or worse
 */
function determineImprovement(
  metric: string,
  changePercent: number,
): 'better' | 'worse' | 'neutral' {
  // Neutral metrics are always neutral regardless of change
  if (NEUTRAL_METRICS.includes(metric)) {
    return 'neutral';
  }

  // Lower is better for performance metrics
  if (LOWER_IS_BETTER_METRICS.includes(metric)) {
    return changePercent < -1
      ? 'better'
      : changePercent > 1
        ? 'worse'
        : 'neutral';
  }

  // Higher is better for remaining metrics (e.g., throughput, fps)
  return changePercent > 1
    ? 'better'
    : changePercent < -1
      ? 'worse'
      : 'neutral';
}

/**
 * Determines impact level based on metric and change
 */
function determineImpact(
  metric: string,
  changePercent: number,
  absoluteChange: number,
): 'high' | 'medium' | 'low' {
  const thresholds =
    IMPACT_THRESHOLDS[metric as keyof typeof IMPACT_THRESHOLDS];

  if (!thresholds) {
    // Default thresholds based on percentage
    if (Math.abs(changePercent) >= 20) return 'high';
    if (Math.abs(changePercent) >= 10) return 'medium';
    return 'low';
  }

  // Use absolute change for time-based metrics
  if (['inp', 'fcp', 'lcp', 'tbt'].includes(metric)) {
    if (Math.abs(absoluteChange) >= thresholds.high) return 'high';
    if (Math.abs(absoluteChange) >= thresholds.medium) return 'medium';
    return 'low';
  }

  // Use percentage for other metrics
  if (Math.abs(changePercent) >= thresholds.high * 100) return 'high';
  if (Math.abs(changePercent) >= thresholds.medium * 100) return 'medium';
  return 'low';
}

/**
 * Generates explanation for a metric change
 */
function generateExplanation(
  metric: string,
  comparison: MetricComparison,
): string {
  const { improvement, changePercent, absoluteChange } = {
    ...comparison,
    absoluteChange: Math.abs(comparison.change),
  };

  const metricNames: Record<string, string> = {
    numNetworkReqs: 'network requests',
    renderCount: 'React component renders',
    renderTime: 'total render time',
    averageRenderTime: 'average render time',
    inp: 'Interaction to Next Paint (INP)',
    inpCount: 'INP interaction count',
    fcp: 'First Contentful Paint (FCP)',
    lcp: 'Largest Contentful Paint (LCP)',
    tbt: 'Total Blocking Time (TBT)',
    cls: 'Cumulative Layout Shift (CLS)',
    interactionLatency: 'interaction latency',
    scrollToLoadLatency: 'scroll-to-load latency',
    cumulativeLoadTime: 'cumulative load time',
  };

  const metricName = metricNames[metric] || metric;

  // Neutral metrics
  if (NEUTRAL_METRICS.includes(metric)) {
    const direction = comparison.change > 0 ? 'increased' : 'decreased';
    return `${metricName} ${direction} by ${Math.abs(changePercent).toFixed(1)}% (informational metric).`;
  }

  if (improvement === 'better') {
    if (metric === 'numNetworkReqs') {
      return `${Math.abs(changePercent).toFixed(1)}% fewer ${metricName} indicates improved efficiency and reduced overhead.`;
    }
    if (['renderCount', 'renderTime', 'averageRenderTime'].includes(metric)) {
      return `${Math.abs(changePercent).toFixed(1)}% reduction in ${metricName} indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders.`;
    }
    if (
      ['inp', 'fcp', 'lcp', 'tbt', 'interactionLatency'].includes(metric) &&
      absoluteChange > 1
    ) {
      return `${absoluteChange.toFixed(0)}ms improvement in ${metricName} means faster, more responsive interactions.`;
    }
    return `${Math.abs(changePercent).toFixed(1)}% improvement in ${metricName}.`;
  }

  if (improvement === 'worse') {
    if (metric === 'numNetworkReqs') {
      return `${Math.abs(changePercent).toFixed(1)}% more ${metricName} may indicate additional API calls or inefficient data fetching.`;
    }
    if (['renderCount', 'renderTime', 'averageRenderTime'].includes(metric)) {
      return `${Math.abs(changePercent).toFixed(1)}% increase in ${metricName} suggests potential regression in component memoization.`;
    }
    if (
      ['inp', 'fcp', 'lcp', 'tbt', 'interactionLatency'].includes(metric) &&
      absoluteChange > 1
    ) {
      return `${absoluteChange.toFixed(0)}ms slower ${metricName} - investigate potential performance regression.`;
    }
    return `${Math.abs(changePercent).toFixed(1)}% regression in ${metricName}.`;
  }

  return `Minimal change in ${metricName} (${changePercent > 0 ? '+' : ''}${changePercent.toFixed(1)}%).`;
}

/**
 * Get flow report by flow name (maps display name to internal name)
 */
function getFlowReport(
  report: BenchmarkReport | undefined,
  flowName: string,
): FlowReport | undefined {
  if (!report) return undefined;

  // Map display names to internal names
  const nameMap: Record<string, string> = {
    'Power User: Tab Switching': 'tab-switching',
    'Power User: Account Switching': 'account-switching',
    'Power User: Network Switching': 'network-switching',
    'Power User: Network Adding': 'network-adding',
    'Power User: Import Srp': 'import-srp',
    'Power User: Token Search': 'token-search',
    'Power User: Token Send': 'token-send',
    'Power User: Tokens List Scrolling': 'tokens-list-scrolling',
    'Power User: Nft List Scrolling': 'nft-list-scrolling',
  };

  const internalName =
    nameMap[flowName] || flowName.toLowerCase().replace(/\s+/g, '-');
  return report.flowReports.find((fr) => fr.flowName === internalName);
}

/**
 * Compares two benchmark result files
 */
async function compareBenchmarkResults(
  beforeFile: string,
  afterFile: string,
): Promise<ComparisonReport> {
  const beforeRawData = JSON.parse(await fs.readFile(beforeFile, 'utf-8'));
  const afterRawData = JSON.parse(await fs.readFile(afterFile, 'utf-8'));

  // Extract results and reports from potentially nested schema
  const beforeData = extractResults(beforeRawData);
  const afterData = extractResults(afterRawData);
  const beforeReport = extractReport(beforeRawData);
  const afterReport = extractReport(afterRawData);

  const flows: FlowComparison[] = [];
  const allKeyFindings: string[] = [];
  const dataQualityWarnings: string[] = [];

  // Compare each flow
  for (const flowName in afterData) {
    if (!beforeData[flowName]) {
      continue; // Skip flows that don't exist in before
    }

    const beforeFlow = beforeData[flowName] as BenchmarkResults;
    const afterFlow = afterData[flowName] as BenchmarkResults;

    // Get flow reports for iteration counts
    const beforeFlowReport = getFlowReport(beforeReport, flowName);
    const afterFlowReport = getFlowReport(afterReport, flowName);
    const beforeIterations = beforeFlowReport?.iterationsCompleted || 6;
    const afterIterations = afterFlowReport?.iterationsCompleted || 6;

    const metrics: MetricComparison[] = [];
    const flowDataQuality: FlowDataQuality = {
      beforeQuality: {},
      afterQuality: {},
      isComparable: true,
      overallReliability: 'reliable',
      warnings: [],
    };

    // Check for failed flows
    if (beforeFlowReport?.status === 'failure') {
      flowDataQuality.warnings.push('Baseline flow failed - no valid data');
      flowDataQuality.isComparable = false;
      flowDataQuality.overallReliability = 'unreliable';
      dataQualityWarnings.push(`${flowName}: Baseline flow failed completely`);
    }
    if (afterFlowReport?.status === 'failure') {
      flowDataQuality.warnings.push('Compiler flow failed - no valid data');
      flowDataQuality.isComparable = false;
      flowDataQuality.overallReliability = 'unreliable';
      dataQualityWarnings.push(`${flowName}: Compiler flow failed completely`);
    }

    // Check iteration counts
    if (beforeIterations < MIN_ITERATIONS_REQUIRED) {
      flowDataQuality.warnings.push(
        `Baseline has insufficient iterations (${beforeIterations}/${MIN_ITERATIONS_REQUIRED} minimum)`,
      );
      dataQualityWarnings.push(
        `${flowName}: Baseline only has ${beforeIterations} iterations`,
      );
    }
    if (afterIterations < MIN_ITERATIONS_REQUIRED) {
      flowDataQuality.warnings.push(
        `Compiler has insufficient iterations (${afterIterations}/${MIN_ITERATIONS_REQUIRED} minimum)`,
      );
      dataQualityWarnings.push(
        `${flowName}: Compiler only has ${afterIterations} iterations`,
      );
    }

    // Check for errors/warnings in flow reports
    if (beforeFlowReport?.errors?.length) {
      flowDataQuality.warnings.push(
        `Baseline had ${beforeFlowReport.errors.length} error(s)`,
      );
    }
    if (afterFlowReport?.errors?.length) {
      flowDataQuality.warnings.push(
        `Compiler had ${afterFlowReport.errors.length} error(s)`,
      );
    }

    // Compare mean values for each metric
    const metricKeys = new Set([
      ...Object.keys(beforeFlow.mean || {}),
      ...Object.keys(afterFlow.mean || {}),
    ]);

    let unreliableMetrics = 0;
    let partialMetrics = 0;

    for (const metric of metricKeys) {
      const beforeValue = beforeFlow.mean?.[metric];
      const afterValue = afterFlow.mean?.[metric];

      if (typeof beforeValue !== 'number' || typeof afterValue !== 'number') {
        continue;
      }

      // Get stdDev, min, max for quality assessment
      const beforeStdDev = beforeFlow.stdDev?.[metric] || 0;
      const afterStdDev = afterFlow.stdDev?.[metric] || 0;
      const beforeMin = beforeFlow.min?.[metric] || beforeValue;
      const afterMin = afterFlow.min?.[metric] || afterValue;
      const beforeMax = beforeFlow.max?.[metric] || beforeValue;
      const afterMax = afterFlow.max?.[metric] || afterValue;

      // Assess data quality
      const beforeQuality = assessMetricQuality(
        beforeValue,
        beforeMin,
        beforeMax,
        beforeStdDev,
        beforeIterations,
        metric,
      );
      const afterQuality = assessMetricQuality(
        afterValue,
        afterMin,
        afterMax,
        afterStdDev,
        afterIterations,
        metric,
      );

      flowDataQuality.beforeQuality[metric] = beforeQuality;
      flowDataQuality.afterQuality[metric] = afterQuality;

      const metricReliability = determineMetricReliability(
        beforeQuality,
        afterQuality,
      );

      if (metricReliability === 'unreliable') unreliableMetrics++;
      else if (metricReliability === 'partial') partialMetrics++;

      // Calculate statistical significance
      const isSignificant = isStatisticallySignificant(
        beforeValue,
        beforeStdDev,
        beforeIterations,
        afterValue,
        afterStdDev,
        afterIterations,
      );

      const change = afterValue - beforeValue;
      const changePercent =
        beforeValue !== 0 ? (change / beforeValue) * 100 : 0;
      const improvement = determineImprovement(metric, changePercent);
      const impact = determineImpact(metric, changePercent, change);
      const explanation = generateExplanation(metric, {
        metric,
        before: beforeValue,
        after: afterValue,
        change,
        changePercent,
        improvement,
        impact,
        explanation: '',
      });

      // Get metric expectations and assessments
      const expectation = getMetricExpectation(metric, flowName);
      const beforeAssessment = expectation
        ? assessValue(beforeValue, expectation)
        : undefined;
      const afterAssessment = expectation
        ? assessValue(afterValue, expectation)
        : undefined;
      const beforeCommentary = generateValueCommentary(
        metric,
        beforeValue,
        flowName,
      );
      const afterCommentary = generateValueCommentary(
        metric,
        afterValue,
        flowName,
      );

      metrics.push({
        metric,
        before: beforeValue,
        after: afterValue,
        change,
        changePercent,
        improvement,
        impact,
        explanation,
        beforeAssessment,
        afterAssessment,
        beforeCommentary,
        afterCommentary,
        metricDescription: expectation?.description,
        reactCompilerRelevance: expectation?.reactCompilerRelevance,
        whatToLookFor: expectation?.whatToLookFor,
        dataQuality: {
          beforeCV: beforeQuality.coefficientOfVariation,
          afterCV: afterQuality.coefficientOfVariation,
          isStatisticallySignificant: isSignificant,
          reliability: metricReliability,
        },
      });

      // Collect key findings (only for reliable data)
      const beforeValStr = formatMetricValue(metric, beforeValue);
      const afterValStr = formatMetricValue(metric, afterValue);
      if (metricReliability !== 'unreliable') {
        if (impact === 'high' && improvement === 'better') {
          const reliabilityNote =
            metricReliability === 'partial' ? ' (⚠️ partial data)' : '';
          allKeyFindings.push(
            `${flowName}: ${Math.abs(changePercent).toFixed(1)}% improvement in ${metric} (${beforeValStr} → ${afterValStr})${reliabilityNote}`,
          );
        } else if (impact === 'high' && improvement === 'worse') {
          const reliabilityNote =
            metricReliability === 'partial' ? ' (⚠️ partial data)' : '';
          allKeyFindings.push(
            `⚠️ ${flowName}: ${Math.abs(changePercent).toFixed(1)}% regression in ${metric} (${beforeValStr} → ${afterValStr})${reliabilityNote}`,
          );
        }
      } else {
        // Flag unreliable high-impact metrics
        if (impact === 'high' && improvement !== 'neutral') {
          dataQualityWarnings.push(
            `${flowName}: ${metric} shows ${Math.abs(changePercent).toFixed(1)}% change (${beforeValStr} → ${afterValStr}) but data is UNRELIABLE (CV: baseline ${beforeQuality.coefficientOfVariation.toFixed(0)}%, compiler ${afterQuality.coefficientOfVariation.toFixed(0)}%)`,
          );
        }
      }
    }

    // Determine overall flow reliability
    const totalMetrics = metrics.length;
    if (unreliableMetrics > totalMetrics * 0.5) {
      flowDataQuality.overallReliability = 'unreliable';
    } else if (unreliableMetrics > 0 || partialMetrics > totalMetrics * 0.3) {
      flowDataQuality.overallReliability = 'partial';
    }

    // Determine overall impact for the flow
    const highImpactMetrics = metrics.filter((m) => m.impact === 'high');
    const overallImpact =
      highImpactMetrics.length > 0
        ? highImpactMetrics[0].impact
        : metrics.some((m) => m.impact === 'medium')
          ? 'medium'
          : 'low';

    // Generate summary
    const improvements = metrics.filter((m) => m.improvement === 'better');
    const regressions = metrics.filter((m) => m.improvement === 'worse');
    const summary = `${improvements.length} metrics improved, ${regressions.length} regressed.`;

    // Generate recommendations
    const recommendations: string[] = [];

    // Add data quality warnings first
    if (flowDataQuality.overallReliability === 'unreliable') {
      recommendations.push(
        `⚠️ DATA QUALITY WARNING: This flow's data is unreliable - results should be disregarded.`,
      );
    } else if (flowDataQuality.overallReliability === 'partial') {
      recommendations.push(
        `⚠️ Some metrics have high variance - interpret results with caution.`,
      );
    }

    if (regressions.length > 0) {
      // Filter for reliable regressions only
      const reliableRegressions = regressions.filter(
        (r) => r.dataQuality?.reliability !== 'unreliable',
      );
      if (reliableRegressions.length > 0) {
        recommendations.push(
          `Investigate ${reliableRegressions.length} metric regression(s) in this flow.`,
        );
      }
    }
    if (improvements.length > 0) {
      const reliableImprovements = improvements.filter(
        (i) => i.dataQuality?.reliability !== 'unreliable',
      );
      if (reliableImprovements.length > 0) {
        recommendations.push(
          `React Compiler optimization is effective - ${reliableImprovements.length} metric(s) improved.`,
        );
      }
    }
    if (highImpactMetrics.length > 0) {
      const reliableHighImpact = highImpactMetrics.filter(
        (m) => m.dataQuality?.reliability !== 'unreliable',
      );
      if (reliableHighImpact.length > 0) {
        recommendations.push(
          `Focus on high-impact metrics: ${reliableHighImpact.map((m) => m.metric).join(', ')}.`,
        );
      }
    }

    flows.push({
      flowName,
      metrics,
      overallImpact,
      summary,
      recommendations,
      dataQuality: flowDataQuality,
    });
  }

  // Generate overall summary
  const totalImprovements = flows.reduce(
    (sum, flow) =>
      sum + flow.metrics.filter((m) => m.improvement === 'better').length,
    0,
  );
  const totalRegressions = flows.reduce(
    (sum, flow) =>
      sum + flow.metrics.filter((m) => m.improvement === 'worse').length,
    0,
  );

  // Count reliable vs unreliable flows
  const reliableFlows = flows.filter(
    (f) => f.dataQuality?.overallReliability === 'reliable',
  ).length;
  const partialFlows = flows.filter(
    (f) => f.dataQuality?.overallReliability === 'partial',
  ).length;
  const unreliableFlows = flows.filter(
    (f) => f.dataQuality?.overallReliability === 'unreliable',
  ).length;

  let overallSummary = `Overall: ${totalImprovements} metrics improved across ${flows.length} flows, ${totalRegressions} regressions detected.`;
  if (unreliableFlows > 0 || partialFlows > 0) {
    overallSummary += ` Data quality: ${reliableFlows} reliable, ${partialFlows} partial, ${unreliableFlows} unreliable flows.`;
  }

  return {
    beforeFile,
    afterFile,
    timestamp: Date.now(),
    beforeReport,
    afterReport,
    flows,
    overallSummary,
    keyFindings: allKeyFindings.slice(0, 10), // Top 10 findings
    dataQualityWarnings,
  };
}

/**
 * Formats duration in human-readable format
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Metrics that use milliseconds as units
 */
const TIME_METRICS = [
  'inp',
  'fcp',
  'lcp',
  'tbt',
  'interactionLatency',
  'renderTime',
  'scrollToLoadLatency',
  'cumulativeLoadTime',
  'load',
  'domContentLoaded',
  'firstPaint',
];

/**
 * Format a metric value with appropriate units
 */
function formatMetricValue(metric: string, value: number): string {
  if (TIME_METRICS.includes(metric)) {
    if (Math.abs(value) >= 1000) {
      return `${(value / 1000).toFixed(2)}s`;
    }
    return `${value.toFixed(0)}ms`;
  }

  // For counts and other metrics
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(2);
}

/**
 * Generates executive summary with statistical analysis
 */
function generateExecutiveSummary(report: ComparisonReport): string {
  let summary = '';

  // Collect all metrics across flows
  const allMetrics = report.flows.flatMap((f) => f.metrics);

  // Separate reliable vs unreliable metrics
  const reliableMetrics = allMetrics.filter(
    (m) => m.dataQuality?.reliability !== 'unreliable',
  );
  const unreliableMetrics = allMetrics.filter(
    (m) => m.dataQuality?.reliability === 'unreliable',
  );

  const improvements = reliableMetrics.filter(
    (m) => m.improvement === 'better',
  );
  const regressions = reliableMetrics.filter((m) => m.improvement === 'worse');
  const neutral = reliableMetrics.filter((m) => m.improvement === 'neutral');

  // Calculate average improvement percentages by category (reliable only)
  const renderMetrics = reliableMetrics.filter((m) =>
    ['renderCount', 'renderTime', 'averageRenderTime'].includes(m.metric),
  );
  const webVitals = reliableMetrics.filter((m) =>
    ['inp', 'fcp', 'lcp', 'tbt', 'cls'].includes(m.metric),
  );
  const networkMetrics = reliableMetrics.filter(
    (m) => m.metric === 'numNetworkReqs',
  );
  const latencyMetrics = reliableMetrics.filter((m) =>
    [
      'interactionLatency',
      'scrollToLoadLatency',
      'cumulativeLoadTime',
    ].includes(m.metric),
  );

  const avgChange = (metrics: MetricComparison[]) => {
    if (metrics.length === 0) return 0;
    return (
      metrics.reduce((sum, m) => sum + m.changePercent, 0) / metrics.length
    );
  };

  summary += '## Executive Summary\n\n';

  // Data Quality Warning Section
  if (report.dataQualityWarnings.length > 0 || unreliableMetrics.length > 0) {
    summary += '### ⚠️ Data Quality Warnings\n\n';
    summary += `**${unreliableMetrics.length} of ${allMetrics.length} metrics have unreliable data** (high variance or insufficient samples).\n\n`;

    if (report.dataQualityWarnings.length > 0) {
      summary += 'Key issues:\n';
      report.dataQualityWarnings.slice(0, 5).forEach((warning) => {
        summary += `  • ${warning}\n`;
      });
      if (report.dataQualityWarnings.length > 5) {
        summary += `  • ... and ${report.dataQualityWarnings.length - 5} more warnings\n`;
      }
      summary += '\n';
    }

    // Flow reliability summary
    const reliableFlows = report.flows.filter(
      (f) => f.dataQuality?.overallReliability === 'reliable',
    );
    const partialFlows = report.flows.filter(
      (f) => f.dataQuality?.overallReliability === 'partial',
    );
    const unreliableFlows = report.flows.filter(
      (f) => f.dataQuality?.overallReliability === 'unreliable',
    );

    summary += '**Flow Reliability:**\n';
    summary += `| Status | Count | Flows |\n`;
    summary += `|--------|-------|-------|\n`;
    if (reliableFlows.length > 0) {
      summary += `| ✅ Reliable | ${reliableFlows.length} | ${reliableFlows.map((f) => f.flowName.replace('Power User: ', '')).join(', ')} |\n`;
    }
    if (partialFlows.length > 0) {
      summary += `| ⚠️ Partial | ${partialFlows.length} | ${partialFlows.map((f) => f.flowName.replace('Power User: ', '')).join(', ')} |\n`;
    }
    if (unreliableFlows.length > 0) {
      summary += `| ❌ Unreliable | ${unreliableFlows.length} | ${unreliableFlows.map((f) => f.flowName.replace('Power User: ', '')).join(', ')} |\n`;
    }
    summary += '\n';
  }

  summary += '### Overall Assessment\n\n';

  const netImpact = improvements.length - regressions.length;
  if (netImpact > 0 && regressions.length === 0) {
    summary +=
      '✅ **POSITIVE IMPACT**: All measured metrics improved or remained stable.\n\n';
  } else if (netImpact > 3) {
    summary +=
      '✅ **NET POSITIVE**: Significantly more improvements than regressions.\n\n';
  } else if (netImpact > 0) {
    summary +=
      '⚠️ **MIXED RESULTS**: More improvements than regressions, but some areas need attention.\n\n';
  } else if (netImpact === 0) {
    summary +=
      '➖ **NEUTRAL**: Equal improvements and regressions - net zero impact.\n\n';
  } else {
    summary +=
      '❌ **NET NEGATIVE**: More regressions than improvements detected.\n\n';
  }

  summary += '### Statistics Overview (Reliable Data Only)\n\n';
  summary += `| Category | Count | Percentage |\n`;
  summary += `|----------|-------|------------|\n`;
  summary += `| Improvements | ${improvements.length} | ${((improvements.length / reliableMetrics.length) * 100).toFixed(1)}% |\n`;
  summary += `| Regressions | ${regressions.length} | ${((regressions.length / reliableMetrics.length) * 100).toFixed(1)}% |\n`;
  summary += `| Neutral | ${neutral.length} | ${((neutral.length / reliableMetrics.length) * 100).toFixed(1)}% |\n`;
  summary += `| **Reliable Metrics** | ${reliableMetrics.length} | - |\n`;
  summary += `| ~~Unreliable (excluded)~~ | ${unreliableMetrics.length} | - |\n\n`;

  summary += '### Performance by Category (Reliable Data)\n\n';
  summary += `| Category | Avg Change | Interpretation |\n`;
  summary += `|----------|------------|----------------|\n`;

  const formatCategoryRow = (
    name: string,
    metrics: MetricComparison[],
    lowerIsBetter: boolean,
  ) => {
    if (metrics.length === 0) return '';
    const avg = avgChange(metrics);
    const improved = lowerIsBetter ? avg < 0 : avg > 0;
    const icon = Math.abs(avg) < 1 ? '➖' : improved ? '✅' : '⚠️';
    const interpretation =
      Math.abs(avg) < 1
        ? 'No significant change'
        : improved
          ? `${Math.abs(avg).toFixed(1)}% better`
          : `${Math.abs(avg).toFixed(1)}% worse`;
    return `| ${name} | ${avg > 0 ? '+' : ''}${avg.toFixed(1)}% | ${icon} ${interpretation} |\n`;
  };

  summary += formatCategoryRow('React Rendering', renderMetrics, true);
  summary += formatCategoryRow('Web Vitals (INP/FCP/TBT)', webVitals, true);
  summary += formatCategoryRow('Network Requests', networkMetrics, true);
  summary += formatCategoryRow('Interaction Latency', latencyMetrics, true);

  summary += '\n### Key Observations\n\n';

  // Highlight biggest improvements (reliable only, with statistical significance)
  const sortedImprovements = [...improvements]
    .filter((m) => m.dataQuality?.isStatisticallySignificant)
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent));

  if (sortedImprovements.length > 0) {
    summary += '**Top Improvements (Statistically Significant):**\n';
    sortedImprovements.slice(0, 5).forEach((m) => {
      const flow = report.flows.find((f) =>
        f.metrics.some((fm) => fm === m),
      )?.flowName;
      const beforeVal = formatMetricValue(m.metric, m.before);
      const afterVal = formatMetricValue(m.metric, m.after);
      const cvNote =
        m.dataQuality?.reliability === 'partial'
          ? ` ⚠️ CV: ${m.dataQuality.beforeCV.toFixed(0)}%/${m.dataQuality.afterCV.toFixed(0)}%`
          : '';
      summary += `  • ${flow}: ${m.metric} improved by ${Math.abs(m.changePercent).toFixed(1)}% (${beforeVal} → ${afterVal})${cvNote}\n`;
    });
    summary += '\n';
  } else if (improvements.length > 0) {
    summary += '**Top Improvements (Not Statistically Verified):**\n';
    [...improvements]
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 5)
      .forEach((m) => {
        const flow = report.flows.find((f) =>
          f.metrics.some((fm) => fm === m),
        )?.flowName;
        const beforeVal = formatMetricValue(m.metric, m.before);
        const afterVal = formatMetricValue(m.metric, m.after);
        summary += `  • ${flow}: ${m.metric} improved by ${Math.abs(m.changePercent).toFixed(1)}% (${beforeVal} → ${afterVal}) (needs more data)\n`;
      });
    summary += '\n';
  }

  // Highlight biggest regressions (reliable only)
  const sortedRegressions = [...regressions].sort(
    (a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent),
  );
  if (sortedRegressions.length > 0) {
    summary += '**Areas Needing Attention:**\n';
    sortedRegressions.slice(0, 5).forEach((m) => {
      const flow = report.flows.find((f) =>
        f.metrics.some((fm) => fm === m),
      )?.flowName;
      const beforeVal = formatMetricValue(m.metric, m.before);
      const afterVal = formatMetricValue(m.metric, m.after);
      const sigNote = m.dataQuality?.isStatisticallySignificant
        ? ' (statistically significant)'
        : ' (may be noise)';
      summary += `  • ${flow}: ${m.metric} regressed by ${Math.abs(m.changePercent).toFixed(1)}% (${beforeVal} → ${afterVal})${sigNote}\n`;
    });
    summary += '\n';
  }

  // Statistical confidence note
  summary += '### Statistical Notes\n\n';
  summary += '- Results exclude metrics with CV > 50% (unreliable data)\n';
  summary += '- "Statistically significant" uses Welch\'s t-test at α=0.05\n';
  summary +=
    '- Metrics marked "partial" have high variance in one dataset (CV 30-50%)\n';
  summary +=
    '- Consider running more iterations for flows with data quality warnings\n\n';

  return summary;
}

/**
 * Formats comparison report for display with enhanced commentary
 */
function formatReport(report: ComparisonReport): string {
  let output = '';

  // ═══════════════════════════════════════════════════════════════════════════
  // HEADER
  // ═══════════════════════════════════════════════════════════════════════════
  output += '# React Compiler Benchmark Comparison Report\n\n';
  output += `**Generated:** ${new Date(report.timestamp).toISOString()}\n\n`;
  output += `| | Baseline | Compiler |\n`;
  output += `|---|---|---|\n`;
  output += `| **File** | ${path.basename(report.beforeFile)} | ${path.basename(report.afterFile)} |\n`;
  if (report.beforeReport || report.afterReport) {
    output += `| **Duration** | ${report.beforeReport ? formatDuration(report.beforeReport.durationMs) : 'N/A'} | ${report.afterReport ? formatDuration(report.afterReport.durationMs) : 'N/A'} |\n`;
    output += `| **Flows** | ${report.beforeReport ? `${report.beforeReport.summary.successfulFlows}/${report.beforeReport.summary.totalFlows}` : 'N/A'} | ${report.afterReport ? `${report.afterReport.summary.successfulFlows}/${report.afterReport.summary.totalFlows}` : 'N/A'} |\n`;
  }
  output += '\n---\n\n';

  // ═══════════════════════════════════════════════════════════════════════════
  // EXECUTIVE SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  output += generateExecutiveSummary(report);
  output += '\n---\n\n';

  // ═══════════════════════════════════════════════════════════════════════════
  // QUICK DATA OVERVIEW - All metrics in one table per flow
  // ═══════════════════════════════════════════════════════════════════════════
  output += '## 📊 Complete Data\n\n';
  output += 'All measurements comparing Baseline vs React Compiler.\n\n';

  for (const flow of report.flows) {
    const flowShortName = flow.flowName.replace('Power User: ', '');
    const reliabilityIcon =
      flow.dataQuality?.overallReliability === 'reliable'
        ? '✅'
        : flow.dataQuality?.overallReliability === 'partial'
          ? '⚠️'
          : '❌';

    // Count improvements/regressions
    const flowImprovements = flow.metrics.filter(
      (m) => m.improvement === 'better',
    ).length;
    const flowRegressions = flow.metrics.filter(
      (m) => m.improvement === 'worse',
    ).length;

    output += `### ${flowShortName} ${reliabilityIcon}\n`;
    output += `*${flowImprovements} improved, ${flowRegressions} regressed*\n\n`;

    // Create compact data table - focus on change
    output += `| Metric | Baseline | Compiler | Change | Sig? |\n`;
    output += `|--------|----------|----------|--------|------|\n`;

    for (const m of flow.metrics) {
      const beforeVal = formatMetricValue(m.metric, m.before);
      const afterVal = formatMetricValue(m.metric, m.after);
      const changeIcon =
        m.improvement === 'better'
          ? '✅'
          : m.improvement === 'worse'
            ? '⚠️'
            : '➖';
      const sign = m.changePercent > 0 ? '+' : '';
      const sigStr = m.dataQuality?.isStatisticallySignificant
        ? '✓'
        : m.dataQuality?.reliability === 'unreliable'
          ? '❌'
          : '';

      output += `| ${m.metric} | ${beforeVal} | ${afterVal} | ${changeIcon} ${sign}${m.changePercent.toFixed(1)}% | ${sigStr} |\n`;
    }
    output += '\n';

    // Data quality note
    if (flow.dataQuality?.overallReliability !== 'reliable') {
      output += `> ⚠️ ${flow.dataQuality?.overallReliability === 'partial' ? 'Some metrics have high variance' : 'Data unreliable'}\n\n`;
    }
  }

  output +=
    '**Legend:** ✅ Improved | ⚠️ Regressed | ➖ No change | ✓ Statistically significant | ❌ Unreliable\n\n';
  output += '---\n\n';

  // ═══════════════════════════════════════════════════════════════════════════
  // REACT COMPILER IMPACT BY FLOW
  // ═══════════════════════════════════════════════════════════════════════════
  output += '## ⚛️ React Compiler Impact by Flow\n\n';
  output +=
    'Focus on key metrics that React Compiler directly affects: **renderCount**, **renderTime**, and downstream effects on **INP** and **TBT**.\n\n';

  for (const flow of report.flows) {
    const flowShortName = flow.flowName.replace('Power User: ', '');
    const reliabilityIcon =
      flow.dataQuality?.overallReliability === 'reliable'
        ? '✅'
        : flow.dataQuality?.overallReliability === 'partial'
          ? '⚠️'
          : '❌';

    output += `### ${flowShortName} ${reliabilityIcon}\n\n`;

    // Primary React metrics (most important for compiler evaluation)
    const primaryMetrics = flow.metrics.filter((m) =>
      ['renderCount', 'renderTime'].includes(m.metric),
    );
    const secondaryMetrics = flow.metrics.filter((m) =>
      ['averageRenderTime', 'inp', 'tbt', 'interactionLatency'].includes(
        m.metric,
      ),
    );

    // Calculate overall compiler effectiveness for this flow
    const renderCountChange = primaryMetrics.find(
      (m) => m.metric === 'renderCount',
    );
    const renderTimeChange = primaryMetrics.find(
      (m) => m.metric === 'renderTime',
    );

    if (renderCountChange || renderTimeChange) {
      output += '**🎯 React Compiler Effectiveness:**\n\n';

      if (renderCountChange) {
        const rcSign = renderCountChange.changePercent > 0 ? '+' : '';
        const rcVerdict =
          renderCountChange.improvement === 'better'
            ? '✅ Fewer re-renders'
            : renderCountChange.improvement === 'worse'
              ? '⚠️ More re-renders'
              : '➖ No significant change';
        output += `- **Render Count:** ${formatMetricValue('renderCount', renderCountChange.before)} → ${formatMetricValue('renderCount', renderCountChange.after)} (${rcSign}${renderCountChange.changePercent.toFixed(1)}%) ${rcVerdict}\n`;
      }
      if (renderTimeChange) {
        const rtSign = renderTimeChange.changePercent > 0 ? '+' : '';
        const rtVerdict =
          renderTimeChange.improvement === 'better'
            ? '✅ Less render work'
            : renderTimeChange.improvement === 'worse'
              ? '⚠️ More render work'
              : '➖ No significant change';
        output += `- **Render Time:** ${formatMetricValue('renderTime', renderTimeChange.before)} → ${formatMetricValue('renderTime', renderTimeChange.after)} (${rtSign}${renderTimeChange.changePercent.toFixed(1)}%) ${rtVerdict}\n`;
      }
      output += '\n';
    }

    // Show downstream effects
    if (secondaryMetrics.length > 0) {
      output += '**📊 Downstream Effects:**\n\n';
      secondaryMetrics.forEach((m) => {
        const sign = m.changePercent > 0 ? '+' : '';
        const verdict =
          m.improvement === 'better'
            ? '✅'
            : m.improvement === 'worse'
              ? '⚠️'
              : '➖';
        output += `- **${m.metric}:** ${formatMetricValue(m.metric, m.before)} → ${formatMetricValue(m.metric, m.after)} (${sign}${m.changePercent.toFixed(1)}%) ${verdict}\n`;
      });
      output += '\n';
    }

    // Data quality note if needed
    if (flow.dataQuality?.overallReliability !== 'reliable') {
      output += `> ⚠️ **Data Quality:** ${flow.dataQuality?.overallReliability === 'partial' ? 'Some metrics have high variance - interpret with caution' : 'Data unreliable'}\n\n`;
    }

    // Show metric context in collapsible
    const metricsWithContext = flow.metrics.filter(
      (m) => m.reactCompilerRelevance || m.whatToLookFor,
    );
    if (metricsWithContext.length > 0) {
      output +=
        '<details>\n<summary>📖 How React Compiler affects these metrics</summary>\n\n';
      metricsWithContext.forEach((m) => {
        if (m.reactCompilerRelevance) {
          output += `**${m.metric}:** ${m.reactCompilerRelevance}\n\n`;
        }
      });
      output += '</details>\n\n';
    }

    // Show all other metrics in compact table
    const otherMetrics = flow.metrics.filter(
      (m) =>
        ![
          'renderCount',
          'renderTime',
          'averageRenderTime',
          'inp',
          'tbt',
          'interactionLatency',
        ].includes(m.metric),
    );
    if (otherMetrics.length > 0) {
      output += '<details>\n<summary>📋 Other Metrics</summary>\n\n';
      output += '| Metric | Baseline | Compiler | Change |\n';
      output += '|--------|----------|----------|--------|\n';
      otherMetrics.forEach((m) => {
        const sign = m.changePercent > 0 ? '+' : '';
        const icon =
          m.improvement === 'better'
            ? '✅'
            : m.improvement === 'worse'
              ? '⚠️'
              : '➖';
        output += `| ${m.metric} | ${formatMetricValue(m.metric, m.before)} | ${formatMetricValue(m.metric, m.after)} | ${icon} ${sign}${m.changePercent.toFixed(1)}% |\n`;
      });
      output += '\n</details>\n\n';
    }

    output += '---\n\n';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // APPENDIX - KEY FINDINGS
  // ═══════════════════════════════════════════════════════════════════════════
  if (report.keyFindings.length > 0) {
    output += '## 📌 Key Findings\n\n';
    report.keyFindings.forEach((finding) => {
      output += `- ${finding}\n`;
    });
    output += '\n';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // APPENDIX - DATA QUALITY WARNINGS
  // ═══════════════════════════════════════════════════════════════════════════
  if (report.dataQualityWarnings.length > 0) {
    output += '## ⚠️ Data Quality Warnings\n\n';
    report.dataQualityWarnings.forEach((warning) => {
      output += `- ${warning}\n`;
    });
    output += '\n';
  }

  return output;
}

/**
 * Main function
 */
async function main(): Promise<void> {
  const { argv } = yargs(hideBin(process.argv)).usage(
    '$0 [options]',
    'Compare two benchmark result files',
    (_yargs) =>
      _yargs
        .option('before', {
          type: 'string',
          description: 'Path to before benchmark results JSON file',
          demandOption: true,
        })
        .option('after', {
          type: 'string',
          description: 'Path to after benchmark results JSON file',
          demandOption: true,
        })
        .option('out', {
          type: 'string',
          description: 'Output file path for comparison report (JSON format)',
        })
        .option('format', {
          type: 'string',
          choices: ['json', 'text'],
          default: 'text',
          description: 'Output format',
        }),
  ) as unknown as {
    argv: {
      before: string;
      after: string;
      out?: string;
      format: 'json' | 'text';
    };
  };

  const { before, after, out, format } = argv;

  try {
    const report = await compareBenchmarkResults(before, after);

    if (format === 'json') {
      const output = JSON.stringify(report, null, 2);
      if (out) {
        await fs.writeFile(out, output);
        console.log(`Comparison report written to ${out}`);
      } else {
        console.log(output);
      }
    } else {
      const output = formatReport(report);
      if (out) {
        await fs.writeFile(out, output);
        console.log(`Comparison report written to ${out}`);
      } else {
        console.log(output);
      }
    }
  } catch (error) {
    exitWithError(error);
  }
}

main().catch((error) => {
  exitWithError(error);
});
