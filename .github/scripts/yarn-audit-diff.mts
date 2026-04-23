import { spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { IncomingWebhook } from '@slack/webhook';
import {
  AUDIT_BASELINE_FILE,
  AUDIT_CURRENT_FILE,
  AUDIT_DETAILS_FILE,
  BLOCKING_SEVERITIES,
  type ParsedAdvisory,
  extractNativeBlocks,
  formatAdvisoryTree,
  githubAnnotate,
  readAdvisories,
  stripAnsi,
  writeStepSummary,
} from './shared/audit-utils.mts';
import { ghApi } from './shared/gh-api.mts';
import { getGitHubToken } from './shared/github-token.mts';

// ---------------------------------------------------------------------------
// Pipeline contract
// ---------------------------------------------------------------------------
// This script is step 2 of the audit pipeline:
//   1. yarn-audit-and-triage.mts  → writes AUDIT_CURRENT_FILE & AUDIT_DETAILS_FILE
//   2. yarn-audit-diff.mts (this) → reads both, compares current vs baseline
//
// Runs on PRs (blocks merge for production moderate+ advisories),
// push-to-main (reports ALL new advisories via Slack + GitHub issue),
// and schedule (cron: detects newly published CVEs overnight).
// The `finally` block appends the details file (written by step 1) to the
// step summary after the diff verdict.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Max advisories to list per section before truncating. */
const MAX_LISTED = 20;

/** Max characters for the native tree in a GitHub issue body. */
const MAX_ISSUE_BODY_TREE = 50_000;

const BRANCH = process.env.BRANCH ?? 'main';
const IS_MAIN = BRANCH === 'main';

function sevLabel(a: ParsedAdvisory): string {
  return (a.effectiveSeverity ?? 'unknown').toUpperCase();
}

// ---------------------------------------------------------------------------
// GitHub issue creation (push-to-main only)
// ---------------------------------------------------------------------------

/**
 * Create (or find existing) tracking issue for new advisories detected on
 * push-to-main.  Uses a content-hash in the title so the same set of
 * advisories never opens a duplicate issue.
 */
function maybeCreateIssue(
  advisories: ParsedAdvisory[],
  blockingAdvisories: ParsedAdvisory[],
  treeText: string,
): { url: string; isNew: boolean } | null {
  if (!IS_MAIN || advisories.length === 0) {
    return null;
  }

  const full = process.env.GITHUB_REPOSITORY;
  if (!full) {
    githubAnnotate(
      'warning',
      'GITHUB_REPOSITORY not set — skipping issue creation.',
    );
    return null;
  }
  const [owner, repo] = full.split('/');
  if (!owner || !repo) return null;

  let token: string;
  try {
    token = getGitHubToken();
  } catch {
    githubAnnotate(
      'warning',
      'No GitHub token available — skipping issue creation.',
    );
    return null;
  }

  // Deterministic hash so we don't open duplicates for the same advisory set.
  const contentKey = createHash('sha256')
    .update(
      JSON.stringify(
        advisories
          .map((a) => a.id)
          .filter((id): id is number => id !== null)
          .sort((a, b) => a - b),
      ),
    )
    .digest('hex')
    .slice(0, 10);

  const title = `Yarn Audit: new advisories on main (${contentKey})`;

  // Search for existing issue with same title.
  try {
    const q = `repo:${owner}/${repo} type:issue in:title "${title}"`;
    const raw = ghApi(
      `/search/issues?q=${encodeURIComponent(q)}`,
      undefined,
      token,
    );
    const json = JSON.parse(raw) as {
      items?: Array<{ number?: number; title?: string }>;
    };
    const match = json.items?.find((item) => item.title === title);
    if (typeof match?.number === 'number') {
      const url = `https://github.com/${owner}/${repo}/issues/${match.number}`;
      githubAnnotate('notice', `Tracking issue already exists: ${url}`);
      return { url, isNew: false };
    }
  } catch {
    // Search failed — proceed to create (worst case: a duplicate).
  }

  const runId = process.env.GITHUB_RUN_ID ?? '';
  const runUrl = `https://github.com/${owner}/${repo}/actions/runs/${runId}`;
  const blockingCount = blockingAdvisories.length;

  const bodyLines: string[] = [
    `**${advisories.length}** new advisor${advisories.length === 1 ? 'y' : 'ies'} detected on push to \`${BRANCH}\` (${blockingCount} release-blocking).`,
    '',
    `CI run: ${runUrl}`,
    '',
  ];

  if (blockingAdvisories.length > 0) {
    bodyLines.push('## Release-blocking (production, moderate+)');
    bodyLines.push('');
    for (const a of blockingAdvisories) {
      bodyLines.push(
        `- **${a.moduleName}** (${a.effectiveSeverity}) — ${a.title}`,
      );
      bodyLines.push(`  ${a.url}`);
    }
    bodyLines.push('');
  }

  const informational = advisories.filter(
    (a) => !blockingAdvisories.includes(a),
  );
  if (informational.length > 0) {
    bodyLines.push('## Informational (dev-only or low severity)');
    bodyLines.push('');
    for (const a of informational) {
      const scope = a.affectsProduction ? 'production' : 'dev-only';
      bodyLines.push(
        `- **${a.moduleName}** (${a.effectiveSeverity}, ${scope}) — ${a.title}`,
      );
      bodyLines.push(`  ${a.url}`);
    }
    bodyLines.push('');
  }

  bodyLines.push('<details><summary>Native audit tree</summary>');
  bodyLines.push('');
  bodyLines.push('```');
  if (treeText.length > MAX_ISSUE_BODY_TREE) {
    bodyLines.push(treeText.slice(0, MAX_ISSUE_BODY_TREE));
    bodyLines.push(`\n… (truncated — see CI run for full output)`);
  } else {
    bodyLines.push(treeText);
  }
  bodyLines.push('```');
  bodyLines.push('</details>');

  try {
    const raw = ghApi(
      `/repos/${owner}/${repo}/issues`,
      { method: 'POST', body: { title, body: bodyLines.join('\n') } },
      token,
    );
    const json = JSON.parse(raw) as { number?: number };
    if (typeof json.number === 'number') {
      const url = `https://github.com/${owner}/${repo}/issues/${json.number}`;
      githubAnnotate('notice', `Created tracking issue: ${url}`);
      return { url, isNew: true };
    }
  } catch (error) {
    githubAnnotate(
      'warning',
      `Failed to create tracking issue: ${String(error)}`,
    );
  }
  return null;
}

// ---------------------------------------------------------------------------
// Slack notification (push-to-main only)
// ---------------------------------------------------------------------------

async function postSlackNotification(
  advisories: ParsedAdvisory[],
  blockingAdvisories: ParsedAdvisory[],
  issueUrl: string | null,
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_METAMASK_EXTENSION;
  if (!webhookUrl) {
    console.log(
      'SLACK_WEBHOOK_METAMASK_EXTENSION not set — skipping Slack notification.',
    );
    return;
  }
  if (!IS_MAIN) {
    return;
  }

  const repo = process.env.GITHUB_REPOSITORY ?? 'MetaMask/metamask-extension';
  const runId = process.env.GITHUB_RUN_ID ?? '';
  const runUrl = `https://github.com/${repo}/actions/runs/${runId}`;
  const count = advisories.length;
  const noun = count === 1 ? 'advisory' : 'advisories';
  const blockingCount = blockingAdvisories.length;

  let policyText: string;
  if (blockingCount > 0) {
    const blockNoun = blockingCount === 1 ? 'advisory' : 'advisories';
    policyText =
      `${blockingCount} of ${count} ${blockingCount === 1 ? 'is' : 'are'} release-blocking (production, moderate+). ` +
      `PRs will continue to merge, but releases will be blocked until we resolve ${blockingCount === 1 ? 'this' : 'these'} ${blockNoun}.`;
  } else {
    policyText =
      `None are release-blocking (all dev-only or low severity). ` +
      `PRs and releases are not affected, but these should still be tracked.`;
  }

  const webhook = new IncomingWebhook(webhookUrl);

  // Build advisory sections grouped by blocking / informational.
  const informational = advisories.filter(
    (a) => !blockingAdvisories.includes(a),
  );

  const formatAdvisory = (a: ParsedAdvisory, includeScope: boolean): string => {
    const scope = a.affectsProduction ? 'production' : 'dev-only';
    const meta = includeScope
      ? `${a.effectiveSeverity}, ${scope}`
      : a.effectiveSeverity;
    return `• *${a.moduleName}* (${meta}) — ${a.title}\n  <${a.url}|${a.url.split('/').pop()}>`;
  };

  const sections: Array<{
    type: string;
    text?: { type: string; text: string };
    elements?: Array<{ type: string; text: string }>;
  }> = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          `:warning: *Yarn Audit: ${count} new ${noun}*` +
          ` just hit branch \`${BRANCH}\`` +
          ` on \`${repo}\`\n\n` +
          policyText,
      },
    },
  ];

  if (blockingAdvisories.length > 0) {
    const shown = blockingAdvisories.slice(0, MAX_LISTED);
    const overflow = blockingAdvisories.length - shown.length;
    sections.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          `:red_circle: *Release-blocking* (production, moderate+)\n` +
          shown.map((a) => formatAdvisory(a, false)).join('\n') +
          (overflow > 0 ? `\n_…and ${overflow} more_` : ''),
      },
    });
  }

  if (informational.length > 0) {
    const shown = informational.slice(0, MAX_LISTED);
    const overflow = informational.length - shown.length;
    sections.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          `:large_blue_circle: *Informational* (dev-only or low severity)\n` +
          shown.map((a) => formatAdvisory(a, true)).join('\n') +
          (overflow > 0 ? `\n_…and ${overflow} more_` : ''),
      },
    });
  }

  sections.push({
    type: 'context',
    elements: [
      {
        type: 'mrkdwn',
        text: `<${runUrl}|View CI Run>${issueUrl ? ` · <${issueUrl}|Tracking Issue>` : ''}`,
      },
    ],
  });

  try {
    await webhook.send({ blocks: sections });
    console.log('Slack notification sent.');
  } catch (err) {
    githubAnnotate(
      'warning',
      `Slack notification failed: ${err instanceof Error ? err.message : err}`,
    );
  }
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
  if (baseline === null) {
    // I/O error — should not happen since the workflow only runs this step
    // when the baseline was successfully downloaded.
    console.log(
      '::warning::Baseline file is missing or unreadable; nothing to diff.',
    );
    writeStepSummary(
      `\n> **Audit diff:** Baseline unreadable — skipping diff.\n`,
    );
    return;
  }
  // baseline may be [] if main has zero advisories — that's legitimate;
  // every current advisory is genuinely new in that case.

  // ------------------------------------------------------------------
  // Diff: advisories present in current but not in baseline (by GHSA ID)
  // ------------------------------------------------------------------
  const isMainlineTrigger = IS_MAIN;
  const baselineIds = new Set(
    baseline.map((a) => a.id).filter((id): id is number => id !== null),
  );

  // All advisories whose ID is new (not in the baseline).
  // Note: advisories with null IDs are intentionally excluded — they represent
  // malformed data that cannot be reliably diffed against the baseline.
  const allNewAdvisories = current.filter(
    (a) => a.id !== null && !baselineIds.has(a.id as number),
  );

  // Subset that would block a release: production + moderate+.
  const blockingAdvisories = allNewAdvisories.filter(
    (a) => a.affectsProduction && BLOCKING_SEVERITIES.has(a.effectiveSeverity),
  );

  // On push-to-main and cron we report ALL new advisories (Slack, summary, issue).
  // On PRs we only fail for the blocking subset.
  const newAdvisories = isMainlineTrigger
    ? allNewAdvisories
    : blockingAdvisories;

  if (newAdvisories.length === 0) {
    console.log(
      `No new advisories. Current: ${current.length}, baseline: ${baseline.length}.`,
    );
    writeStepSummary(`\n### yarn audit: **passed** — no new advisories\n`);
    return;
  }

  // New advisories found.
  console.log(
    `Found ${newAdvisories.length} new advisory/advisories not in baseline` +
      (isMainlineTrigger && blockingAdvisories.length !== newAdvisories.length
        ? ` (${blockingAdvisories.length} release-blocking).`
        : '.'),
  );
  for (const a of newAdvisories) {
    const level = blockingAdvisories.includes(a) ? 'error' : 'warning';
    console.log(
      `::${level}::New advisory [${sevLabel(a)}]: ${a.moduleName} — ${a.title} (${a.url})`,
    );
  }

  // Run the native (human-readable) audit on-demand — only when there are
  // new advisories to report. This saves ~6s on the happy path (no new
  // advisories) by not running it in the triage step unconditionally.
  // Strip ANSI color codes — the output may contain them depending on the
  // CI runner's terminal capabilities.
  let treeText: string;
  const nativeResult = spawnSync('yarn npm audit --recursive --all', {
    encoding: 'utf8',
    shell: true,
  });
  const native = `${nativeResult.stdout ?? ''}${nativeResult.stderr ?? ''}`;
  if (native.trim()) {
    const newIds = new Set(
      newAdvisories.map((a) => a.id).filter((id): id is number => id !== null),
    );
    const blocks = extractNativeBlocks(native, newIds).map(stripAnsi);
    treeText =
      blocks.length > 0
        ? blocks.join('\n')
        : newAdvisories.map(formatAdvisoryTree).join('\n\n');
  } else {
    treeText = newAdvisories.map(formatAdvisoryTree).join('\n\n');
  }

  const diffSummaryLines = [
    '',
    `### yarn audit: ${isMainlineTrigger ? '**new advisories on main**' : '**FAILED**'} — ${newAdvisories.length} new advisor${newAdvisories.length === 1 ? 'y' : 'ies'}`,
    '',
    isMainlineTrigger
      ? `${newAdvisories.length} new advisor${newAdvisories.length === 1 ? 'y' : 'ies'} detected on push to main (${blockingAdvisories.length} release-blocking).`
      : 'Your dependency changes introduced new vulnerabilities. If a newer version of the package is available, upgrade to it.',
    '',
    '```',
    treeText,
    '```',
    '',
    'Run `yarn audit` locally to reproduce.',
    '',
  ];
  writeStepSummary(diffSummaryLines.join('\n'));

  // On push-to-main, create a GitHub tracking issue (before Slack so we can link it).
  const issueResult = maybeCreateIssue(
    newAdvisories,
    blockingAdvisories,
    treeText,
  );

  // On push-to-main, send a Slack notification so the team knows immediately.
  // Skip if the issue already existed — that means we already notified for this
  // exact set of advisories on a previous push.
  if (!issueResult || issueResult.isNew) {
    await postSlackNotification(
      newAdvisories,
      blockingAdvisories,
      issueResult?.url ?? null,
    );
  } else {
    console.log(
      `Tracking issue already exists (${issueResult.url}) — skipping duplicate Slack notification.`,
    );
  }

  // On PRs, fail the step only when there are release-blocking advisories.
  // On push-to-main, the step always succeeds (baseline must be uploaded).
  if (!isMainlineTrigger && blockingAdvisories.length > 0) {
    process.exitCode = 1;
  }
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
