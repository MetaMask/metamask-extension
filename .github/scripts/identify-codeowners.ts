import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import { retrievePullRequestFiles } from './shared/pull-request';
import micromatch from 'micromatch';

type TeamFiles = Record<string, string[]>;

type TeamEmojis = {
  [team: string]: string;
}

type CodeOwnerRule = {
  pattern: string;
  owners: string[];
}

// Team emoji mappings
const teamEmojis: TeamEmojis = {
  '@MetaMask/extension-devs': '🧩',
  '@MetaMask/policy-reviewers': '📜',
  '@MetaMask/supply-chain': '🔗',
  '@MetaMask/snaps-devs': '🫰',
  '@MetaMask/extension-security-team': '🔒',
  '@MetaMask/extension-privacy-reviewers': '🕵️',
  '@MetaMask/confirmations': '✅',
  '@MetaMask/design-system-engineers': '🎨',
  '@MetaMask/notifications': '🔔',
  '@MetaMask/identity': '🪪',
  '@MetaMask/accounts-engineers': '🔑',
  '@MetaMask/swaps-engineers': '🔄',
  '@MetaMask/ramp': '📈',
  '@MetaMask/wallet-ux': '🖥️',
  '@MetaMask/metamask-assets': '💎',
};

main().catch((error: Error): void => {
  console.error(error);
  process.exit(1);
});

async function main(): Promise<void> {
  const PR_COMMENT_TOKEN = process.env.PR_COMMENT_TOKEN;
  if (!PR_COMMENT_TOKEN) {
    core.setFailed('PR_COMMENT_TOKEN not found');
    process.exit(1);
  }

  // Initialise octokit, required to call Github API
  const octokit: InstanceType<typeof GitHub> = getOctokit(PR_COMMENT_TOKEN);


  const owner = context.repo.owner;
  const repo = context.repo.repo;
  const prNumber = context.payload.pull_request?.number;
  if (!prNumber) {
    core.setFailed('Pull request number not found');
    process.exit(1);
  }

  // Get the changed files in the PR
  const changedFiles = await retrievePullRequestFiles(octokit, owner, repo, prNumber);

  // Read and parse the CODEOWNERS file
  const codeownersContent = await getCodeownersContent(octokit, owner, repo);
  const codeowners = parseCodeowners(codeownersContent);

  // Match files to codeowners
  const fileOwners = matchFilesToCodeowners(changedFiles, codeowners);

  // Group files by team
  const teamFiles = groupFilesByTeam(fileOwners);

  // If no teams need to review, don't create or update comments
  if (Object.keys(teamFiles).length === 0) {
    console.log('No files requiring codeowner review, skipping comment');

    // Check for existing bot comment and delete it if it exists
    // (in case previous version of PR had files requiring review)
    await deleteExistingComment(octokit, owner, repo, prNumber);
    return;
  }

  // Create the comment body
  const commentBody = createCommentBody(teamFiles, teamEmojis);

  // Check for an existing comment and update or create as needed
  await updateOrCreateComment(octokit, owner, repo, prNumber, commentBody);
}

async function getCodeownersContent(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string
): Promise<string> {
  try {
    const response = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: '.github/CODEOWNERS',
      headers: {
        'accept': 'application/vnd.github.raw',
      },
    });

    if (response) {
      return response.data as unknown as string;
    }

    throw new Error('Failed to get CODEOWNERS file content');
  } catch (error) {
    throw new Error(`Failed to get CODEOWNERS file: ${error instanceof Error ? error.message : String(error)}`);
  }
}

function parseCodeowners(content: string): CodeOwnerRule[] {
  return content
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .map(line => {
      const [pattern, ...owners] = line.trim().split(/\s+/);
      return { pattern, owners };
    });
}

function matchFilesToCodeowners(files: string[], codeowners: CodeOwnerRule[]): Map<string, Set<string>> {
  const fileOwners: Map<string, Set<string>> = new Map();

  files.forEach(file => {
    for (const { pattern, owners } of codeowners) {
      if (isFileMatchingPattern(file, pattern)) {
        // Not breaking here to allow for multiple patterns to match the same file
        // i.e. if a directory is owned by one team, but specific files within that directory
        // are also owned by another team, the file will be added to both teams
        const ownerSet = fileOwners.get(file);
        if (!ownerSet) {
          fileOwners.set(file, new Set(owners));
        } else {
          owners.forEach((owner) => ownerSet.add(owner));
        }
      }
    }
  });

  return fileOwners;
}

function isFileMatchingPattern(file: string, pattern: string): boolean {
  // Case 1: Pattern explicitly ends with a slash (e.g., "docs/")
  if (pattern.endsWith('/')) {
    return micromatch.isMatch(file, `${pattern}**`);
  }

  // Case 2: Pattern doesn't end with a file extension - treat as directory
  if (!pattern.match(/\.[^/]*$/)) {
    // Treat as directory - match this path and everything under it
    return micromatch.isMatch(file, `${pattern}/**`);
  }

  // Case 3: Pattern with file extension or already has wildcards
  return micromatch.isMatch(file, pattern);
}

