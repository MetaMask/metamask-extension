import { spawnSync } from 'child_process';
import { createHash } from 'crypto';
import { appendFileSync, existsSync, writeFileSync } from 'fs';
import { getGitHubToken } from './shared/github-token.mts';
import { ghApi } from './shared/gh-api.mts';

type YarnSeverity =
  | 'info'
  | 'low'
  | 'moderate'
  | 'medium'
  | 'high'
  | 'critical';

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

type ParsedAdvisory = {
  id: number | null;
  moduleName: string;
  title: string;
  url: string;
  vulnerableVersions: string;
  patchedVersions: string;
  originalSeverity: YarnSeverity;
  effectiveSeverity: YarnSeverity;
  isDevOnly: boolean;
  affectsProduction: boolean;
  matchedIssueRule: 'redos-dos-downgrade' | 'none';
};

type DeprecationFinding = {
  message: string;
};

type TriageSummary = {
  branch: string;
  isReleaseBranch: boolean;
  advisories: ParsedAdvisory[];
  deprecations: DeprecationFinding[];
  decisions: {
    blockReleaseCandidate: boolean;
  };
};

const DEFAULT_BRANCH = 'main';
const BRANCH = process.env.BRANCH ?? DEFAULT_BRANCH;
const IS_RELEASE_BRANCH = BRANCH.startsWith('release/');

const USE_CACHED_OUTPUT = process.env.USE_CACHED_OUTPUT === 'true';
const CHECK_DEPRECATIONS = process.env.CHECK_DEPRECATIONS !== 'false';

const CREATE_TRACKING_ISSUE =
  process.env.CREATE_TRACKING_ISSUE === undefined
    ? process.env.GITHUB_ACTIONS === 'true'
    : process.env.CREATE_TRACKING_ISSUE === 'true';
const SLACK_HIGHLIGHT = process.env.SLACK_HIGHLIGHT !== 'false';

const YARN_BIN = 'yarn';
const YARN_SHELL = process.platform === 'win32';

const IS_FORK_PR = process.env.IS_FORK_PR === 'true';
const outputFileArg = (() => {
  const idx = process.argv.indexOf('--output-file');
  return idx !== -1 ? (process.argv[idx + 1] ?? null) : null;
})();

