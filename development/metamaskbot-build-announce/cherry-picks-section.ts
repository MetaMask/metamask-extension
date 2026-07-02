/**
 * Extracts cherry-picks and changelog commits from git history
 * and generates the "What's in this RC" markdown section for PR comments.
 */

import { execFileSync } from 'child_process';

const REPO_URL = process.env.GITHUB_REPOSITORY
  ? `https://github.com/${process.env.GITHUB_REPOSITORY}`
  : 'https://github.com/MetaMask/metamask-extension';

const RELEASE_TAG_PATTERN = 'v[0-9]*.[0-9]*.[0-9]*';

const PRERELEASE_TAG_PATTERN = '*-*';

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
};

export function getWhatsInRcAnchorId(anchorSuffix?: string): string {
  if (!anchorSuffix) {
    return 'whats-in-this-rc';
  }

  const sanitizedSuffix = anchorSuffix
    .toLowerCase()
    .replace(/[^a-z0-9_-]/gu, '-')
    .replace(/-+/gu, '-')
    .replace(/^-|-$/gu, '');

  return sanitizedSuffix
    ? `whats-in-this-rc-${sanitizedSuffix}`
    : 'whats-in-this-rc';
}

function git(...args: string[]): string {
  return execFileSync(GIT_EXECUTABLE, args, { encoding: 'utf8' }).trim();
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function parseGitLog(logOutput: string): CommitInfo[] {
  if (!logOutput) {
    return [];
  }
  return logOutput.split('\n').map((line) => {
    const [hash, ...subjectParts] = line.split(' ');
    return { hash, subject: subjectParts.join(' ') };
  });
}

function getPreviousReleaseTag(mergeBase: string): string {
  try {
    return git(
      'describe',
      '--tags',
      '--abbrev=0',
      '--match',
      RELEASE_TAG_PATTERN,
      '--exclude',
      PRERELEASE_TAG_PATTERN,
      `${mergeBase}^`,
    );
  } catch (error) {
    throw new Error(
      `Unable to find previous release tag before merge base ${mergeBase}: ${getErrorMessage(error)}`,
    );
  }
}

function getCherryPicks(mergeBase: string): CommitInfo[] {
  const log = git('log', '--format=%h %s', `${mergeBase}..HEAD`);
  return parseGitLog(log);
}

function getChangelogCommits(
  mergeBase: string,
  previousTag: string | null,
): CommitInfo[] {
  if (!previousTag) {
    return [];
  }
  const log = git('log', '--format=%h %s', `${previousTag}..${mergeBase}`);
  return parseGitLog(log);
}

export function extractWhatsInRc(): WhatsInRcResult {
  const mergeBase = git('merge-base', 'HEAD', 'origin/main');
  const previousTag = getPreviousReleaseTag(mergeBase);
  const cherryPicks = getCherryPicks(mergeBase);
  const changelog = getChangelogCommits(mergeBase, previousTag);

  return { cherryPicks, changelog, mergeBase, previousTag };
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
  const { cherryPicks, changelog } = result;
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
      'cherry-picks',
    );
  }

  if (changelog.length > 0) {
    section += buildCommitsTable(
      changelog,
      `Changelog (${changelog.length} commits from main at RC cut)`,
      'changelog',
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
