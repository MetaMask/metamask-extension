import { execFileSync, spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { readFileSync } from 'fs';
import { IncomingWebhook } from '@slack/webhook';
import {
  AUDIT_BASELINE_FILE,
  AUDIT_CURRENT_FILE,
  AUDIT_DETAILS_FILE,
  type ParsedAdvisory,
  advisoryIdentityKey,
  diffAdvisories,
  formatAdvisoryTreeText,
  githubAnnotate,
  readAdvisories,
  uniqueAdvisoriesByIdentity,
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
// push-to-main (reports new or newly blocking advisories via Slack + GitHub issue),
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

function captureNativeAuditAll(): string {
  const nativeResult = spawnSync('yarn npm audit --recursive --all', {
    encoding: 'utf8',
    shell: true,
  });
  return `${nativeResult.stdout ?? ''}${nativeResult.stderr ?? ''}`;
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
    const raw = ghApi(`repos/${repo}/pulls/${prNumber}/files?per_page=100`, {
      paginate: true,
      jq: '[.[].filename] | map(select(. == "yarn.lock")) | length',
    }).trim();
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

type PrDependencyDiff = {
  changedPackages: Set<string> | null;
  reason: string;
};

type AdvisoryPartition = {
  actionableAdvisories: ParsedAdvisory[];
  ambientAdvisories: ParsedAdvisory[];
  reason: string;
  actionableMatches: Map<string, string[]>;
};

function extractPackageNameFromDescriptor(descriptor: string): string | null {
  const match = descriptor
    .trim()
    .match(
      /^"?((?:@[^/@\s",:]+\/)?[^@"\s,:]+)@(?:npm|patch|workspace|file|portal|link|exec|git|github|virtual):/iu,
    );

  return match?.[1] ?? null;
}

function extractPackageNamesFromYarnLockLine(line: string): string[] {
  const packageNames = new Set<string>();
  const descriptorPattern =
    /"?((?:@[^/@\s",:]+\/)?[^@"\s,:]+)@(?:npm|patch|workspace|file|portal|link|exec|git|github|virtual):/giu;
  let match: RegExpExecArray | null;

  while ((match = descriptorPattern.exec(line)) !== null) {
    packageNames.add(match[1]);
  }

  return [...packageNames];
}

function extractDependencyNameFromYarnLockLine(line: string): string | null {
  const match = line.match(/^\s+((?:@[^/@\s",:]+\/)?[^@"\s,:]+):\s/u);

  return match?.[1] ?? null;
}

function parseChangedPackagesFromYarnLockDiff(
  yarnLockDiff: string,
): Set<string> | null {
  const changedPackages = new Set<string>();
  let currentPackages = new Set<string>();
  let dependencyBlockIndent: number | null = null;

  for (const line of yarnLockDiff.split(/\r?\n/u)) {
    if (line.startsWith('--- ') || line.startsWith('+++ ')) {
      continue;
    }

    const marker = line[0];
    if (marker !== ' ' && marker !== '+' && marker !== '-') {
      continue;
    }

    const content = line.slice(1);
    const trimmed = content.trim();
    const indent = content.length - content.trimStart().length;

    if (
      dependencyBlockIndent !== null &&
      trimmed !== '' &&
      indent <= dependencyBlockIndent
    ) {
      dependencyBlockIndent = null;
    }

    if (trimmed === '__metadata:') {
      currentPackages = new Set<string>();
      dependencyBlockIndent = null;
      continue;
    }

    if (
      /^(?:dependencies|peerDependencies|optionalDependencies):$/u.test(trimmed)
    ) {
      dependencyBlockIndent = indent;
      continue;
    }

    const packageNames = extractPackageNamesFromYarnLockLine(content);
    if (packageNames.length > 0) {
      currentPackages = new Set(packageNames);
      if (marker === '+' || marker === '-') {
        for (const packageName of packageNames) {
          changedPackages.add(packageName);
        }
      }
      continue;
    }

    if (dependencyBlockIndent !== null && indent > dependencyBlockIndent) {
      const dependencyName = extractDependencyNameFromYarnLockLine(content);
      if (dependencyName && (marker === '+' || marker === '-')) {
        changedPackages.add(dependencyName);
      }
    }

    if (marker !== '+' && marker !== '-') {
      continue;
    }

    if (
      trimmed === '' ||
      trimmed.startsWith('#') ||
      /^(?:version|cacheKey):\s/u.test(trimmed)
    ) {
      continue;
    }

    if (currentPackages.size > 0) {
      for (const packageName of currentPackages) {
        changedPackages.add(packageName);
      }
      continue;
    }

    return null;
  }

  return changedPackages;
}

function getPrChangedYarnLockPackages(): PrDependencyDiff {
  const repo = process.env.GITHUB_REPOSITORY;
  const prNumber = getPrNumber();
  if (!repo || !prNumber) {
    return {
      changedPackages: null,
      reason: 'missing PR context',
    };
  }

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
      return {
        changedPackages: null,
        reason: 'missing yarn.lock diff',
      };
    }
    const yarnLockStart = headerMatch.index;
    const nextDiff = fullDiff.indexOf('\ndiff --git ', yarnLockStart + 1);
    const yarnLockDiff =
      nextDiff === -1
        ? fullDiff.slice(yarnLockStart)
        : fullDiff.slice(yarnLockStart, nextDiff);

    const changedPackages = parseChangedPackagesFromYarnLockDiff(yarnLockDiff);

    if (changedPackages === null) {
      console.log(
        'Could not parse any package names from yarn.lock diff — assuming packages changed.',
      );
      return {
        changedPackages: null,
        reason: 'unparsed yarn.lock diff',
      };
    }

    if (changedPackages.size === 0) {
      console.log(
        'yarn.lock diff only changes metadata — no packages changed.',
      );
      return {
        changedPackages,
        reason: 'the `yarn.lock` diff only changes metadata',
      };
    }

    console.log(
      `Packages changed in yarn.lock: ${[...changedPackages].join(', ')}`,
    );
    return {
      changedPackages,
      reason: `${changedPackages.size} package/path entr${changedPackages.size === 1 ? 'y' : 'ies'} changed in \`yarn.lock\``,
    };
  } catch (error) {
    console.log(`Failed to parse yarn.lock diff: ${error}`);
    return {
      changedPackages: null,
      reason: 'failed to inspect yarn.lock diff',
    };
  }
}

