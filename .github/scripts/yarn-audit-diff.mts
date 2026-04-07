import { readFileSync } from 'fs';
import { getGitHubToken } from './shared/github-token.mts';

// ---------------------------------------------------------------------------
// CLI args
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);

const baselineFile = (() => {
  const i = args.indexOf('--baseline-file');
  return i !== -1 ? (args[i + 1] ?? null) : null;
})();

const currentFile = (() => {
  const i = args.indexOf('--current-file');
  return i !== -1 ? (args[i + 1] ?? null) : null;
})();

// When set, a missing or empty baseline posts `success` instead of `failure`.
// Used during rollout before the first push-to-main deposits the baseline
// artifact. Remove this flag after the first successful main push.
const skipIfNoBaseline = args.includes('--skip-if-no-baseline');

// ---------------------------------------------------------------------------
// Environment
// ---------------------------------------------------------------------------

const token = getGitHubToken();
const repository = process.env.GITHUB_REPOSITORY ?? '';
// On `pull_request` events GITHUB_SHA is the ephemeral merge commit, not the
// PR head. The workflow step passes the real head SHA via GITHUB_HEAD_SHA.
const headSha = process.env.GITHUB_HEAD_SHA || process.env.GITHUB_SHA || '';

const [repoOwner, repoName] = repository.split('/');

// ---------------------------------------------------------------------------
// Types (subset of ParsedAdvisory from yarn-audit-and-triage.mts)
// ---------------------------------------------------------------------------

type ParsedAdvisory = {
  id: number | null;
  moduleName: string;
  title: string;
  url: string;
  effectiveSeverity?: string;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readAdvisories(filePath: string | null): ParsedAdvisory[] | null {
  if (!filePath) {
    return null;
  }
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
// Commit status
// ---------------------------------------------------------------------------

// Commit statuses have no check suite concept so they are never misattributed
// to another app's suite in the PR sidebar. The tradeoff vs check runs is no
// inline file annotations, but our annotations only pointed to .github#L1
// which was not useful. The summary text carries all relevant information.
async function postCommitStatusQuietly(
  state: 'success' | 'failure',
  description: string,
): Promise<void> {
  try {
    if (!repoOwner || !repoName || !headSha) {
      console.log('::notice::Missing repo/sha — skipping commit status post.');
      return;
    }
    const url = `https://api.github.com/repos/${repoOwner}/${repoName}/statuses/${headSha}`;
    const resp = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'yarn-audit-diff',
      },
      body: JSON.stringify({
        state,
        context: 'Audit: no new vulnerabilities',
        description: description.slice(0, 140), // GitHub limit
      }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      console.log(
        `::notice::Could not post commit status (fork token?): ${resp.status} ${text}`,
      );
    }
  } catch (e) {
    console.log(
      `::notice::Could not post commit status (fork token?): ${String(e)}`,
    );
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  if (!currentFile) {
    console.error('--current-file is required');
    process.exitCode = 1;
    return;
  }

  const current = readAdvisories(currentFile);
  if (!current) {
    console.error(`Could not read current advisories from: ${currentFile}`);
    process.exitCode = 1;
    return;
  }

  const baseline = readAdvisories(baselineFile);
  const baselineIsEmpty = !baseline || baseline.length === 0;

  // ------------------------------------------------------------------
  // Missing / empty baseline
  // ------------------------------------------------------------------
  if (baselineIsEmpty) {
    if (skipIfNoBaseline) {
      // Rollout mode: no baseline available yet. Post success and exit 0 so
      // this PR isn't blocked. Remove --skip-if-no-baseline after the first
      // push-to-main run deposits the baseline artifact.
      console.log(
        '::notice::No baseline found — posting success (skip-if-no-baseline mode).',
      );
      writeResult({
        conclusion: 'success',
        title: 'No baseline yet',
        summary:
          'Baseline artifact not yet available. Diff skipped (rollout mode — `--skip-if-no-baseline` flag is set).',
        annotations: [],
      });
      return;
    }

    // No baseline = treat all current advisories as new → block.
    console.log(
      `::warning::No baseline found. Treating all ${current.length} advisory/advisories as new.`,
    );
    const summary =
      `No baseline artifact found. Treating all **${current.length}** advisory/advisories as new.\n\n` +
      current
        .map((a) => `- [${sevLabel(a)}] \`${a.moduleName}\` — ${a.title}`)
        .join('\n');
    await postCommitStatusQuietly(
      'failure',
      `No baseline — ${current.length} advisories treated as new.`,
    );
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
    await postCommitStatusQuietly(
      'success',
      `No new advisories. ${current.length} current vs ${baseline.length} baseline.`,
    );
    return;
  }

  // New advisories found — post a failure check run.
  console.log(
    `Found ${newAdvisories.length} new advisory/advisories not in baseline.`,
  );
  for (const a of newAdvisories) {
    console.log(`  [${sevLabel(a)}] ${a.moduleName} — ${a.title} (${a.url})`);
  }

  const summaryBody =
    `Found **${newAdvisories.length}** new advisory/advisories not present in the baseline.\n\n` +
    newAdvisories
      .map(
        (a) =>
          `- [${sevLabel(a)}] \`${a.moduleName}\` — ${a.title} (<${a.url}>)`,
      )
      .join('\n');

  const newDesc = newAdvisories
    .slice(0, 3)
    .map((a) => `${a.moduleName} (${sevLabel(a)})`)
    .join(', ');
  const description = `${newAdvisories.length} new: ${newDesc}${newAdvisories.length > 3 ? ', …' : ''}`;
  await postCommitStatusQuietly('failure', description);
}

try {
  await main();
} catch (error) {
  console.error(error);
  process.exitCode = 1;
}
