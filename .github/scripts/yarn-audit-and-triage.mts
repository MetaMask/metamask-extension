import { spawnSync } from 'child_process';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import {
  AUDIT_CURRENT_FILE,
  AUDIT_DETAILS_FILE,
  AUDIT_RAW_DEV,
  AUDIT_RAW_PROD,
  BLOCKING_SEVERITIES,
  type ParsedAdvisory,
  type YarnSeverity,
  formatAdvisoryTree,
  githubAnnotate,
  normalizeSeverity,
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
// When imported by yarn-audit-local.mts, the caller pre-warms
// AUDIT_RAW_PROD / AUDIT_RAW_DEV in parallel so spawnYarnAudit() reads
// from disk instead of spawning sequential subprocesses.
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

const DEFAULT_BRANCH = 'main';
const BRANCH = process.env.BRANCH ?? DEFAULT_BRANCH;
const IS_RELEASE_BRANCH = BRANCH.startsWith('release/');

const YARN_BIN = 'yarn';

// Set by the workflow when no baseline artifact could be downloaded (first
// rollout, expired artifact, or failed download).  When true, the script
// falls back to the same criteria as the package.json `audit` script:
//   yarn audit --environment production --severity moderate
// i.e. block on any moderate+ severity production advisory.
const noBaseline = process.env.NO_BASELINE === 'true';

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
  // If the local script pre-warmed the raw output in parallel, use it.
  const cached = environment === 'production' ? AUDIT_RAW_PROD : AUDIT_RAW_DEV;
  if (existsSync(cached)) {
    return readFileSync(cached, 'utf8');
  }

  const result = spawnSync(
    `${YARN_BIN} npm audit --recursive --environment ${environment} --json`,
    {
      encoding: 'utf8',
      shell: true,
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
      treeVersions: leaf['Tree Versions'] ?? [],
      dependents: leaf.Dependents ?? [],
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
// Summary & verdict (writes step summary and/or details file)
// ---------------------------------------------------------------------------

function buildSummaryAndVerdict({
  advisories,
  prodAdvisories,
  devAdvisories,
  downgraded,
  trackOnlyDev,
  blockReleaseCandidate,
}: {
  advisories: ParsedAdvisory[];
  prodAdvisories: ParsedAdvisory[];
  devAdvisories: ParsedAdvisory[];
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
  detailsLines.push('');

  if (downgraded.length > 0) {
    detailsLines.push('### Downgraded (ReDoS/DoS rule)');
    detailsLines.push('');
    for (const advisory of downgraded) {
      detailsLines.push(`- ${formatAdvisoryLine(advisory)}`);
    }
    detailsLines.push('');
  }

  if (trackOnlyDev.length > 0) {
    detailsLines.push('### Track (issue + Slack reminder)');
    detailsLines.push('');
    for (const advisory of trackOnlyDev) {
      detailsLines.push(`- ${formatAdvisoryLine(advisory)}`);
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
    const blockingProdAdvisories = prodAdvisories.filter((a) =>
      BLOCKING_SEVERITIES.has(a.effectiveSeverity),
    );

    if (blockingProdAdvisories.length > 0) {
      githubAnnotate(
        'error',
        `yarn audit FAILED: ${blockingProdAdvisories.length} production vulnerabilit${blockingProdAdvisories.length === 1 ? 'y' : 'ies'} found.`,
      );
      verdictLines.push(
        `### yarn audit: **FAILED**`,
        '',
        `**${blockingProdAdvisories.length}** production vulnerabilit${blockingProdAdvisories.length === 1 ? 'y' : 'ies'} at moderate or higher severity.`,
        '',
        'If a newer version of the affected package is available, upgrade to it.',
        '',
        'Run `yarn audit` locally to reproduce.',
        '',
        '```',
        blockingProdAdvisories.map(formatAdvisoryTree).join('\n\n'),
        '```',
        '',
      );
      process.exitCode = 1;
    } else {
      githubAnnotate(
        'notice',
        `yarn audit passed: no blocking production vulnerabilities.`,
      );
      verdictLines.push(
        `### yarn audit: **passed**`,
        '',
        'No production vulnerabilities at moderate or higher severity.',
        '',
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
      '',
      '```',
      prodAdvisories.map(formatAdvisoryTree).join('\n\n'),
      '```',
      '',
    );
    process.exitCode = 1;
  } else if (process.env.GITHUB_EVENT_NAME === 'push') {
    // Push-to-main: the diff step handles pass/fail and Slack, but we still
    // write a brief baseline-updated summary here for the triage step panel.
    verdictLines.push(
      `### Baseline updated: ${advisories.length} advisor${advisories.length === 1 ? 'y' : 'ies'}`,
      '',
      `Production: ${prodAdvisories.length} | Dev-only: ${devAdvisories.length}`,
    );
  } else {
    // PR with baseline: the diff step writes the pass/fail verdict.
    // Emit details to a temp file so the diff script can append them.
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

export function main() {
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
    (a) => a.effectiveSeverity === 'low' || a.effectiveSeverity === 'moderate',
  );

  // Block release candidates when a moderate+ production advisory is present.
  const blockReleaseCandidate =
    IS_RELEASE_BRANCH &&
    prodAdvisories.some((a) => BLOCKING_SEVERITIES.has(a.effectiveSeverity));

  // Console summary — compact overview instead of the full JSON blob
  // (full data is already in .tmp/audit-current.json).
  console.log(
    `Advisories: ${advisories.length} (prod: ${prodAdvisories.length}, dev: ${devAdvisories.length})` +
      `  |  Downgraded: ${downgraded.length}` +
      `  |  Track: ${trackOnlyDev.length}` +
      `  |  Block RC: ${blockReleaseCandidate}`,
  );
  const SUMMARY_LIMIT = 10;
  for (const advisory of prodAdvisories.slice(0, SUMMARY_LIMIT)) {
    console.log(`  ${formatAdvisoryLine(advisory)}`);
  }
  if (prodAdvisories.length > SUMMARY_LIMIT) {
    console.log(
      `  ... ${prodAdvisories.length - SUMMARY_LIMIT} more prod — see ${AUDIT_CURRENT_FILE}`,
    );
  }
  for (const advisory of devAdvisories.slice(0, SUMMARY_LIMIT)) {
    console.log(`  ${formatAdvisoryLine(advisory)}`);
  }
  if (devAdvisories.length > SUMMARY_LIMIT) {
    console.log(
      `  ... ${devAdvisories.length - SUMMARY_LIMIT} more dev — see ${AUDIT_CURRENT_FILE}`,
    );
  }

  buildSummaryAndVerdict({
    advisories,
    prodAdvisories,
    devAdvisories,
    downgraded,
    trackOnlyDev,
    blockReleaseCandidate,
  });
}

// Run directly on CI; skipped when imported by yarn-audit-local.mts.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error);
    process.exitCode = 1;
  }
}
