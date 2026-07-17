/**
 * Extracts cherry-picks and changelog commits from git history
 * and generates the "What's in this RC" markdown section for PR comments.
 *
 * Two sections are generated:
 * 1. Cherry-picks: Commits on the release branch after forking from main
 * (ancestry-path from merge-base to HEAD)
 * 2. Changelog: Commits since the previous release tag. For Runway releases,
 * falls back to the release branch when main-line changelog is empty or
 * only `release:` commits.
 */

import { execFileSync } from 'child_process';

const REPO_URL = process.env.GITHUB_REPOSITORY
  ? `https://github.com/${process.env.GITHUB_REPOSITORY}`
  : 'https://github.com/MetaMask/metamask-extension';

const RELEASE_TAG_LIST_PATTERN = 'v*.*.*';

const SKIP_MERGE_COMMIT_SUBJECT =
  /^Merge (branch|pull request|remote-tracking)/u;

// GitHub-hosted Ubuntu runners install Git here; avoid resolving it via PATH.
const GIT_EXECUTABLE = '/usr/bin/git';

type CommitInfo = {
  hash: string;
  subject: string;
};

export type WhatsInRcResult = {
  cherryPicks: CommitInfo[];
  changelog: CommitInfo[];
  mergeBase: string;
  previousTag: string | null;
  changelogFromReleaseBranch: boolean;
};

function sanitizeAnchorSuffix(anchorSuffix?: string): string {
  if (!anchorSuffix) {
    return '';
  }

  return anchorSuffix
    .toLowerCase()
    .replace(/[^a-z0-9_-]/gu, '-')
    .replace(/-+/gu, '-')
    .replace(/^-|-$/gu, '');
}

export function getWhatsInRcAnchorId(anchorSuffix?: string): string {
  const sanitizedSuffix = sanitizeAnchorSuffix(anchorSuffix);
  return sanitizedSuffix
    ? `whats-in-this-rc-${sanitizedSuffix}`
    : 'whats-in-this-rc';
}

export function getCherryPicksAnchorId(anchorSuffix?: string): string {
  const sanitizedSuffix = sanitizeAnchorSuffix(anchorSuffix);
  return sanitizedSuffix ? `cherry-picks-${sanitizedSuffix}` : 'cherry-picks';
}

export function getChangelogAnchorId(anchorSuffix?: string): string {
  const sanitizedSuffix = sanitizeAnchorSuffix(anchorSuffix);
  return sanitizedSuffix ? `changelog-${sanitizedSuffix}` : 'changelog';
}

