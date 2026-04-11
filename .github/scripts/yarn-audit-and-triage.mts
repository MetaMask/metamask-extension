import { spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { existsSync, writeFileSync } from 'fs';
import { getGitHubToken } from './shared/github-token.mts';
import { ghApi } from './shared/gh-api.mts';
import {
  AUDIT_CURRENT_FILE,
  AUDIT_DETAILS_FILE,
  type YarnSeverity,
  type ParsedAdvisory,
  githubAnnotate,
  writeStepSummary,
} from './shared/audit-utils.mts';

// ---------------------------------------------------------------------------
// Pipeline contract
// ---------------------------------------------------------------------------
// This script is step 1 of the audit pipeline:
//   1. yarn-audit-and-triage.mts (this) → runs `yarn audit`, classifies
//      advisories, writes AUDIT_CURRENT_FILE (JSON) and optionally
//      AUDIT_DETAILS_FILE (markdown for the step summary).
//   2. yarn-audit-diff.mts → compares current vs baseline, fails on new
//      advisories. Appends AUDIT_DETAILS_FILE to its step summary.
//
// When no baseline is available (NO_BASELINE=true), this script handles
// the pass/fail verdict itself using production-moderate+ criteria.
// ---------------------------------------------------------------------------

type YarnAuditTreeLeaf = {
  ID?: number;
  Issue?: string;
  URL?: string;
  Severity?: string;
  'Vulnerable Versions'?: string;
  'Tree Versions'?: string[];
  Dependents?: string[];
};

type YarnAuditTreeNode = {
  value?: string;
  children?: unknown;
};

type DeprecationFinding = {
  message: string;
};

const DEFAULT_BRANCH = 'main';
const BRANCH = process.env.BRANCH ?? DEFAULT_BRANCH;
const IS_RELEASE_BRANCH = BRANCH.startsWith('release/');

const CHECK_DEPRECATIONS = process.env.CHECK_DEPRECATIONS !== 'false';

const CREATE_TRACKING_ISSUE =
  process.env.CREATE_TRACKING_ISSUE === undefined
    ? process.env.GITHUB_ACTIONS === 'true'
    : process.env.CREATE_TRACKING_ISSUE === 'true';
const SLACK_HIGHLIGHT = process.env.SLACK_HIGHLIGHT !== 'false';

const YARN_BIN = 'yarn';
const YARN_SHELL = process.platform === 'win32';

// Set by the workflow when no baseline artifact could be downloaded — either
// the baseline is missing (first rollout / expired artifact) or this is a fork
// PR whose read-only token couldn't fetch it.  When true, the script falls
// back to the same criteria as the package.json `audit` script:
//   yarn audit --environment production --severity moderate
// i.e. block on any moderate+ severity production advisory.
const noBaseline = process.env.NO_BASELINE === 'true';

function normalizeSeverity(severity: YarnSeverity | undefined): YarnSeverity {
  // Yarn Berry uses 'moderate' where the npm ecosystem uses 'medium'.
  // Normalize to 'medium' so the rest of the code only deals with one term.
  if (severity === 'moderate') {
    return 'medium';
  }

  return severity ?? 'info';
}

function isRedosOrDosIssue(text: string): boolean {
  // Match whole words, case-insensitive.
  return /\bReDoS\b/i.test(text) || /\bDoS\b/i.test(text);
}

function parseJsonLines(text: string): unknown[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const parsed: unknown[] = [];
  for (const line of lines) {
    try {
      parsed.push(JSON.parse(line) as unknown);
    } catch {
      // Ignore non-JSON lines.
    }
  }
  return parsed;
}

function parseJsonOrNdjson(text: string): unknown[] {
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return [];
  }

  try {
    const parsed = JSON.parse(trimmed) as unknown;
    return [parsed];
  } catch {
    // Fall through to NDJSON parsing.
  }

  return parseJsonLines(text);
}