function getAdvisoryRelevantPackages(advisory: ParsedAdvisory): Set<string> {
  const relevantPackages = new Set<string>([advisory.moduleName]);

  for (const dependent of advisory.dependents) {
    const packageName = extractPackageNameFromDescriptor(dependent);
    if (packageName) {
      relevantPackages.add(packageName);
    }
  }

  return relevantPackages;
}

function partitionAdvisoriesByDependencyDiff(
  advisories: ParsedAdvisory[],
  dependencyDiff: PrDependencyDiff,
): AdvisoryPartition {
  if (dependencyDiff.changedPackages === null) {
    return {
      actionableAdvisories: advisories,
      ambientAdvisories: [],
      reason: `${dependencyDiff.reason}; treating advisories as actionable`,
      actionableMatches: new Map(
        advisories.map((advisory) => [
          advisoryIdentityKey(advisory),
          [advisory.moduleName],
        ]),
      ),
    };
  }

  if (dependencyDiff.changedPackages.size === 0) {
    return {
      actionableAdvisories: [],
      ambientAdvisories: advisories,
      reason: dependencyDiff.reason,
      actionableMatches: new Map(),
    };
  }

  const actionableAdvisories: ParsedAdvisory[] = [];
  const ambientAdvisories: ParsedAdvisory[] = [];
  const actionableMatches = new Map<string, string[]>();

  for (const advisory of advisories) {
    const relevantPackages = getAdvisoryRelevantPackages(advisory);
    const matchedPackages = [...relevantPackages]
      .filter((packageName) => dependencyDiff.changedPackages?.has(packageName))
      .sort();

    if (matchedPackages.length > 0) {
      actionableAdvisories.push(advisory);
      actionableMatches.set(advisoryIdentityKey(advisory), matchedPackages);
    } else {
      ambientAdvisories.push(advisory);
    }
  }

  if (actionableAdvisories.length === 0) {
    return {
      actionableAdvisories,
      ambientAdvisories,
      reason: `the changed packages do not include advisory packages or direct dependents (${dependencyDiff.changedPackages.size} package entries changed)`,
      actionableMatches,
    };
  }

  const matchedPackageNames = [
    ...new Set([...actionableMatches.values()].flat()),
  ].sort();

  return {
    actionableAdvisories,
    ambientAdvisories,
    reason: `matched changed package/path entr${matchedPackageNames.length === 1 ? 'y' : 'ies'}: ${matchedPackageNames.join(', ')}`,
    actionableMatches,
  };
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
      const runStatus = ghApi(`repos/${repo}/actions/runs/${candidateId}`, {
        jq: '.status',
      }).trim();

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
        {
          jq: '[.jobs[] | select(.name | test("health"; "i")) | {id, status}] | first',
        },
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
        const msg =
          rerunError instanceof Error ? rerunError.message : String(rerunError);
        if (msg.includes('409') || msg.includes('Conflict')) {
          // Two PRs tried to re-run the same job simultaneously — harmless.
          // The other PR's re-run is underway, so return the URL so the
          // caller can report the in-progress refresh.
          console.log(
            `Baseline refresh already triggered by another PR (409 Conflict).`,
          );
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

function getRunAttempt(): number {
  const raw = process.env.GITHUB_RUN_ATTEMPT;
  if (!raw) {
    return 1;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

// ---------------------------------------------------------------------------
// GitHub issue creation (push-to-main only)
// ---------------------------------------------------------------------------

/**
 * Create (or find existing) tracking issue for new or newly blocking advisories detected on
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
      JSON.stringify(advisories.map((a) => advisoryIdentityKey(a)).sort()),
    )
    .digest('hex')
    .slice(0, 10);

  const title = `Yarn Audit: new or newly blocking advisories on main (${contentKey})`;

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
    `**${advisories.length}** new or newly blocking advisor${advisories.length === 1 ? 'y' : 'ies'} detected on push to \`${BRANCH}\` (${blockingCount} release-blocking).`,
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
          `:warning: *Yarn Audit: ${count} new or newly blocking ${noun}*` +
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

  const isMainlineTrigger = IS_MAIN;
  const { allNewAdvisories, newlyBlockingAdvisories } = diffAdvisories(
    current,
    baseline,
  );
  const blockingAdvisories = newlyBlockingAdvisories;

  // On push-to-main and cron we report all new advisories plus anything that
  // newly became release-blocking. On PRs we only fail for the blocking subset.
  const newAdvisories = isMainlineTrigger
    ? uniqueAdvisoriesByIdentity([
        ...allNewAdvisories,
        ...newlyBlockingAdvisories,
      ])
    : newlyBlockingAdvisories;

  if (newAdvisories.length === 0) {
    console.log(
      `No new or newly blocking advisories. Current: ${current.length}, baseline: ${baseline.length}.`,
    );
    writeStepSummary(
      `\n### yarn audit: **passed** — no new or newly blocking advisories\n`,
    );
    return;
  }

  // New or newly blocking advisories found.
  console.log(
    `Found ${newAdvisories.length} new or newly blocking advisory/advisories` +
      (isMainlineTrigger && blockingAdvisories.length !== newAdvisories.length
        ? ` (${blockingAdvisories.length} release-blocking).`
        : '.'),
  );

  const treeText = formatAdvisoryTreeText(
    newAdvisories,
    captureNativeAuditAll(),
    { stripAnsiOutput: true },
  );

  const diffSummaryLines = [
    '',
    `### yarn audit: ${isMainlineTrigger ? '**new or newly blocking advisories on main**' : '**FAILED**'} — ${newAdvisories.length} new or newly blocking advisor${newAdvisories.length === 1 ? 'y' : 'ies'}`,
    '',
    isMainlineTrigger
      ? `${newAdvisories.length} new or newly blocking advisor${newAdvisories.length === 1 ? 'y' : 'ies'} detected on push to main (${blockingAdvisories.length} release-blocking).`
      : 'Your dependency changes introduced new vulnerabilities. If a newer version of the package is available, upgrade to it.',
    '',
    '```',
    treeText,
    '```',
    '',
  ];

  if (isMainlineTrigger) {
    for (const a of newAdvisories) {
      const level = blockingAdvisories.includes(a) ? 'error' : 'warning';
      console.log(
        `::${level}::New or newly blocking advisory [${sevLabel(a)}]: ${a.moduleName} — ${a.title} (${a.url})`,
      );
    }

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

    diffSummaryLines.push('Run `yarn audit` locally to reproduce.', '');
    writeStepSummary(diffSummaryLines.join('\n'));
    return;
  }

  // ----------------------------------------------------------------
  // PR classification for actionable vs ambient advisories
  // ----------------------------------------------------------------
  // When a new CVE is published between the last push-to-main and a PR
  // run, the advisory appears "new" even though the PR didn't introduce it.
  // This is an "ambient CVE." A single PR can also contain both ambient CVEs
  // and advisories caused by its dependency changes, so we partition the set:
  //
  //   1. Actionable: the PR changed the advisory package, or a direct
  //      dependent from the audit path.
  //   2. Ambient: the PR did not touch the advisory package/path.
  //
  // Ambient-only PRs pass immediately. Same-repo PRs may still refresh the
  // baseline once so subsequent runs diff against the newer advisory set.
  const runAttempt = getRunAttempt();
  const allowAutoRefresh = runAttempt === 1;
  const touchesYarnLock = prChangesYarnLock();
  const dependencyDiff = touchesYarnLock
    ? getPrChangedYarnLockPackages()
    : {
        changedPackages: new Set<string>(),
        reason: 'this PR does not change `yarn.lock`',
      };
  const advisoryPartition = partitionAdvisoriesByDependencyDiff(
    blockingAdvisories,
    dependencyDiff,
  );
  const { actionableAdvisories, ambientAdvisories } = advisoryPartition;

  if (actionableAdvisories.length > 0) {
    process.exitCode = 1;

    const ambientSuffix =
      ambientAdvisories.length > 0
        ? ` (${ambientAdvisories.length} ambient advisor${ambientAdvisories.length === 1 ? 'y' : 'ies'} also detected)`
        : '';

    diffSummaryLines[1] =
      `### yarn audit: **FAILED** — ${actionableAdvisories.length} actionable advisor${actionableAdvisories.length === 1 ? 'y' : 'ies'}` +
      ambientSuffix;
    diffSummaryLines[3] =
      `New or newly blocking advisories were found and this PR changes an affected package/path. ` +
      `Automatic baseline refresh is skipped while actionable dependency changes remain. ` +
      'Run `yarn audit` locally to check whether these come from your dependency changes.';
    diffSummaryLines.push(`Dependency diff: ${advisoryPartition.reason}`, '');
    if (ambientAdvisories.length > 0) {
      diffSummaryLines.push(
        `${ambientAdvisories.length} advisor${ambientAdvisories.length === 1 ? 'y was' : 'ies were'} classified as ambient and did not cause this failure.`,
        '',
      );
    }
    diffSummaryLines.push('Run `yarn audit` locally to reproduce.', '');

    for (const advisory of actionableAdvisories) {
      const matchedPackages = advisoryPartition.actionableMatches.get(
        advisoryIdentityKey(advisory),
      ) ?? [advisory.moduleName];
      githubAnnotate(
        'error',
        `Actionable advisory [${sevLabel(advisory)}]: ${advisory.moduleName} — ${advisory.title} (${advisory.url}). Matched dependency diff: ${matchedPackages.join(', ')}`,
      );
    }
    if (ambientAdvisories.length > 0) {
      githubAnnotate(
        'warning',
        `${ambientAdvisories.length} ambient advisor${ambientAdvisories.length === 1 ? 'y' : 'ies'} also found (not introduced by this PR).`,
      );
    }
  } else {
    // Trigger a baseline refresh so subsequent runs aren't blocked by ambient
    // CVEs. Only possible on same-repo PRs with actions:write.
    let refreshUrl: string | null = null;
    if (allowAutoRefresh && process.env.IS_CROSS_REPO_PR !== 'true') {
      refreshUrl = triggerBaselineRefresh();
    }

    diffSummaryLines[1] = `### yarn audit: **passed** (ambient) — ${ambientAdvisories.length} pre-existing advisor${ambientAdvisories.length === 1 ? 'y' : 'ies'}`;
    diffSummaryLines[3] =
      `New or newly blocking advisories were detected compared to the baseline, but ${advisoryPartition.reason}` +
      ' — these are ambient CVEs, not introduced by this PR.';
    diffSummaryLines.push(`Dependency diff: ${advisoryPartition.reason}`, '');
    if (refreshUrl) {
      diffSummaryLines.push(
        `> **Baseline refresh triggered** — [view run](${refreshUrl}). ` +
          'Subsequent PR runs will diff against the updated baseline.',
        '',
      );
    }

    githubAnnotate(
      'warning',
      `${ambientAdvisories.length} ambient advisor${ambientAdvisories.length === 1 ? 'y' : 'ies'} found (not introduced by this PR).` +
        (refreshUrl ? ` Baseline refresh: ${refreshUrl}` : ''),
    );
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
