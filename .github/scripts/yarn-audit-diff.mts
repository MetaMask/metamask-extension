import { execFileSync, spawnSync } from 'child_process';
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

/** Parse the PR number from GITHUB_REF, or null if not a PR event. */
function getPrNumber(): string | null {
  const ref = process.env.GITHUB_REF; // refs/pull/NNN/merge
  if (!ref) {
    return null;
  }
  const match = ref.match(/^refs\/pull\/(\d+)\/merge$/);
  return match ? match[1] : null;
}

/**
 * Returns true when the current PR changes yarn.lock (i.e. modifies
 * dependencies). Queries the GitHub PR files API so it works regardless
 * of checkout depth.
 *
 * On non-PR events (push, schedule) this always returns true so the
 * caller never suppresses a failure for mainline triggers.
 */
function prChangesYarnLock(): boolean {
  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = getPrNumber();
  if (!repo || !prNumber) {
    // Not a PR (or missing context) — treat as deps-changed.
    return true;
  }

  try {
    // --paginate applies jq per page, so each page emits a number.
    // Sum them: if any page found yarn.lock the total will be > 0.
    const raw = ghApi(
      `repos/${repo}/pulls/${prNumber}/files?per_page=100`,
      { paginate: true, jq: '[.[].filename] | map(select(. == "yarn.lock")) | length' },
    ).trim();
    const changed = raw.split(/\s+/).reduce((sum, n) => sum + Number(n), 0) > 0;
    console.log(
      changed
        ? 'PR changes yarn.lock — dependency change detected.'
        : 'PR does not change yarn.lock.',
    );
    return changed;
  } catch (error) {
    console.log(`Failed to query PR files: ${error}`);
    // Safe default — treat as deps-changed.
    return true;
  }
}

/**
 * Given a list of advisories, check whether the PR's yarn.lock diff actually
 * touches any of the vulnerable packages. Returns true if we can confirm at
 * least one advisory package was changed, or if we can't determine (safe
 * fallback).
 *
 * This allows us to distinguish:
 *   - yarn.lock changed AND advisory package touched → genuinely introduced
 *   - yarn.lock changed but advisory package NOT touched → ambient CVE
 *
 * Uses the full PR diff (Accept: application/vnd.github.diff) instead of
 * the files-API patch field, which is truncated for diffs > ~300 lines.
 */
function prChangesAdvisoryPackages(advisories: ParsedAdvisory[]): boolean {
  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = getPrNumber();
  if (!repo || !prNumber || advisories.length === 0) {
    return true; // safe fallback
  }

  // Collect the set of module names we care about.
  const advisoryModules = new Set(advisories.map((a) => a.moduleName));

  try {
    // Fetch the full (untruncated) unified diff for this PR.
    const fullDiff = execFileSync(
      'gh',
      [
        'api',
        `repos/${repo}/pulls/${prNumber}`,
        '-H',
        'Accept: application/vnd.github.diff',
      ],
      { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 },
    );

    // Extract just the yarn.lock section from the full diff.
    // The section starts with a line "diff --git a/yarn.lock b/yarn.lock"
    // and ends at the next "diff --git" line (or EOF).
    // Use a regex to match only at the start of a line — a plain indexOf
    // could match the string inside another file's diff (e.g. this script
    // itself contains that string as a literal).
    const headerRe = /^diff --git a\/yarn\.lock b\/yarn\.lock/m;
    const headerMatch = headerRe.exec(fullDiff);
    if (!headerMatch) {
      console.log(
        'yarn.lock section not found in PR diff — assuming packages changed.',
      );
      return true;
    }
    const yarnLockStart = headerMatch.index;
    const nextDiff = fullDiff.indexOf('\ndiff --git ', yarnLockStart + 1);
    const yarnLockDiff =
      nextDiff === -1
        ? fullDiff.slice(yarnLockStart)
        : fullDiff.slice(yarnLockStart, nextDiff);

    // Extract package names from changed lines in the yarn.lock diff.
    // Two patterns to catch:
    //   1. Header lines:     +"package@npm:^1.0.0":  (package added/removed)
    //   2. Resolution lines: +  resolution: "package@npm:1.0.0"  (version changed)
    // When a package is merely updated (same version spec, new resolution),
    // only the indented version/resolution/checksum lines are +/- lines —
    // the header is a context line and won't have a +/- prefix.
    const patterns: RegExp[] = [
      /^[+-]"(.+?)@npm:/gm,                          // header lines
      /^[+-]\s+resolution:\s+"(.+?)@npm:/gm,         // resolution lines
    ];
    const changedPackages = new Set<string>();
    for (const pattern of patterns) {
      let m: RegExpExecArray | null;
      while ((m = pattern.exec(yarnLockDiff)) !== null) {
        changedPackages.add(m[1]);
      }
    }

    if (changedPackages.size === 0) {
      console.log(
        'Could not parse any package names from yarn.lock diff — assuming packages changed.',
      );
      return true;
    }

    console.log(
      `Packages changed in yarn.lock: ${[...changedPackages].join(', ')}`,
    );
    console.log(`Advisory packages: ${[...advisoryModules].join(', ')}`);

    const overlap = [...advisoryModules].filter((mod) =>
      changedPackages.has(mod),
    );

    if (overlap.length > 0) {
      console.log(`PR changes advisory package(s): ${overlap.join(', ')}`);
      return true;
    }

    console.log(
      'PR changes yarn.lock but does NOT touch any advisory packages — ambient CVE.',
    );
    return false;
  } catch (error) {
    console.log(`Failed to parse yarn.lock diff: ${error}`);
    return true; // safe fallback
  }
}

