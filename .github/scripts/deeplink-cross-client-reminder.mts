// Posts a PR reminder when deeplink-related changes are detected.

import { context, getOctokit } from '@actions/github';

const PR_COMMENT_MARKER = '<!-- deeplink-cross-client-reminder -->';
const CHRISTIAN_HANDLE = '@Montoya';
const MAX_MATCHED_FILES_IN_COMMENT = 10;

const DEEPLINK_FILE_PATTERNS = [
  /(^|\/)deeplink/i,
  /(^|\/)deep-link/i,
  /(^|\/)universal-link/i,
  /(^|\/)app-link/i,
  /^app\/scripts\/lib\/deep-links\//i,
  /^shared\/lib\/deep-linking\./i,
  /^shared\/lib\/deep-links\//i,
  /^ui\/pages\/deep-link\//i,
  /^test\/e2e\/tests\/deep-link\//i,
] as const;

const DEEPLINK_LINE_PATTERNS = [
  /\blink(?:-test)?\.metamask\.io\b/i,
  /\bmetamask:\/\//i,
  /\bethereum:\/\//i,
  /\bwc:\/\//i,
  /\bdeeplink(s|ing)?\b/i,
  /\bdeep[- ]link(s|ing)?\b/i,
  /\buniversal link(s)?\b/i,
  /\bapp link(s)?\b/i,
] as const;

type Octokit = ReturnType<typeof getOctokit>;

async function main(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const pr = context.payload.pull_request;

  if (!token || !pr) {
    console.log('Not in a GitHub Actions PR context - skipping deeplink check.');
    return;
  }

  const octokit = getOctokit(token);
  const { owner, repo } = context.repo;
  const prNumber = pr.number;
  const matchedFiles = await getMatchedFiles(octokit, owner, repo, prNumber);

  if (matchedFiles.length === 0) {
    await deletePrComment(octokit, owner, repo, prNumber);
    console.log('No deeplink-related changes detected.');
    return;
  }

  await upsertPrComment(
    octokit,
    owner,
    repo,
    prNumber,
    buildCommentBody(matchedFiles, pr.user?.login),
  );
}

async function getMatchedFiles(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<string[]> {
  const changedFiles = await octokit.paginate(octokit.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: prNumber,
    per_page: 100,
  });

  return changedFiles
    .filter((file) => {
      const pathMatches = DEEPLINK_FILE_PATTERNS.some((pattern) =>
        pattern.test(file.filename),
      );
      const lineMatches = getAddedOrChangedLines(file.patch).some((line) =>
        DEEPLINK_LINE_PATTERNS.some((pattern) => pattern.test(line)),
      );

      return pathMatches || lineMatches;
    })
    .map((file) => file.filename);
}

function getAddedOrChangedLines(patch = ''): string[] {
  return patch
    .split('\n')
    .filter((line) => line.startsWith('+') && !line.startsWith('+++'))
    .map((line) => line.slice(1));
}

function buildCommentBody(matchedFiles: string[], authorLogin?: string): string {
  const fileList = matchedFiles
    .slice(0, MAX_MATCHED_FILES_IN_COMMENT)
    .map((filename) => `- \`${filename}\``)
    .join('\n');
  const remainingCount = matchedFiles.length - MAX_MATCHED_FILES_IN_COMMENT;
  const remainingLine =
    remainingCount > 0 ? `\n- ...and ${remainingCount} more file(s)` : '';
  const authorMention = authorLogin ? `@${authorLogin}` : 'PR author';

  return [
    PR_COMMENT_MARKER,
    `${CHRISTIAN_HANDLE} ${authorMention} deeplink-related changes were detected in this PR.`,
    '',
    [
      'New or changed deeplinks need matching support in both MetaMask Mobile',
      'and MetaMask Extension. Please also verify Branch LinkHub coverage',
      'when applicable.',
    ].join(' '),
    '',
    [
      'Please link the matching client PR, or explain why this deeplink is',
      'intentionally client-specific. If an experience is only supported on',
      'Mobile, Extension should include a matching route that guides users to',
      'the Mobile experience.',
    ].join(' '),
    '',
    'Matched file(s):',
    `${fileList}${remainingLine}`,
  ].join('\n');
}

async function upsertPrComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
  body: string,
): Promise<void> {
  try {
    const existingComment = await findMarkerComment(
      octokit,
      owner,
      repo,
      prNumber,
    );

    if (existingComment) {
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existingComment.id,
        body,
      });
      console.log(`Updated deeplink reminder comment ${existingComment.id}.`);
      return;
    }

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    });
    console.log('Posted deeplink reminder comment.');
  } catch (error) {
    console.warn('Failed to post deeplink reminder comment:', error);
  }
}

async function deletePrComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<void> {
  try {
    const existingComment = await findMarkerComment(
      octokit,
      owner,
      repo,
      prNumber,
    );

    if (existingComment) {
      await octokit.rest.issues.deleteComment({
        owner,
        repo,
        comment_id: existingComment.id,
      });
      console.log('Deleted stale deeplink reminder comment.');
    }
  } catch {
    // Comment cleanup is best-effort.
  }
}

async function findMarkerComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<{ id: number } | undefined> {
  const iterator = octokit.paginate.iterator(octokit.rest.issues.listComments, {
    owner,
    repo,
    issue_number: prNumber,
    per_page: 100,
  });

  for await (const { data: comments } of iterator) {
    const found = comments.find((comment) =>
      comment.body?.includes(PR_COMMENT_MARKER),
    );

    if (found) {
      return { id: found.id };
    }
  }

  return undefined;
}

await main();
