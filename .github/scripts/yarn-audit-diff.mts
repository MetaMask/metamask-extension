import { readFileSync } from 'fs';
import { IncomingWebhook } from '@slack/webhook';
import {
  AUDIT_BASELINE_FILE,
  AUDIT_CURRENT_FILE,
  AUDIT_DETAILS_FILE,
  type ParsedAdvisory,
  formatAdvisoryTree,
  writeStepSummary,
} from './shared/audit-utils.mts';

// ---------------------------------------------------------------------------
// Pipeline contract
// ---------------------------------------------------------------------------
// This script is step 2 of the audit pipeline:
//   1. yarn-audit-and-triage.mts  → writes AUDIT_CURRENT_FILE & AUDIT_DETAILS_FILE
//   2. yarn-audit-diff.mts (this) → reads both, compares current vs baseline
//
// Runs on both PRs (blocks merge) and push-to-main (sends Slack alert).
// The workflow only invokes this script when a real baseline was downloaded
// from a completed push-to-main run. The `finally` block appends the details
// file (written by step 1) to the step summary after the diff verdict.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readAdvisories(filePath: string): ParsedAdvisory[] | null {
  try {
    const text = readFileSync(filePath, 'utf8').trim();
    if (!text || text === '[]') {
      return [];
    }
    return JSON.parse(text) as ParsedAdvisory[];
  } catch {
    return null;
  }
}

function sevLabel(a: ParsedAdvisory): string {
  return (a.effectiveSeverity ?? 'unknown').toUpperCase();
}

// ---------------------------------------------------------------------------
// Slack notification (push-to-main only)
// ---------------------------------------------------------------------------

async function postSlackNotification(
  advisories: ParsedAdvisory[],
  treeText: string,
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('SLACK_WEBHOOK_URL not set — skipping Slack notification.');
    return;
  }
  if (process.env.GITHUB_EVENT_NAME !== 'push') {
    return;
  }

  const repo = process.env.GITHUB_REPOSITORY ?? 'MetaMask/metamask-extension';
  const runId = process.env.GITHUB_RUN_ID ?? '';
  const branch = process.env.BRANCH ?? 'main';
  const runUrl = `https://github.com/${repo}/actions/runs/${runId}`;
  const count = advisories.length;
  const noun = count === 1 ? 'advisory' : 'advisories';

  const webhook = new IncomingWebhook(webhookUrl);
  await webhook.send({
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `:warning: *Audit: ${count} new ${noun}* — \`${repo}\` (\`${branch}\`)`,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\`\`\`\n${treeText}\n\`\`\``,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: advisories
            .map((a) => `• <${a.url}|${a.moduleName}> — ${a.title}`)
            .join('\n'),
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `<${runUrl}|View CI Run>`,
          },
        ],
      },
    ],
  });
  console.log('Slack notification sent.');
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const current = readAdvisories(AUDIT_CURRENT_FILE);
  if (!current) {
    console.error(
      `Could not read current advisories from: ${AUDIT_CURRENT_FILE}`,
    );
    process.exitCode = 1;
    return;
  }

  const baseline = readAdvisories(AUDIT_BASELINE_FILE);
  if (!baseline || baseline.length === 0) {
    // Should not happen — the workflow only runs this step when the baseline
    // was successfully downloaded. Log a warning and pass through.
    console.log(
      '::warning::Baseline file is empty or missing; nothing to diff.',
    );
    writeStepSummary(`\n> **Audit diff:** Baseline empty — skipping diff.\n`);
    return;
  }

  // ------------------------------------------------------------------
  // Diff: advisories present in current but not in baseline (by GHSA ID)
  // ------------------------------------------------------------------
  const baselineIds = new Set(
    baseline.map((a) => a.id).filter((id): id is number => id !== null),
  );

  const newAdvisories = current.filter(
    (a) => a.id !== null && !baselineIds.has(a.id as number),
  );

  if (newAdvisories.length === 0) {
    console.log(
      `No new advisories. Current: ${current.length}, baseline: ${baseline.length}.`,
    );
    writeStepSummary(`\n### yarn audit: **passed** — no new advisories\n`);
    return;
  }

  // New advisories found — fail the job.
  console.log(
    `Found ${newAdvisories.length} new advisory/advisories not in baseline.`,
  );
  for (const a of newAdvisories) {
    console.log(
      `::error::New advisory [${sevLabel(a)}]: ${a.moduleName} — ${a.title} (${a.url})`,
    );
  }

  const treeText = newAdvisories.map(formatAdvisoryTree).join('\n\n');

  const diffSummaryLines = [
    '',
    `### yarn audit: **FAILED** — ${newAdvisories.length} new advisor${newAdvisories.length === 1 ? 'y' : 'ies'}`,
    '',
    'Your dependency changes introduced new vulnerabilities. If a newer version of the package is available, upgrade to it.',
    '',
    '```',
    treeText,
    '```',
    '',
    'Run `yarn audit` locally to reproduce.',
    '',
  ];
  writeStepSummary(diffSummaryLines.join('\n'));

  // On push-to-main, send a Slack notification so the team knows immediately.
  await postSlackNotification(newAdvisories, treeText);

  process.exitCode = 1;
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
} finally {
  // Append the full advisory details written by yarn-audit-and-triage.mts,
  // so they appear after the diff verdict in the step summary.
  try {
    const details = readFileSync(AUDIT_DETAILS_FILE, 'utf8');
    writeStepSummary(`\n${details}`);
  } catch {
    // File may not exist (e.g. triage step failed before writing it).
  }
}
