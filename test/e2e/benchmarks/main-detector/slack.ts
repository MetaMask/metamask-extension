import type { AnyBlock } from '@slack/types';
import {
  BREAKDOWN_METRICS,
  type BatchScores,
  type Browser,
  type Decision,
  type Finding,
} from './score';
import { summarizeShifts } from './stats';
import type { PlanInfo } from './report';

export type SlackPayload = {
  // Fallback for notifications and clients without block support.
  text: string;
  attachments: { color: string; blocks: AnyBlock[] }[];
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

const LOUD_COLOR = 'danger';
const QUIET_COLOR = 'warning';

const pct = (value: number, digits = 1) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(digits)}%`;

const toPercent = (logRatio: number) => (Math.exp(logRatio) - 1) * 100;

const browserName = (browser: Browser) =>
  browser === 'chrome' ? 'Chrome' : 'Firefox';

function linkPullRequest(subject: string, repository: string): string {
  return subject.replace(
    /\(#(\d+)\)\s*$/u,
    `(<https://github.com/${repository}/pull/$1|#$1>)`,
  );
}

function findingLines(finding: Finding, scores: BatchScores[]): string[] {
  const speed = finding.direction === 'slower' ? 'slower' : 'faster';
  const size = Math.abs(finding.pooled.shiftPct).toFixed(1);
  const jobs = scores
    .flatMap((batch) => batch[finding.browser].logRatios[finding.metric] ?? [])
    .map((ratio) => pct(toPercent(ratio)).replace('%', ''));
  return [
    `*${browserName(finding.browser)} ${finding.metric}: ${size}% ${speed}* (${finding.level})`,
    `Pooled ${pct(finding.pooled.shiftPct)} [${pct(finding.pooled.lowerPct)}, ${pct(finding.pooled.upperPct)}], batch 1 ${pct(finding.first.shiftPct)}, batch 2 ${pct(finding.second.shiftPct)}`,
    `Per job (${jobs.length}): ${jobs.join(', ')} %`,
  ];
}

function breakdownLine(browser: Browser, scores: BatchScores[]): string {
  const parts = BREAKDOWN_METRICS.flatMap((metric) => {
    const ratios = scores.flatMap(
      (batch) => batch[browser].logRatios[metric] ?? [],
    );
    const summary = summarizeShifts(ratios);
    return summary ? [`${metric} ${pct(summary.shiftPct)}`] : [];
  });
  return `${browserName(browser)} breakdown (pooled): ${parts.join(', ')}`;
}

/**
 * Builds the Slack message for a commit that raised a ping.
 *
 * @param input - The detector result and where it ran.
 * @returns A Slack payload; quiet and loud pings differ in header and color.
 */
export function buildSlackMessage(input: SlackInput): SlackPayload {
  const { plan, first, second, decision, repository, runUrl, author } = input;
  const loud = decision.ping === 'loud';
  let title = loud
    ? 'Large performance change on main'
    : 'Performance change on main';
  if (plan.canary) {
    title = 'Detector false alarm: the A/A canary fired';
  }
  const scores = second ? [first, second] : [first];
  const short = plan.headSha.slice(0, 7);
  const commitUrl = `https://github.com/${repository}/commit/${plan.headSha}`;
  const subject = linkPullRequest(plan.headSubject, repository);

  const blocks: AnyBlock[] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: title,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `<${commitUrl}|${short}> ${subject}\nby ${author}`,
      },
    },
  ];

  for (const finding of decision.findings) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: findingLines(finding, scores).join('\n'),
      },
    });
  }

  const browsers = [...new Set(decision.findings.map((f) => f.browser))];
  blocks.push({
    type: 'context',
    elements: browsers.map((browser) => ({
      type: 'mrkdwn' as const,
      text: breakdownLine(browser, scores),
    })),
  });

  if (decision.findings.some((finding) => finding.direction === 'faster')) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '_A speed-up can also mean the metric stopped timing what it should. Check that the metric still measures the same thing._',
      },
    });
  }

  const notes: string[] = [];
  if (plan.canary) {
    notes.push(
      'Head and base are the same build, so this is noise, not a change.',
    );
  }
  if (plan.rangeSize > 1) {
    notes.push(
      `The nearest earlier build is ${plan.rangeSize} commits back, so any of them could be the cause.`,
    );
  }
  if (decision.unmeasured.length > 0) {
    notes.push(
      `Could not measure: ${decision.unmeasured.map(browserName).join(', ')}.`,
    );
  }
  notes.push(
    `<${runUrl}|Detector run> | base <https://github.com/${repository}/commit/${plan.baseSha}|${plan.baseSha.slice(0, 7)}> | not a merge gate`,
  );
  blocks.push({
    type: 'context',
    elements: notes.map((text) => ({ type: 'mrkdwn' as const, text })),
  });

  const headline = decision.findings
    .map(
      (finding) =>
        `${browserName(finding.browser)} ${finding.metric} ${pct(finding.pooled.shiftPct)}`,
    )
    .join(', ');
  return {
    text: `${title} at ${short}: ${headline}`,
    attachments: [{ color: loud ? LOUD_COLOR : QUIET_COLOR, blocks }],
  };
}
