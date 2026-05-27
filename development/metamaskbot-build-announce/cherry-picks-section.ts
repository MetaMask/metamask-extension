/**
 * Extracts cherry-picks and changelog commits from git history
 * and generates the "What's in this RC" markdown section for PR comments.
 */

import { execFileSync } from 'child_process';

const REPO_URL = process.env.GITHUB_REPOSITORY
  ? `https://github.com/${process.env.GITHUB_REPOSITORY}`
  : 'https://github.com/MetaMask/metamask-extension';

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

function git(...args: string[]): string {
  return execFileSync('git', args, { encoding: 'utf8' }).trim();
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

function getPreviousTag(mergeBase: string): string | null {
  try {
    return git('describe', '--tags', '--abbrev=0', `${mergeBase}^`);
  } catch {
    return null;
  }
}

function getCherryPicks(mergeBase: string): CommitInfo[] {
  try {
    const log = git('log', '--oneline', '--format=%h %s', `${mergeBase}..HEAD`);
    return parseGitLog(log);
  } catch {
    return [];
  }
}

function getChangelogCommits(
  mergeBase: string,
  previousTag: string | null,
): CommitInfo[] {
  if (!previousTag) {
    return [];
  }
  try {
    const log = git(
      'log',
      '--oneline',
      '--format=%h %s',
      `${previousTag}..${mergeBase}`,
    );
    return parseGitLog(log);
  } catch {
    return [];
  }
}

export function extractWhatsInRc(): WhatsInRcResult {
  const mergeBase = git('merge-base', 'HEAD', 'origin/main');
  const previousTag = getPreviousTag(mergeBase);
  const cherryPicks = getCherryPicks(mergeBase);
  const changelog = getChangelogCommits(mergeBase, previousTag);

  return { cherryPicks, changelog, mergeBase, previousTag };
}

function formatCommitRow(commit: CommitInfo): string {
  const commitLink = `[\`${commit.hash}\`](${REPO_URL}/commit/${commit.hash})`;
  const subject = commit.subject.replace(
    /\(#(\d+)\)/gu,
    `([#$1](${REPO_URL}/pull/$1))`,
  );
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

export function buildWhatsInRcSection(result: WhatsInRcResult): string {
  const { cherryPicks, changelog } = result;

  if (cherryPicks.length === 0 && changelog.length === 0) {
    return '';
  }

  let section = `<a id="whats-in-this-rc"></a>
### :cherries: What's in this RC

`;

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

export function buildWhatsInRcFailureSection(error?: string): string {
  const errorMsg = error ? `: ${error}` : '';
  return `<a id="whats-in-this-rc"></a>
### :cherries: What's in this RC

<p><i>Unable to extract cherry-picks and changelog${errorMsg}</i></p>

`;
}

// CLI test runner
if (process.argv[1]?.endsWith('cherry-picks-section.ts')) {
  try {
    const result = extractWhatsInRc();
    console.log('=== What\'s in this RC ===');
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