function spawnYarnAudit(environment: 'production' | 'development'): string {
  const result = spawnSync(
    YARN_BIN,
    ['npm', 'audit', '--recursive', '--environment', environment, '--json'],
    {
      encoding: 'utf8',
      shell: YARN_SHELL,
    },
  );

  // Yarn may exit non-zero when vulnerabilities are found.
  // Prefer stdout (where the JSON is), but include stderr as fallback.
  return `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
}

function isAuditLeaf(value: unknown): value is YarnAuditTreeLeaf {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const leaf = value as Record<string, unknown>;
  return (
    typeof leaf.Issue === 'string' &&
    typeof leaf.Severity === 'string' &&
    (typeof leaf.URL === 'string' || typeof leaf.ID === 'number')
  );
}

function extractAuditLeaves(
  records: unknown[],
): Array<{ moduleName: string; leaf: YarnAuditTreeLeaf }> {
  const results: Array<{ moduleName: string; leaf: YarnAuditTreeLeaf }> = [];

  const visit = (node: unknown, currentModuleName: string | null) => {
    if (isAuditLeaf(node)) {
      results.push({
        moduleName: currentModuleName ?? 'unknown',
        leaf: node,
      });
      return;
    }

    if (Array.isArray(node)) {
      for (const item of node) {
        visit(item, currentModuleName);
      }
      return;
    }

    if (!node || typeof node !== 'object') {
      return;
    }

    const asNode = node as YarnAuditTreeNode;
    if (typeof asNode.value === 'string' && 'children' in asNode) {
      visit(asNode.children, asNode.value);
      return;
    }

    // Generic object: traverse its values.
    for (const value of Object.values(node as Record<string, unknown>)) {
      visit(value, currentModuleName);
    }
  };

  for (const record of records) {
    visit(record, null);
  }

  return results;
}

function advisoryKey(
  advisory: Pick<ParsedAdvisory, 'id' | 'moduleName' | 'url' | 'title'>,
): string {
  return `${advisory.id ?? 'no-id'}|${advisory.moduleName}|${advisory.url}|${advisory.title}`;
}

function runYarnAudit(): { prod: unknown[]; dev: unknown[] } {
  const prodText = spawnYarnAudit('production');
  const devText = spawnYarnAudit('development');

  const prod = parseJsonOrNdjson(prodText);
  const dev = parseJsonOrNdjson(devText);

  if (prod.length === 0 && dev.length === 0) {
    const combined = `${prodText}\n${devText}`.trim();
    if (combined.length > 0) {
      console.error(combined);
    }
    throw new Error('No JSON output parsed from `yarn audit --json`.');
  }

  return { prod, dev };
}

function runYarnInstallForDeprecations(): DeprecationFinding[] {
  if (!CHECK_DEPRECATIONS) {
    return [];
  }

  // Yarn classic prints install warnings (including deprecations). We re-run
  // install with scripts disabled to collect deprecation warnings.
  const result = spawnSync(
    YARN_BIN,
    [
      'install',
      '--immutable',
      '--immutable-cache',
      '--ignore-scripts',
      '--mode=skip-build',
      '--json',
    ],
    {
      encoding: 'utf8',
      shell: YARN_SHELL,
    },
  );

  const combined = `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  const lines = parseJsonLines(combined);

  const deprecations: DeprecationFinding[] = [];
  for (const line of lines) {
    if (!line || typeof line !== 'object') {
      continue;
    }

    const parsed = line as { type?: unknown; data?: unknown };

    if (parsed.type !== 'warning') {
      continue;
    }

    const message = (parsed.data as { message?: unknown } | undefined)?.message;
    if (typeof message !== 'string') {
      continue;
    }

    if (/deprecated/i.test(message)) {
      deprecations.push({ message });
    }
  }

  // Best-effort only; don't fail health checks if Yarn install exits non-zero.
  return deprecations;
}

function getRepoFromEnv(): { owner: string; repo: string } | null {
  const full = process.env.GITHUB_REPOSITORY;
  if (!full) {
    return null;
  }

  const [owner, repo] = full.split('/');
  if (!owner || !repo) {
    return null;
  }

  return { owner, repo };
}

function sha256Short(text: string): string {
  return createHash('sha256').update(text).digest('hex').slice(0, 10);
}

function searchIssueByTitle({
  owner,
  repo,
  title,
  token,
}: {
  owner: string;
  repo: string;
  title: string;
  token: string;
}): number | null {
  const q = `repo:${owner}/${repo} type:issue in:title "${title}"`;
  try {
    const raw = ghApi(
      `/search/issues?q=${encodeURIComponent(q)}`,
      undefined,
      token,
    );
    const json = JSON.parse(raw) as {
      items?: Array<{ number?: number; title?: string }>;
    };
    const match = json.items?.find((item) => item.title === title);
    return typeof match?.number === 'number' ? match.number : null;
  } catch {
    return null;
  }
}

function createIssueViaRest({
  owner,
  repo,
  title,
  body,
  token,
}: {
  owner: string;
  repo: string;
  title: string;
  body: string;
  token: string;
}): number {
  const raw = ghApi(
    `/repos/${owner}/${repo}/issues`,
    {
      method: 'POST',
      body: { title, body },
    },
    token,
  );
  const json = JSON.parse(raw) as { number?: number };
  if (typeof json.number !== 'number') {
    throw new Error('Created issue response missing issue number.');
  }
  return json.number;
}