// ---------------------------------------------------------------------------
// Baseline refresh (PR-triggered, best-effort)
// ---------------------------------------------------------------------------

/**
 * Re-run the health-checks job from the baseline run (already found by the
 * workflow). This refreshes the audit baseline so subsequent PRs aren't
 * blocked by ambient CVEs published after the last push-to-main.
 *
 * Best-effort: failures are logged but never fail the PR check.
 * Requires `actions: write` permission on GITHUB_TOKEN.
 *
 * @returns The URL of the re-run on success, or null if skipped/failed.
 */
function triggerBaselineRefresh(): string | null {
  const repo = process.env.GITHUB_REPOSITORY;
  const serverUrl = process.env.GITHUB_SERVER_URL ?? 'https://github.com';
  if (!repo) {
    console.log(
      'GITHUB_REPOSITORY not set — skipping baseline refresh trigger.',
    );
    return null;
  }

  try {
    // Find a completed Main workflow run on main whose health-checks job
    // we can re-run. We try BASELINE_RUN_ID first (the run our baseline
    // came from), then fall back to the most recent completed run. This
    // handles the common case where BASELINE_RUN_ID is still in progress
    // because other jobs (lint, build, tests) take ~40 min while
    // health-checks finishes in ~6 min.
    const baselineRunId = process.env.BASELINE_RUN_ID;
    const candidateRunIds: string[] = [];

    if (baselineRunId) {
      candidateRunIds.push(baselineRunId);
    }

    // Also find the most recent completed Main run as a fallback.
    // Use per_page=25 so we don't miss the target in busy repos where
    // other workflows (dependabot, scheduled, etc.) push it out of range.
    const completedRunId = ghApi(
      `repos/${repo}/actions/runs?branch=main&status=completed&per_page=25`,
      {
        jq: '[.workflow_runs[] | select(.name == "Main")] | first | .id // empty',
      },
    ).trim();

    if (completedRunId && completedRunId !== baselineRunId) {
      candidateRunIds.push(completedRunId);
    }

    // Track the first in-progress run we find — if we can't trigger a new
    // refresh, we'll return this URL so the caller knows one is underway.
    let inProgressUrl: string | null = null;

    for (const candidateId of candidateRunIds) {
      const runUrl = `${serverUrl}/${repo}/actions/runs/${candidateId}`;

      // The re-run API requires the run to be completed.
      const runStatus = ghApi(
        `repos/${repo}/actions/runs/${candidateId}`,
        { jq: '.status' },
      ).trim();

      if (runStatus !== 'completed') {
        console.log(
          `Run ${candidateId} is ${runStatus} — trying next candidate.`,
        );
        inProgressUrl ??= runUrl;
        continue;
      }

      // Find the repository-health-checks job in this run.
      // Use `first` to avoid concatenated JSON when multiple jobs match.
      const raw = ghApi(
        `repos/${repo}/actions/runs/${candidateId}/jobs?per_page=50`,
        { jq: '[.jobs[] | select(.name | test("health"; "i")) | {id, status}] | first' },
      ).trim();

      if (!raw) {
        console.log(
          `Health-checks job not found in run ${candidateId} — trying next candidate.`,
        );
        continue;
      }

      const { id: jobId, status } = JSON.parse(raw) as {
        id: number;
        status: string;
      };

      // If another PR already re-ran this job, don't pile on.
      if (status === 'queued' || status === 'in_progress') {
        console.log(
          `Baseline refresh already ${status.replace('_', ' ')} (job ${jobId}) — skipping.`,
        );
        console.log(`  → ${runUrl}`);
        return runUrl;
      }

      // Re-run just that job — it will re-audit and upload a fresh baseline.
      try {
        ghApi(`repos/${repo}/actions/jobs/${jobId}/rerun`, { method: 'POST' });
      } catch (rerunError) {
        const msg = rerunError instanceof Error ? rerunError.message : String(rerunError);
        if (msg.includes('409') || msg.includes('Conflict')) {
          // Two PRs tried to re-run the same job simultaneously — harmless.
          // The other PR's re-run is underway, so return the URL so the
          // caller still adds the retry label.
          console.log(`Baseline refresh already triggered by another PR (409 Conflict).`);
          console.log(`  → ${runUrl}`);
          return runUrl;
        }
        throw rerunError;
      }
      console.log(
        `Triggered baseline refresh: re-running job ${jobId} from run ${candidateId}`,
      );
      console.log(`  → ${runUrl}`);
      return runUrl;
    }

    if (inProgressUrl) {
      console.log(
        'A baseline refresh is already in progress — no additional re-run needed.',
      );
      console.log(`  → ${inProgressUrl}`);
      return inProgressUrl;
    }

    console.log('No Main run found to re-run — skipping baseline refresh.');
    return null;
  } catch (error) {
    // Best-effort — never fail the PR because the refresh trigger failed.
    const msg = error instanceof Error ? error.message : String(error);
    console.log(`Failed to trigger baseline refresh: ${msg}`);
    return null;
  }
}

