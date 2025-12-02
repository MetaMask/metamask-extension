import { promises as fs } from 'fs';
import * as path from 'path';
import { hideBin } from 'yargs/helpers';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const yargs = require('yargs/yargs');
import { exitWithError } from '../../../development/lib/exit-with-error';
import { BenchmarkResults } from './types-generated';

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
};

/**
 * Overall comparison result
 */
type ComparisonReport = {
  beforeFile: string;
  afterFile: string;
  timestamp: number;
  flows: FlowComparison[];
  overallSummary: string;
  keyFindings: string[];
};

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
 * Determines if a metric improvement is better or worse
 */
function determineImprovement(
  metric: string,
  changePercent: number,
): 'better' | 'worse' | 'neutral' {
  // Lower is better for most metrics
  const lowerIsBetter = [
    'renderCount',
    'renderTime',
    'averageRenderTime',
    'inp',
    'fcp',
    'lcp',
    'tbt',
    'cls',
    'interactionLatency',
    'load',
    'domContentLoaded',
    'firstPaint',
  ];

  if (lowerIsBetter.includes(metric)) {
    return changePercent < -5
      ? 'better'
      : changePercent > 5
        ? 'worse'
        : 'neutral';
  }

  // Higher is better (e.g., throughput metrics)
  return changePercent > 5
    ? 'better'
    : changePercent < -5
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
    renderCount: 'React component renders',
    renderTime: 'Total render time',
    averageRenderTime: 'Average render time',
    inp: 'Interaction to Next Paint',
    fcp: 'First Contentful Paint',
    lcp: 'Largest Contentful Paint',
    tbt: 'Total Blocking Time',
    cls: 'Cumulative Layout Shift',
    interactionLatency: 'Interaction latency',
  };

  const metricName = metricNames[metric] || metric;

  if (improvement === 'better') {
    if (['renderCount', 'renderTime', 'averageRenderTime'].includes(metric)) {
      return `${Math.abs(changePercent).toFixed(1)}% reduction in ${metricName} indicates React Compiler is successfully memoizing components and reducing unnecessary re-renders.`;
    }
    if (['inp', 'fcp', 'lcp', 'tbt', 'interactionLatency'].includes(metric)) {
      return `${Math.abs(absoluteChange).toFixed(0)}ms improvement in ${metricName} means users will experience faster, more responsive interactions.`;
    }
    return `${Math.abs(changePercent).toFixed(1)}% improvement in ${metricName} enhances user experience.`;
  }

  if (improvement === 'worse') {
    return `${Math.abs(changePercent).toFixed(1)}% increase in ${metricName} may indicate a regression. Investigate specific components or flows that degraded.`;
  }

  return `Minimal change in ${metricName} (${changePercent.toFixed(1)}%).`;
}

/**
 * Compares two benchmark result files
 */
async function compareBenchmarkResults(
  beforeFile: string,
  afterFile: string,
): Promise<ComparisonReport> {
  const beforeData = JSON.parse(await fs.readFile(beforeFile, 'utf-8'));
  const afterData = JSON.parse(await fs.readFile(afterFile, 'utf-8'));

  const flows: FlowComparison[] = [];
  const allKeyFindings: string[] = [];

  // Compare each flow
  for (const flowName in afterData) {
    if (!beforeData[flowName]) {
      continue; // Skip flows that don't exist in before
    }

    const beforeFlow = beforeData[flowName] as BenchmarkResults;
    const afterFlow = afterData[flowName] as BenchmarkResults;

    const metrics: MetricComparison[] = [];

    // Compare mean values for each metric
    const metricKeys = new Set([
      ...Object.keys(beforeFlow.mean || {}),
      ...Object.keys(afterFlow.mean || {}),
    ]);

    for (const metric of metricKeys) {
      const beforeValue = beforeFlow.mean?.[metric];
      const afterValue = afterFlow.mean?.[metric];

      if (typeof beforeValue !== 'number' || typeof afterValue !== 'number') {
        continue;
      }

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

      metrics.push({
        metric,
        before: beforeValue,
        after: afterValue,
        change,
        changePercent,
        improvement,
        impact,
        explanation,
      });

      // Collect key findings
      if (impact === 'high' && improvement === 'better') {
        allKeyFindings.push(
          `${flowName}: ${Math.abs(changePercent).toFixed(1)}% improvement in ${metric}`,
        );
      } else if (impact === 'high' && improvement === 'worse') {
        allKeyFindings.push(
          `⚠️ ${flowName}: ${Math.abs(changePercent).toFixed(1)}% regression in ${metric}`,
        );
      }
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
    if (regressions.length > 0) {
      recommendations.push(
        `Investigate ${regressions.length} metric regression(s) in this flow.`,
      );
    }
    if (improvements.length > 0) {
      recommendations.push(
        `React Compiler optimization is effective - ${improvements.length} metric(s) improved.`,
      );
    }
    if (highImpactMetrics.length > 0) {
      recommendations.push(
        `Focus on high-impact metrics: ${highImpactMetrics.map((m) => m.metric).join(', ')}.`,
      );
    }

    flows.push({
      flowName,
      metrics,
      overallImpact,
      summary,
      recommendations,
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

  const overallSummary = `Overall: ${totalImprovements} metrics improved across ${flows.length} flows, ${totalRegressions} regressions detected.`;

  return {
    beforeFile,
    afterFile,
    timestamp: Date.now(),
    flows,
    overallSummary,
    keyFindings: allKeyFindings.slice(0, 10), // Top 10 findings
  };
}

/**
 * Formats comparison report for display
 */
function formatReport(report: ComparisonReport): string {
  let output = '\n=== Benchmark Comparison Report ===\n\n';
  output += `Before: ${path.basename(report.beforeFile)}\n`;
  output += `After: ${path.basename(report.afterFile)}\n`;
  output += `Generated: ${new Date(report.timestamp).toISOString()}\n\n`;

  output += `--- Overall Summary ---\n`;
  output += `${report.overallSummary}\n\n`;

  if (report.keyFindings.length > 0) {
    output += `--- Key Findings ---\n`;
    report.keyFindings.forEach((finding) => {
      output += `  • ${finding}\n`;
    });
    output += '\n';
  }

  output += `--- Flow-by-Flow Analysis ---\n\n`;

  for (const flow of report.flows) {
    output += `### ${flow.flowName} (${flow.overallImpact.toUpperCase()} Impact)\n`;
    output += `${flow.summary}\n\n`;

    // Show high and medium impact metrics
    const significantMetrics = flow.metrics.filter(
      (m) => m.impact === 'high' || m.impact === 'medium',
    );

    if (significantMetrics.length > 0) {
      output += `Significant Changes:\n`;
      for (const metric of significantMetrics) {
        const arrow =
          metric.improvement === 'better'
            ? '↓'
            : metric.improvement === 'worse'
              ? '↑'
              : '→';
        output += `  ${arrow} ${metric.metric}: ${metric.before.toFixed(2)} → ${metric.after.toFixed(2)} (${metric.changePercent > 0 ? '+' : ''}${metric.changePercent.toFixed(1)}%)\n`;
        output += `    ${metric.explanation}\n`;
      }
      output += '\n';
    }

    if (flow.recommendations.length > 0) {
      output += `Recommendations:\n`;
      flow.recommendations.forEach((rec) => {
        output += `  • ${rec}\n`;
      });
      output += '\n';
    }
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