function extractAdvisories(records: unknown[]): ParsedAdvisory[] {
  const advisories: ParsedAdvisory[] = [];

  const leaves = extractAuditLeaves(records);
  for (const { moduleName, leaf } of leaves) {
    const title = leaf.Issue ?? '(no issue)';
    const url = leaf.URL ?? '';
    const vulnerableVersions = leaf['Vulnerable Versions'] ?? '';
    const originalSeverity = normalizeSeverity(
      (leaf.Severity?.toLowerCase() as YarnSeverity | undefined) ?? 'info',
    );

    advisories.push({
      id: typeof leaf.ID === 'number' ? leaf.ID : null,
      moduleName,
      title,
      url,
      vulnerableVersions,
      patchedVersions: '',
      originalSeverity,
      effectiveSeverity: originalSeverity,
      isDevOnly: false,
      affectsProduction: false,
      matchedIssueRule: 'none',
    });
  }

  return advisories;
}

function formatAdvisoryLine(advisory: ParsedAdvisory): string {
  const scope = advisory.affectsProduction ? 'prod' : 'dev';
  const id = advisory.id ? `#${advisory.id}` : '';
  const sev = advisory.effectiveSeverity.toUpperCase();
  const downgraded =
    advisory.originalSeverity !== advisory.effectiveSeverity
      ? ` (from ${advisory.originalSeverity})`
      : '';
  const url = advisory.url ? ` ${advisory.url}` : '';

  return `[${scope}] ${sev}${downgraded} ${advisory.moduleName} ${id} — ${advisory.title}${url}`;
}

// ---------------------------------------------------------------------------
// Tracking issue creation (push-to-main only)
// ---------------------------------------------------------------------------