/**
 * Add the `retry-ci` label to the current PR so the triage system
 * auto-retries after the baseline refresh completes.
 *
 * Best-effort: failures are logged but never fail the PR check.
 * Requires `pull-requests: write` permission on GITHUB_TOKEN.
 */
function addRetryLabel(): void {
  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = getPrNumber();
  if (!repo || !prNumber) {
    return;
  }

  try {
    ghApi(`repos/${repo}/issues/${prNumber}/labels`, {
      method: 'POST',
      body: { labels: ['retry-ci'] },
    });
    console.log(`Added retry-ci label to PR #${prNumber}`);
  } catch (error) {
    console.log(`Failed to add retry-ci label: ${error}`);
  }
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

  // ------------------------------------------------------------------
  // Diff: advisories present in current but not in baseline (by GHSA ID)
  // ------------------------------------------------------------------
  // baseline may be [] if main has zero advisories — that's legitimate;
  // every current advisory is genuinely new in that case.
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
  ];

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

  // ----------------------------------------------------------------
  // Auto-healing flow for ambient CVEs on PRs
  // ----------------------------------------------------------------
  // When a new CVE is published between the last push-to-main and a PR
  // run, the advisory appears "new" even though the PR didn't introduce
  // it. This is an "ambient CVE." The auto-healing flow:
  //
  //   1. Detect: compare current audit against the baseline artifact
  //      from the most recent push-to-main run.
  //   2. Classify: check whether the PR's yarn.lock diff actually
  //      touches the advisory packages (two-level check below).
  //   3. Refresh: re-run the health-checks job on main so it uploads a
  //      fresh baseline that includes the new advisory.
  //   4. Retry: add the `retry-ci` label so the triage system
  //      automatically re-runs this PR's health-checks job after the
  //      refresh completes. On the retry, the advisory is already in
  //      the baseline, so it no longer appears "new" and the check passes.
  //
  // Cross-repo PRs skip steps 3-4 because the token is read-only.
  // On push-to-main, the step always succeeds (baseline must be uploaded).
  //
  // Classification outcomes:
  //   1. PR doesn't touch yarn.lock → ambient CVE, pass
  //   2. PR touches yarn.lock but NOT the advisory packages → ambient, pass
  //   3. PR touches yarn.lock AND the advisory packages → fail
  if (!isMainlineTrigger && blockingAdvisories.length > 0) {
    // Trigger a baseline refresh so subsequent runs aren't blocked by
    // ambient CVEs. Only possible on same-repo PRs with actions:write.
    let refreshUrl: string | null = null;
    if (process.env.IS_CROSS_REPO_PR !== 'true') {
      refreshUrl = triggerBaselineRefresh();
    }

    // Two-level check: does this PR change yarn.lock, and if so, does it
    // touch any of the packages flagged by the advisories?
    const touchesYarnLock = prChangesYarnLock();
    const touchesAdvisoryPkgs =
      touchesYarnLock && prChangesAdvisoryPackages(blockingAdvisories);

    if (touchesAdvisoryPkgs) {
      process.exitCode = 1;

      // Rewrite summary — PR changed a package that has a CVE
      diffSummaryLines[1] =
        `### yarn audit: **FAILED** — ${newAdvisories.length} new advisor${newAdvisories.length === 1 ? 'y' : 'ies'}`;
      diffSummaryLines[3] = refreshUrl
        ? 'New advisories were found and this PR changes a package affected by a CVE. ' +
          'If the advisories are unrelated to your changes, this check will auto-retry ' +
          'after the baseline refresh completes (~2 min).' +
          ' Run `yarn audit` locally to check whether these come from your dependency changes.'
        : 'New advisories were found and this PR changes a package affected by a CVE. ' +
          'Run `yarn audit` locally to check whether these come from your dependency changes.';
      if (refreshUrl) {
        diffSummaryLines.push(
          `> **Baseline refresh triggered** — [view run](${refreshUrl})`,
          '',
        );
      }

      githubAnnotate(
        'warning',
        refreshUrl
          ? 'New advisories found and this PR changes an affected package. ' +
            'If the advisories are unrelated to your changes, re-run this check ' +
            `after the baseline refresh completes (~2 min). Refresh: ${refreshUrl}`
          : 'New advisories found and this PR changes a package affected by a CVE. ' +
            'Run `yarn audit` locally to check whether these come from your dependency changes.',
      );

      // Add retry-ci label so triage auto-retries after the baseline refresh.
      // Only when a refresh was actually triggered — otherwise the retry
      // would fail identically (no fresh baseline to diff against).
      if (refreshUrl) {
        addRetryLabel();
      }
    } else {
      // Ambient CVEs: either yarn.lock wasn't touched, or it was touched
      // but the advisory packages themselves weren't changed.
      const reason = touchesYarnLock
        ? 'although this PR changes `yarn.lock`, it does not touch the affected packages'
        : 'this PR does not change `yarn.lock`';
      diffSummaryLines[1] =
        `### yarn audit: **passed** (ambient) — ${blockingAdvisories.length} pre-existing advisor${blockingAdvisories.length === 1 ? 'y' : 'ies'}`;
      diffSummaryLines[3] =
        `New advisories were detected compared to the baseline, but ${reason}` +
        ' — these are ambient CVEs, not introduced by this PR.';
      if (refreshUrl) {
        diffSummaryLines.push(
          `> **Baseline refresh triggered** — [view run](${refreshUrl}). ` +
            'Subsequent PRs will diff against the updated baseline.',
          '',
        );
      }

      githubAnnotate(
        'warning',
        `${blockingAdvisories.length} ambient advisor${blockingAdvisories.length === 1 ? 'y' : 'ies'} found (not introduced by this PR).` +
          (refreshUrl ? ` Baseline refresh: ${refreshUrl}` : ''),
      );
    }
  }

  // For mainline and genuine PR-introduced CVEs, add the local reproduce hint.
  if (isMainlineTrigger || blockingAdvisories.length === 0) {
    diffSummaryLines.push('Run `yarn audit` locally to reproduce.', '');
  }

  writeStepSummary(diffSummaryLines.join('\n'));
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
