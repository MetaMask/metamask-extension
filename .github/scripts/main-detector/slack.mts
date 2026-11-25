import type { AnyBlock } from '@slack/types';
import {
  BREAKDOWN_METRICS,
  BROWSERS,
  DEFAULT_CONFIG,
  VERDICT_METRICS,
  type BatchScores,
  type Browser,
  type Decision,
  type Finding,
} from './score.mts';
import { summarizeShifts, toPercent } from './stats.mts';
import type { PlanInfo } from './report.mts';

export type SlackPayload = {
  // Fallback for notifications and clients without block support.
  text: string;
  blocks: AnyBlock[];
};

export type SlackInput = {
  plan: PlanInfo;
  first: BatchScores;
  second?: BatchScores;
  decision: Decision;
  repository: string;
  runUrl: string;
  author: string;
};

const pct = (value: number) => `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;

const browserName = (browser: Browser) =>
  browser === 'chrome' ? 'Chrome' : 'Firefox';

// The detector runs a single benchmark preset, so every finding is about it.
const SCENARIO =
  'Standard user (default wallet state, not the power user with 30 accounts), loading the home page';

const METRIC_LABELS: Record<string, string> = {
  uiStartup: 'UI Startup',
  load: 'Page load',
  loadScripts: 'Load Scripts',
  setupStore: 'Setup Store',
  firstReactRender: 'First Render',
  longTaskTotalDuration: 'Long tasks (total)',
};

const METRIC_MEANINGS: Record<string, string> = {
  uiStartup: 'time from opening the UI until it is ready',
  load: 'browser load event of the home page',
};

const metricLabel = (metric: string) => METRIC_LABELS[metric] ?? metric;

// Slack mrkdwn reads these three characters as markup, so commit text must not carry them raw.
const escapeSlack = (text: string) =>
  text.replace(/&/gu, '&amp;').replace(/</gu, '&lt;').replace(/>/gu, '&gt;');

function linkPullRequest(subject: string, repository: string): string {
  return subject.replace(
    /\(#(\d+)\)\s*$/u,
    `(<https://github.com/${repository}/pull/$1|#$1>)`,
  );
}

function formatFinding(finding: Finding, scores: BatchScores[]): string {
  const size = Math.abs(finding.pooled.shiftPct).toFixed(1);
  const { medianMs } = DEFAULT_CONFIG.floors[finding.browser][finding.metric];
  const ms = Math.abs((medianMs * finding.pooled.shiftPct) / 100).toFixed(0);
  const jobs = scores
    .flatMap((batch) => batch[finding.browser].logRatios[finding.metric] ?? [])
    .map((ratio) => pct(toPercent(ratio)).replace('%', ''))
    .join(', ');
  const { pooled, first, second } = finding;
  return (
    `• *${browserName(finding.browser)}, ${metricLabel(finding.metric)}* (\`${finding.metric}\`, ${METRIC_MEANINGS[finding.metric] ?? 'see breakdown'}): ${ms} ms ${finding.direction} (${size}%)` +
    ` — pooled ${pct(pooled.shiftPct)} [${pct(pooled.lowerPct)}, ${pct(pooled.upperPct)}],` +
    ` batch 1 ${pct(first.shiftPct)}, batch 2 ${pct(second.shiftPct)}\n` +
    `  per job: ${jobs} %`
  );
}

// A shift this large means the metric measures something else now.
const HUGE_SHIFT_PCT = 100;

const FLAG = ':triangular_flag_on_post:';

function breakdownShifts(browser: Browser, scores: BatchScores[]) {
  return BREAKDOWN_METRICS.flatMap((metric) => {
    const ratios = scores.flatMap(
      (batch) => batch[browser].logRatios[metric] ?? [],
    );
    const summary = summarizeShifts(ratios);
    return summary ? [{ metric, shiftPct: summary.shiftPct }] : [];
  });
}

function formatBreakdown(browser: Browser, scores: BatchScores[]): string {
  const parts = breakdownShifts(browser, scores).map(
    ({ metric, shiftPct }) =>
      `${metricLabel(metric)} ${pct(shiftPct)}${Math.abs(shiftPct) > HUGE_SHIFT_PCT ? ` ${FLAG}` : ''}`,
  );
  return `• *${browserName(browser)}* — ${parts.join(', ')}`;
}

// The rule in ms, per browser and verdict metric, for example "Chrome page load 13.5 ms".
function floorsText(key: 'floorMs' | 'loudMs'): string {
  return BROWSERS.flatMap((browser) =>
    VERDICT_METRICS.map(
      (metric) =>
        `${browserName(browser)} ${metricLabel(metric).toLowerCase()} ${(DEFAULT_CONFIG.floors[browser][metric][key] + 1e-9).toFixed(1)} ms`,
    ),
  ).join(', ');
}