function git(...args: string[]): string {
  return execFileSync(GIT_EXECUTABLE, args, { encoding: 'utf8' }).trim();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parseGitLog(
  logOutput: string,
  { skipMergeCommits = false }: { skipMergeCommits?: boolean } = {},
): CommitInfo[] {
  if (!logOutput) {
    return [];
  }
  return logOutput
    .split('\n')
    .map((line) => {
      const [hash, ...subjectParts] = line.split(' ');
      return { hash, subject: subjectParts.join(' ') };
    })
    .filter((commit) => {
      if (!skipMergeCommits) {
        return true;
      }
      return !SKIP_MERGE_COMMIT_SUBJECT.test(commit.subject.trim());
    });
}

/**
 * Get the most recent release tag merged into a given commit.
 * Uses --merged to find the highest version tag that is an ancestor of the commit.
 * @param mergeBase
 */
function getPreviousReleaseTag(mergeBase: string): string | null {
  try {
    const out = git(
      'tag',
      '--sort=-version:refname',
      '--list',
      RELEASE_TAG_LIST_PATTERN,
      '--merged',
      mergeBase,
    );
    const tags = out
      .split('\n')
      .map((tag) => tag.trim())
      .filter(Boolean)
      // Exclude prerelease tags such as v13.40.0-flask.0
      .filter((tag) => !tag.includes('-'));
    return tags[0] || null;
  } catch (error) {
    throw new Error(
      `Unable to find previous release tag for merge base ${mergeBase}: ${getErrorMessage(error)}`,
    );
  }
}

function getCherryPicks(mergeBase: string): CommitInfo[] {
  const log = git(
    'log',
    '--ancestry-path',
    '--format=%h %s',
    `${mergeBase}..HEAD`,
  );
  return parseGitLog(log);
}

/**
 * Get commits between two refs.
 *
 * @param fromRef
 * @param toRef
 * @param firstParent - If true, use --first-parent for main-line history.
 */
function getCommitsBetween(
  fromRef: string,
  toRef: string,
  firstParent = true,
): CommitInfo[] {
  const args = ['log', '--format=%h %s', `${fromRef}..${toRef}`];
  if (firstParent) {
    args.push('--first-parent');
  }
  const log = git(...args);
  return parseGitLog(log, { skipMergeCommits: true });
}

export function extractWhatsInRc(): WhatsInRcResult {
  const mergeBase = git('merge-base', 'HEAD', 'origin/main');
  const previousTag = getPreviousReleaseTag(mergeBase);
  const cherryPicks = getCherryPicks(mergeBase);

  let changelog: CommitInfo[] = [];
  let changelogFromReleaseBranch = false;

  if (previousTag) {
    // First try: commits on main from previous release to merge-base
    changelog = getCommitsBetween(previousTag, mergeBase, true);

    // Runway releases often have an empty main-line range (or only release
    // bumps) because features land via cherry-picks on the release branch.
    const isOnlyReleaseCommits =
      changelog.length > 0 &&
      changelog.every((commit) => commit.subject.startsWith('release:'));

    if (changelog.length === 0 || isOnlyReleaseCommits) {
      changelog = getCommitsBetween(previousTag, 'HEAD', false);
      changelogFromReleaseBranch = true;
    }
  }

  return {
    cherryPicks,
    changelog,
    mergeBase,
    previousTag,
    changelogFromReleaseBranch,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/gu, '&amp;')
    .replace(/</gu, '&lt;')
    .replace(/>/gu, '&gt;');
}

function formatCommitRow(commit: CommitInfo): string {
  const commitLink = `[\`${commit.hash}\`](${REPO_URL}/commit/${commit.hash})`;
  const subject = escapeHtml(commit.subject.replace(/\r?\n/gu, ' '))
    .replace(/\\/gu, '\\\\')
    .replace(/\|/gu, '\\|')
    .replace(/\(#(\d+)\)/gu, `([#$1](${REPO_URL}/pull/$1))`);
  return `| ${commitLink} | ${subject} |`;
}

function buildCommitsTable(
  commits: CommitInfo[],
  summaryText: string,
  anchorId: string,
): string {
  if (commits.length === 0) {
    return '';
  }

  const rows = commits.map(formatCommitRow).join('\n');

  return `<a id="${anchorId}"></a>
<details>
<summary>${summaryText}</summary>

| Commit | Description |
| :--- | :--- |
${rows}

</details>

`;
}

export function buildWhatsInRcSection(
  result: WhatsInRcResult,
  anchorSuffix?: string,
): string {
  const { cherryPicks, changelog, previousTag, changelogFromReleaseBranch } =
    result;
  const anchorId = getWhatsInRcAnchorId(anchorSuffix);

  let section = `<a id="${anchorId}"></a>
### :cherries: What's in this RC

`;

  if (cherryPicks.length === 0 && changelog.length === 0) {
    return `${section}<p><i>No cherry-picks or changelog commits found.</i></p>\n\n`;
  }

  if (cherryPicks.length > 0) {
    section += buildCommitsTable(
      cherryPicks,
      `Cherry-picks (${cherryPicks.length} commits)`,
      getCherryPicksAnchorId(anchorSuffix),
    );
  }

  if (changelog.length > 0) {
    const changelogLabel = changelogFromReleaseBranch
      ? `Changelog (${changelog.length} commits since ${previousTag})`
      : `Changelog (${changelog.length} commits from main at RC cut)`;
    section += buildCommitsTable(
      changelog,
      changelogLabel,
      getChangelogAnchorId(anchorSuffix),
    );
  }

  return section;
}

export function buildWhatsInRcFailureSection(
  error?: string,
  anchorSuffix?: string,
): string {
  const errorMsg = error ? `: ${escapeHtml(error)}` : '';
  const anchorId = getWhatsInRcAnchorId(anchorSuffix);
  return `<a id="${anchorId}"></a>
### :cherries: What's in this RC

<p><i>Unable to extract cherry-picks and changelog${errorMsg}</i></p>

`;
}

// CLI test runner
if (process.argv[1]?.endsWith('cherry-picks-section.ts')) {
  try {
    const result = extractWhatsInRc();
    console.log("=== What's in this RC ===");
    console.log(`Merge base: ${result.mergeBase}`);
    console.log(`Previous tag: ${result.previousTag ?? 'none'}`);
    console.log(`Cherry-picks: ${result.cherryPicks.length}`);
    console.log(`Changelog commits: ${result.changelog.length}`);
    console.log(
      `Changelog source: ${
        result.changelogFromReleaseBranch
          ? 'release branch fallback'
          : 'main at RC cut'
      }`,
    );
    console.log('\n--- Cherry-picks ---');
    result.cherryPicks.forEach((c) => console.log(`${c.hash} ${c.subject}`));
    console.log('\n--- Changelog ---');
    result.changelog.forEach((c) => console.log(`${c.hash} ${c.subject}`));
    console.log('\n--- Generated Markdown ---');
    console.log(buildWhatsInRcSection(result));
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}