function normalizeSeverity(severity: YarnSeverity | undefined): YarnSeverity {
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
  if (USE_CACHED_OUTPUT) {
    const fixture: YarnAuditTreeNode = {
      value: 'minimatch',
      children: {
        ID: 1113371,
        Issue:
          'minimatch has a ReDoS via repeated wildcards with non-matching literal in pattern',
        URL: 'https://github.com/advisories/GHSA-3ppc-4f35-3m26',
        Severity: 'high',
        'Vulnerable Versions': '<10.2.1',
        'Tree Versions': ['3.1.2', '10.1.1'],
        Dependents: [
          'eslint-plugin-n@virtual:...#npm:16.6.2',
          'glob@npm:13.0.0',
        ],
      } as YarnAuditTreeLeaf,
    };

    return {
      prod: [fixture],
      dev: [fixture],
    };
  }

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

function githubAnnotate(kind: 'error' | 'warning' | 'notice', message: string) {
  // GitHub Actions workflow command format.
  // https://docs.github.com/en/actions/using-workflows/workflow-commands-for-github-actions
  // Keep it plain; escaping is handled minimally.
  const sanitized = message.replace(/\r?\n/g, ' ');
  console.log(`::${kind}::${sanitized}`);
}

function writeStepSummary(summary: string) {
  const stepSummaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (!stepSummaryPath) {
    return;
  }

  try {
    if (!existsSync(stepSummaryPath)) {
      writeFileSync(stepSummaryPath, '', { encoding: 'utf8' });
    }
    appendFileSync(stepSummaryPath, summary, { encoding: 'utf8' });
  } catch (error) {
    // Best-effort only.
    console.warn('Failed writing step summary:', error);
  }
}

function decide(summary: Omit<TriageSummary, 'decisions'>): TriageSummary {
  // Rules:
  // - high sev development dependency advisory:
  //   - if Issue includes `ReDoS` or `DoS`, recategorize as low
  //   - otherwise: yarn-audit-diff.mts exits non-zero if it's a new advisory
  // - low/medium sev development dependency advisory OR any deprecation:
  //   - Create issue (push to main only), highlight in daily Slack message
  // - Any severity production dependency advisory:
  //   - Block RC until resolved

  const blockReleaseCandidate =
    summary.isReleaseBranch &&
    summary.advisories.some((advisory) => advisory.affectsProduction);

  return {
    ...summary,
    decisions: {
      blockReleaseCandidate,
    },
  };
}

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

  const triage = decide({
    branch: BRANCH,
    isReleaseBranch: IS_RELEASE_BRANCH,
    advisories,
    deprecations,
  });

  // Write the current advisories to disk for use by the audit-diff step.
  if (outputFileArg) {
    writeFileSync(
      outputFileArg,
      JSON.stringify(triage.advisories, null, 2),
      'utf8',
    );
  }

  const prodAdvisories = advisories.filter((a) => a.affectsProduction);
  const devAdvisories = advisories.filter((a) => a.isDevOnly);
  const downgraded = advisories.filter(
    (a) => a.originalSeverity !== a.effectiveSeverity,
  );
  const trackOnlyDev = devAdvisories.filter(
    (a) => a.effectiveSeverity === 'low' || a.effectiveSeverity === 'medium',
  );

  // Console output (machine readable)
  console.log(JSON.stringify(triage, null, 2));

  // Step summary
  const summaryTitle = `All advisories on this branch: ${advisories.length} (${prodAdvisories.length} prod, ${devAdvisories.length} dev)${deprecations.length > 0 ? `, ${deprecations.length} deprecation${deprecations.length === 1 ? '' : 's'}` : ''}`;

  const summaryLines: string[] = [];
  summaryLines.push(`<details>`);
  summaryLines.push(`<summary>${summaryTitle}</summary>`);
  summaryLines.push('');
  summaryLines.push(`- Branch: \`${triage.branch}\``);
  summaryLines.push(`- Release branch: \`${triage.isReleaseBranch}\``);
  summaryLines.push(
    `- Advisories: **${advisories.length}** (prod: **${prodAdvisories.length}**, dev: **${devAdvisories.length}**)`,
  );
  summaryLines.push(
    `- Deprecations: **${deprecations.length}**${
      CHECK_DEPRECATIONS ? '' : ' (check disabled)'
    }`,
  );
  summaryLines.push('');

  if (downgraded.length > 0) {
    summaryLines.push('### Downgraded (ReDoS/DoS rule)');
    summaryLines.push('');
    for (const advisory of downgraded) {
      summaryLines.push(`- ${formatAdvisoryLine(advisory)}`);
    }
    summaryLines.push('');
  }

  if (trackOnlyDev.length > 0 || deprecations.length > 0) {
    summaryLines.push('### Track (issue + Slack reminder)');
    summaryLines.push('');
    for (const advisory of trackOnlyDev) {
      summaryLines.push(`- ${formatAdvisoryLine(advisory)}`);
    }
    for (const dep of deprecations) {
      summaryLines.push(`- [deprecation] ${dep.message}`);
    }
    summaryLines.push('');
  }

  if (triage.isReleaseBranch) {
    summaryLines.push('### Release branch decision');
    summaryLines.push('');
    summaryLines.push(
      triage.decisions.blockReleaseCandidate
        ? '- **BLOCK RC**: Production dependency advisory present on a release branch.'
        : '- No production advisories on a release branch — RC not blocked.',
    );
    summaryLines.push('');
  }

  summaryLines.push('</details>');

  writeStepSummary(summaryLines.join('\n'));

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

  // Create an issue for non-blocking but track-worthy findings.
  // Only run on push to main — not on PRs, not on other branches.
  if (
    CREATE_TRACKING_ISSUE &&
    (trackOnlyDev.length > 0 || deprecations.length > 0) &&
    process.env.GITHUB_EVENT_NAME === 'push' &&
    BRANCH === 'main'
  ) {
    const repo = getRepoFromEnv();

    if (!repo) {
      githubAnnotate(
        'warning',
        'CREATE_TRACKING_ISSUE=true but missing GITHUB_REPOSITORY; skipping issue creation.',
      );
    } else {
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
      } else {
        const bodyLines: string[] = [];
        bodyLines.push('Automated dependency audit triage.');
        bodyLines.push('');
        bodyLines.push(`- Branch: ${BRANCH}`);
        bodyLines.push(`- Release branch: ${IS_RELEASE_BRANCH}`);
        bodyLines.push('');

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
    }
  }

  // Fork PRs: exit non-zero if any advisory exists (no token to post statuses).
  // Internal PRs: always exit 0; the audit-diff step gates them by exiting non-zero.
  if (IS_FORK_PR && advisories.length > 0) {
    process.exitCode = 1;
  } else if (triage.decisions.blockReleaseCandidate) {
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