function maybeCreateTrackingIssue(
  trackOnlyDev: ParsedAdvisory[],
  deprecations: DeprecationFinding[],
): void {
  if (
    !CREATE_TRACKING_ISSUE ||
    (trackOnlyDev.length === 0 && deprecations.length === 0) ||
    process.env.GITHUB_EVENT_NAME !== 'push' ||
    BRANCH !== 'main'
  ) {
    return;
  }

  const repo = getRepoFromEnv();
  if (!repo) {
    githubAnnotate(
      'warning',
      'CREATE_TRACKING_ISSUE=true but missing GITHUB_REPOSITORY; skipping issue creation.',
    );
    return;
  }

  const token = getGitHubToken();
  const trackingKey = sha256Short(
    JSON.stringify({
      advisories: trackOnlyDev
        .map((a) => ({
          id: a.id,
          moduleName: a.moduleName,
          severity: a.effectiveSeverity,
          url: a.url,
          rule: a.matchedIssueRule,
        }))
        .sort((a, b) => `${a.moduleName}`.localeCompare(`${b.moduleName}`)),
      deprecations: [...deprecations]
        .map((d) => d.message)
        .sort((a, b) => a.localeCompare(b)),
    }),
  );

  const title = `Dependency audit triage (${trackingKey})`;
  const existingNumber = searchIssueByTitle({
    owner: repo.owner,
    repo: repo.repo,
    title,
    token,
  });

  if (existingNumber) {
    githubAnnotate(
      'notice',
      `Tracking issue already exists: https://github.com/${repo.owner}/${repo.repo}/issues/${existingNumber}`,
    );
    return;
  }

  const bodyLines: string[] = [
    'Automated dependency audit triage.',
    '',
    `- Branch: ${BRANCH}`,
    `- Release branch: ${IS_RELEASE_BRANCH}`,
    '',
  ];

  if (trackOnlyDev.length > 0) {
    bodyLines.push('## Dev advisories (track)');
    for (const advisory of trackOnlyDev) {
      bodyLines.push(`- ${formatAdvisoryLine(advisory)}`);
    }
    bodyLines.push('');
  }

  if (deprecations.length > 0) {
    bodyLines.push('## Deprecations');
    for (const dep of deprecations) {
      bodyLines.push(`- ${dep.message}`);
    }
    bodyLines.push('');
  }

  bodyLines.push('## Action');
  bodyLines.push('- Triage and plan remediation.');
  bodyLines.push('- Include in daily Slack dependency triage message.');

  try {
    const issueNumber = createIssueViaRest({
      owner: repo.owner,
      repo: repo.repo,
      title,
      body: bodyLines.join('\n'),
      token,
    });
    githubAnnotate(
      'notice',
      `Created tracking issue: https://github.com/${repo.owner}/${repo.repo}/issues/${issueNumber}`,
    );
  } catch (error) {
    githubAnnotate(
      'warning',
      `Failed to create tracking issue (check token permissions): ${String(error)}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Summary & verdict (writes step summary and/or details file)
// ---------------------------------------------------------------------------

function buildSummaryAndVerdict({
  advisories,
  prodAdvisories,
  devAdvisories,
  deprecations,
  downgraded,
  trackOnlyDev,
  blockReleaseCandidate,
}: {
  advisories: ParsedAdvisory[];
  prodAdvisories: ParsedAdvisory[];
  devAdvisories: ParsedAdvisory[];
  deprecations: DeprecationFinding[];
  downgraded: ParsedAdvisory[];
  trackOnlyDev: ParsedAdvisory[];
  blockReleaseCandidate: boolean;
}): void {
  const verdictLines: string[] = [];

  const detailsLines: string[] = [];
  detailsLines.push('<details>');
  detailsLines.push('<summary>Full details</summary>');
  detailsLines.push('');
  detailsLines.push(`- Branch: \`${BRANCH}\``);
  detailsLines.push(`- Release branch: \`${IS_RELEASE_BRANCH}\``);
  detailsLines.push(
    `- Advisories: **${advisories.length}** (prod: **${prodAdvisories.length}**, dev: **${devAdvisories.length}**)`,
  );
  detailsLines.push(
    `- Deprecations: **${deprecations.length}**${
      CHECK_DEPRECATIONS ? '' : ' (check disabled)'
    }`,
  );
  detailsLines.push('');

  if (downgraded.length > 0) {
    detailsLines.push('### Downgraded (ReDoS/DoS rule)');
    detailsLines.push('');
    for (const advisory of downgraded) {
      detailsLines.push(`- ${formatAdvisoryLine(advisory)}`);
    }
    detailsLines.push('');
  }

  if (trackOnlyDev.length > 0 || deprecations.length > 0) {
    detailsLines.push('### Track (issue + Slack reminder)');
    detailsLines.push('');
    for (const advisory of trackOnlyDev) {
      detailsLines.push(`- ${formatAdvisoryLine(advisory)}`);
    }
    for (const dep of deprecations) {
      detailsLines.push(`- [deprecation] ${dep.message}`);
    }
    detailsLines.push('');
  }

  if (IS_RELEASE_BRANCH) {
    detailsLines.push('### Release branch decision');
    detailsLines.push('');
    detailsLines.push(
      blockReleaseCandidate
        ? '- **BLOCK RC**: Production dependency advisory present on a release branch.'
        : '- No production advisories on a release branch — RC not blocked.',
    );
    detailsLines.push('');
  }

  detailsLines.push('</details>');

  if (noBaseline) {
    // No baseline → fall back to `yarn audit --severity moderate --environment production`.
    const fallbackBlockingSeverities: YarnSeverity[] = [
      'medium',
      'high',
      'critical',
    ];
    const blockingProdAdvisories = prodAdvisories.filter((a) =>
      fallbackBlockingSeverities.includes(a.effectiveSeverity),
    );

    if (blockingProdAdvisories.length > 0) {
      githubAnnotate(
        'error',
        `yarn audit FAILED: ${blockingProdAdvisories.length} production advisor${blockingProdAdvisories.length === 1 ? 'y' : 'ies'} at moderate+ severity (no baseline — could not run diff).`,
      );
      verdictLines.push(
        `### yarn audit: **FAILED**`,
        '',
        'No baseline artifact available — could not diff against main. Fell back to `yarn audit --severity moderate --environment production` criteria.',
        '',
        `**${blockingProdAdvisories.length}** blocking production advisor${blockingProdAdvisories.length === 1 ? 'y' : 'ies'} found.`,
      );
      process.exitCode = 1;
    } else {
      githubAnnotate(
        'notice',
        `yarn audit passed: ${advisories.length} advisor${advisories.length === 1 ? 'y' : 'ies'} (${prodAdvisories.length} prod, ${devAdvisories.length} dev), 0 blocking (no baseline — could not run diff).`,
      );
      verdictLines.push(
        `### yarn audit: **passed**`,
        '',
        'No baseline artifact available — could not diff against main. Fell back to `yarn audit --severity moderate --environment production` criteria.',
        '',
        `**0** blocking production advisories. ${devAdvisories.length} dev-only advisor${devAdvisories.length === 1 ? 'y' : 'ies'} ignored.`,
      );
    }
  } else if (blockReleaseCandidate) {
    githubAnnotate(
      'error',
      `yarn audit FAILED: ${prodAdvisories.length} production advisor${prodAdvisories.length === 1 ? 'y' : 'ies'} on release branch — RC blocked.`,
    );
    verdictLines.push(
      `### yarn audit: **FAILED**`,
      '',
      `Release branch with **${prodAdvisories.length}** production advisor${prodAdvisories.length === 1 ? 'y' : 'ies'} — release candidate blocked until resolved.`,
    );
    process.exitCode = 1;
  } else {
    // Normal path: baseline exists, not a release branch.
    // The diff step writes the pass/fail verdict; we just emit details
    // to a temp file so it can append them after its own output.
    githubAnnotate(
      'notice',
      `yarn audit: ${advisories.length} advisor${advisories.length === 1 ? 'y' : 'ies'} (${prodAdvisories.length} prod, ${devAdvisories.length} dev). Diff against main will check for new advisories.`,
    );
    writeFileSync(AUDIT_DETAILS_FILE, detailsLines.join('\n'), 'utf8');
  }

  // When there's no diff step (no-baseline or release branch), write
  // verdict + details together. When the diff step runs, the details
  // are in .tmp/audit-details.md and appended by the diff script.
  if (verdictLines.length > 0) {
    writeStepSummary([...verdictLines, '', ...detailsLines].join('\n'));
  }
}

// ---------------------------------------------------------------------------
// main
// ---------------------------------------------------------------------------

function main() {
  const audit = runYarnAudit();

  const prodParsed = extractAdvisories(audit.prod).map((advisory) => ({
    ...advisory,
    affectsProduction: true,
    isDevOnly: false,
  }));
  const devParsed = extractAdvisories(audit.dev);

  const prodKeys = new Set(prodParsed.map((a) => advisoryKey(a)));

  const merged: ParsedAdvisory[] = [];
  const seen = new Set<string>();

  for (const advisory of devParsed) {
    const key = advisoryKey(advisory);
    const affectsProduction = prodKeys.has(key);
    const isDevOnly = !affectsProduction;

    const issueText = `${advisory.title} ${advisory.moduleName}`;
    const matchedIssueRule =
      advisory.originalSeverity === 'high' &&
      isDevOnly &&
      isRedosOrDosIssue(issueText)
        ? 'redos-dos-downgrade'
        : 'none';

    const effectiveSeverity =
      matchedIssueRule === 'redos-dos-downgrade'
        ? 'low'
        : advisory.originalSeverity;

    merged.push({
      ...advisory,
      affectsProduction,
      isDevOnly,
      matchedIssueRule,
      effectiveSeverity,
    });
    seen.add(key);
  }

  for (const advisory of prodParsed) {
    const key = advisoryKey(advisory);
    if (seen.has(key)) {
      continue;
    }
    merged.push(advisory);
    seen.add(key);
  }

  const advisories = merged;
  const deprecations = runYarnInstallForDeprecations();

  // Write the current advisories to disk for use by the audit-diff step.
  writeFileSync(
    AUDIT_CURRENT_FILE,
    JSON.stringify(advisories, null, 2),
    'utf8',
  );

  const prodAdvisories = advisories.filter((a) => a.affectsProduction);
  const devAdvisories = advisories.filter((a) => a.isDevOnly);
  const downgraded = advisories.filter(
    (a) => a.originalSeverity !== a.effectiveSeverity,
  );
  const trackOnlyDev = devAdvisories.filter(
    (a) => a.effectiveSeverity === 'low' || a.effectiveSeverity === 'medium',
  );

  // Block release candidates when any production advisory is present.
  const blockReleaseCandidate =
    IS_RELEASE_BRANCH &&
    advisories.some((advisory) => advisory.affectsProduction);

  // Console output (machine readable)
  console.log(
    JSON.stringify(
      {
        branch: BRANCH,
        isReleaseBranch: IS_RELEASE_BRANCH,
        advisories,
        deprecations,
        blockReleaseCandidate,
      },
      null,
      2,
    ),
  );

  // Slack highlight: emit a single, copy-pastable line.
  if (SLACK_HIGHLIGHT && (trackOnlyDev.length > 0 || deprecations.length > 0)) {
    const parts: string[] = [];
    for (const advisory of trackOnlyDev) {
      parts.push(`${advisory.moduleName}(${advisory.effectiveSeverity})`);
    }
    if (deprecations.length > 0) {
      parts.push(`deprecations:${deprecations.length}`);
    }
    console.log(
      `SLACK_HIGHLIGHT: yarn audit triage needs attention — ${parts.join(', ')}`,
    );
  }

  maybeCreateTrackingIssue(trackOnlyDev, deprecations);

  buildSummaryAndVerdict({
    advisories,
    prodAdvisories,
    devAdvisories,
    deprecations,
    downgraded,
    trackOnlyDev,
    blockReleaseCandidate,
  });
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