function groupFilesByTeam(fileOwners: Map<string, Set<string>>): TeamFiles {
  const teamFiles: TeamFiles = {};

  fileOwners.forEach((owners, file) => {
    owners.forEach(owner => {
      if (!teamFiles[owner]) {
        teamFiles[owner] = [];
      }
      teamFiles[owner].push(file);
    });
  });

  // Sort files within each team for consistent ordering
  Object.values(teamFiles).forEach(files => files.sort());

  return teamFiles;
}

function createCommentBody(teamFiles: TeamFiles, teamEmojis: TeamEmojis): string {
  let commentBody = `<!-- METAMASK-CODEOWNERS-BOT -->\n✨ Files requiring CODEOWNER review ✨\n---\n`;

  // Sort teams for consistent ordering
  const allOwners = Object.keys(teamFiles);

  const teamOwners = allOwners.filter(owner => owner.startsWith('@MetaMask/'));
  const individualOwners = allOwners.filter(owner => !owner.startsWith('@MetaMask/'));

  const sortFn = (a, b) => a.toLowerCase().localeCompare(b.toLowerCase());
  const sortedTeamOwners = teamOwners.sort(sortFn);
  const sortedIndividualOwners = individualOwners.sort(sortFn);
  const sortedOwners = [...sortedTeamOwners, ...sortedIndividualOwners];

  sortedOwners.forEach((team, index) => {
    const emoji = teamEmojis[team] || '👨‍🔧';
    const files = teamFiles[team];

    // Create a collapsible section for each team
    commentBody += `\n<details>\n<summary>${emoji} <strong>${team}</strong> (${files.length} files)</summary>\n\n`;

    // Create a file tree structure
    const fileTree = buildFileTree(files);
    commentBody += renderFileTree(fileTree, 0);

    commentBody += '</details>\n';

    // Only add divider if not the last team
    if (index < sortedOwners.length - 1) {
      commentBody += '\n---\n';
    }
  });

  return commentBody;
}

// Helper function to build a file tree structure
function buildFileTree(files: string[]): Record<string, any> {
  const tree: Record<string, any> = {};

  files.forEach(file => {
    const parts = file.split('/');
    let current = tree;

    // Build the nested structure
    parts.forEach((part, i) => {
      if (i === parts.length - 1) {
        // Leaf node (file)
        current[part] = null;
      } else {
        // Directory
        if (!current[part]) {
          current[part] = {};
        }
        current = current[part];
      }
    });
  });

  return tree;
}

// Helper function to render the file tree with indentation
function renderFileTree(node: Record<string, any>, depth: number): string {
  let result = '';

  // Use different bullet styles for directories vs files
  const getBullet = (isDir: boolean) => {
    return isDir ? '◦' : '▪'; // Round bullet for directories, square for files
  };

  // Sort keys to keep directories first, then files
  const keys = Object.keys(node).sort((a, b) => {
    const aIsDir = node[a] !== null;
    const bIsDir = node[b] !== null;
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });

  keys.forEach(key => {
    const isDir = node[key] !== null;
    const indent = '  '.repeat(depth);
    const bullet = getBullet(isDir);

    if (!isDir) {
      // File - use code formatting which appears as a different color in GitHub
      result += `${indent}${bullet} \`${key}\`\n`;
    } else {
      // Directory - with italic instead of bold
      result += `${indent}${bullet} *${key}/*\n`;
      result += renderFileTree(node[key], depth + 1);
    }
  });

  return result;
}

async function deleteExistingComment(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  prNumber: number
): Promise<void> {
  // Get existing comments
  const { data: comments } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
  });

  const botComment = comments.find(comment =>
    comment.body?.includes('<!-- METAMASK-CODEOWNERS-BOT -->')
  );

  if (botComment) {
    // Delete the existing comment
    await octokit.rest.issues.deleteComment({
      owner,
      repo,
      comment_id: botComment.id,
    });

    console.log('Deleted existing codeowners comment');
  }
}

async function updateOrCreateComment(
  octokit: InstanceType<typeof GitHub>,
  owner: string,
  repo: string,
  prNumber: number,
  commentBody: string
): Promise<void> {
  // Get existing comments
  const { data: comments } = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
  });

  const botComment = comments.find(comment =>
    comment.body?.includes('<!-- METAMASK-CODEOWNERS-BOT -->')
  );

  if (botComment) {
    // Simple text comparison is sufficient since we control both sides
    if (botComment.body !== commentBody) {
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: botComment.id,
        body: commentBody,
      });

      console.log('Updated existing codeowners comment');
    } else {
      console.log('No changes to codeowners, skipping comment update');
    }
  } else {
    // Create new comment
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body: commentBody,
    });

    console.log('Created new codeowners comment');
  }
}