function policyText(plan: PlanInfo, loud: boolean): string {
  if (typeof plan.injectMs === 'number') {
    return `The head build was slowed by ${plan.injectMs} ms on purpose to test the detector. This is not a real change.`;
  }
  if (plan.canary) {
    return 'Head and base are the same build, so this is noise, not a change. Nothing needs fixing in the commit.';
  }
  const size = loud
    ? `At least one metric moved by its large-change size or more (${floorsText('loudMs')})`
    : `At least one metric moved by more than the noise (${floorsText('floorMs')})`;
  return `${size}, and a second batch of runs agreed. PRs and releases are not blocked, but the commit below is worth a look.`;
}

/**
 * Builds the Slack message for a commit that raised a ping, in the style of
 * the yarn audit notification: a headline section, one section per level,
 * then a context line with links.
 *
 * @param input - The detector result and where it ran.
 */
export function buildSlackMessage(input: SlackInput): SlackPayload {
  const { plan, first, second, decision, repository, runUrl, author } = input;
  const loud = decision.ping === 'loud';
  const scores = second ? [first, second] : [first];
  const short = plan.headSha.slice(0, 7);
  const commitUrl = `https://github.com/${repository}/commit/${plan.headSha}`;
  const baseUrl = `https://github.com/${repository}/commit/${plan.baseSha}`;
  const subject = linkPullRequest(escapeSlack(plan.headSubject), repository);

  let headline = 'a performance change';
  if (typeof plan.injectMs === 'number') {
    headline = 'a dry-run change injected into the head build';
  } else if (plan.canary) {
    headline = 'a false alarm on the A/A canary';
  } else if (loud) {
    headline = 'a large performance change';
  }

  const section = (text: string): AnyBlock => ({
    type: 'section',
    text: { type: 'mrkdwn', text },
  });

  const blocks: AnyBlock[] = [
    section(
      `:warning: *Performance detector: ${headline}* just hit branch \`main\` on \`${repository}\`\n\n${policyText(plan, loud)}`,
    ),
    section(
      `:mag: *Commit*\n• <${commitUrl}|${short}> ${subject} — by ${escapeSlack(author)}`,
    ),
  ];

  const jobs = first.chrome.jobsTotal;
  blocks.push(
    section(
      `:test_tube: *What was measured*\n• ${SCENARIO}\n• Benchmark \`startupStandardHome\` in Chrome and Firefox, ${scores.length} batch${scores.length === 1 ? '' : 'es'} of ${jobs} paired jobs per browser, base and head builds alternating on one runner`,
    ),
  );

  const large = decision.findings.filter((f) => f.level === 'loud');
  const small = decision.findings.filter((f) => f.level === 'quiet');
  if (large.length > 0) {
    blocks.push(
      section(
        `:red_circle: *Large change* (${floorsText('loudMs')} or more)\n${large
          .map((f) => formatFinding(f, scores))
          .join('\n')}`,
      ),
    );
  }
  if (small.length > 0) {
    blocks.push(
      section(
        `:large_yellow_circle: *Change* (above the noise)\n${small
          .map((f) => formatFinding(f, scores))
          .join('\n')}`,
      ),
    );
  }

  const browsers = [...new Set(decision.findings.map((f) => f.browser))];
  blocks.push(
    section(
      `:large_blue_circle: *Breakdown* (pooled, for context)\n${browsers
        .map((browser) => formatBreakdown(browser, scores))
        .join('\n')}`,
    ),
  );

  const notes: string[] = [];
  const huge = browsers.some((browser) =>
    breakdownShifts(browser, scores).some(
      ({ shiftPct }) => Math.abs(shiftPct) > HUGE_SHIFT_PCT,
    ),
  );
  if (huge) {
    notes.push(
      `_${FLAG} Moved by more than ${HUGE_SHIFT_PCT}%. The commit probably changed what the metric measures, not how fast it is._`,
    );
  }
  if (decision.findings.some((finding) => finding.direction === 'faster')) {
    notes.push(
      '_A speed-up can also mean the metric stopped timing what it should. Check that the metric still measures the same thing._',
    );
  }
  if (plan.rangeSize > 1) {
    notes.push(
      `_The nearest earlier build is ${plan.rangeSize} commits back, so any of them could be the cause._`,
    );
  }
  if (decision.unmeasured.length > 0) {
    notes.push(
      `_Could not measure: ${decision.unmeasured.map(browserName).join(', ')}._`,
    );
  }
  if (notes.length > 0) {
    blocks.push(section(notes.join('\n')));
  }

  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `<${runUrl}|View CI Run> · <${baseUrl}|Base commit ${plan.baseSha.slice(0, 7)}>`,
      },
    ],
  });

  const summary = decision.findings
    .map(
      (finding) =>
        `${browserName(finding.browser)} ${metricLabel(finding.metric)} (standard user) ${pct(finding.pooled.shiftPct)}`,
    )
    .join(', ');
  return {
    text: `Performance detector: ${headline} at ${short}: ${summary}`,
    blocks,
  };
}
