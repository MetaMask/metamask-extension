import * as core from '@actions/core';
import { context, getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import { retrievePullRequestFiles, PullRequestFile } from './shared/pull-request';
import micromatch from 'micromatch';



type TeamFiles = Record<string, PullRequestFile[]>;

type TeamChanges = {
  files: number;
  additions: number;
  deletions: number;
}

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
  '@MetaMask/core-platform': '🫰',
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
  '@MetaMask/web3auth': '🔐',
  '@MetaMask/transactions': '💸',
  '@MetaMask/qa': '🧪',
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

  // Get detailed file change information
  const filesInfo: PullRequestFile[] = await retrievePullRequestFiles(octokit, owner, repo, prNumber);

  // Read and parse the CODEOWNERS file
  const codeownersContent = await getCodeownersContent(octokit, owner, repo);
  const codeowners = parseCodeowners(codeownersContent);

  // Match files to codeowners
  const fileOwners = matchFilesToCodeowners(filesInfo, codeowners);

  // Group files by team
  const teamFiles = groupFilesByTeam(fileOwners, filesInfo);

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

function matchFilesToCodeowners(files: PullRequestFile[], codeowners: CodeOwnerRule[]): Map<string, Set<string>> {
  const fileOwners: Map<string, Set<string>> = new Map();

  files.forEach(file => {
    for (const { pattern, owners } of codeowners) {
      if (isFileMatchingPattern(file.filename, pattern)) {
        // Not breaking here to allow for multiple patterns to match the same file
        const ownerSet = fileOwners.get(file.filename);
        if (!ownerSet) {
          fileOwners.set(file.filename, new Set(owners));
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

function groupFilesByTeam(fileOwners: Map<string, Set<string>>, filesInfo: PullRequestFile[]): TeamFiles {
  const teamFiles: TeamFiles = {};

  // Create a map for faster lookups
  const changeMap = new Map<string, PullRequestFile>();
  filesInfo.forEach(file => {
    changeMap.set(file.filename, file);
  });

  fileOwners.forEach((owners, filename) => {
    owners.forEach(owner => {
      if (!teamFiles[owner]) {
        teamFiles[owner] = [];
      }

      const change = changeMap.get(filename);
      if (change) {
        teamFiles[owner].push(change);
      }
    });
  });

  // Sort files within each team for consistent ordering
  Object.values(teamFiles).forEach(files =>
    files.sort((a, b) => a.filename.localeCompare(b.filename))
  );

  return teamFiles;
}

// Calculate total changes for a team
function calculateTeamChanges(files: PullRequestFile[]): TeamChanges {
  return files.reduce((acc, file) => {
    acc.files += 1;
    acc.additions += file.additions;
    acc.deletions += file.deletions;
    return acc;
  }, { files: 0, additions: 0, deletions: 0 });
}
const policyReviewInstructions = `\n> [!TIP]  \n> Follow the policy review process outlined in the [LavaMoat Policy Review Process doc](https://github.com/MetaMask/metamask-extension/blob/main/docs/lavamoat-policy-review-process.md) before expecting an approval from Policy Reviewers.\n`

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
    const changes = calculateTeamChanges(files);

    // Add collapsible section with change statistics
    commentBody += `\n<details>\n<summary>${emoji} <strong>${team}</strong> (${changes.files} files, +${changes.additions} -${changes.deletions})</summary>\n\n`;

    // List files in a simplified, but properly-indented format
    const dirTree = buildSimpleDirectoryTree(files);

    commentBody += renderSimpleDirectoryTree(dirTree, '');

    // Close the details tag
    commentBody += `</details>\n`;

    if(team === '@MetaMask/policy-reviewers') {
      commentBody += policyReviewInstructions
    }

    // Only add divider if not the last team
    if (index < sortedOwners.length - 1) {
      commentBody += '\n---\n';
    }
  });

  return commentBody;
}

function buildSimpleDirectoryTree(files: PullRequestFile[]): { [key: string]: PullRequestFile[] | { [key: string]: any } } {
  const tree: { [key: string]: PullRequestFile[] | { [key: string]: any } } = {};

  files.forEach(file => {
    const parts = file.filename.split('/');
    let currentPath = '';
    let currentObj = tree;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      currentPath = currentPath ? `${currentPath}/${part}` : part;

      if (i === parts.length - 1) {
        // This is a file
        if (!currentObj['__files__']) {
          currentObj['__files__'] = [];
        }
        (currentObj['__files__'] as PullRequestFile[]).push({
          filename: part,
          additions: file.additions,
          deletions: file.deletions
        });
      } else {
        // This is a directory
        if (!currentObj[part]) {
          currentObj[part] = {};
        }
        currentObj = currentObj[part] as { [key: string]: any };
      }
    }
  });

  return tree;
}

// Render the directory tree using GitHub-compliant list indentation
function renderSimpleDirectoryTree(node: { [key: string]: any }, prefix: string): string {
  let result = '';

  // Process directories (skip the special __files__ key)
  const dirs = Object.keys(node).filter(key => key !== '__files__');
  dirs.sort(); // Sort directories alphabetically

  dirs.forEach(dir => {
    // Escape underscores in directory names to prevent unwanted formatting
    const escapedDir = dir.replace(/_/g, '\\_');
    // Add directory with trailing slash
    result += `${prefix}- 📁 ${escapedDir}/\n`;

    // Recursively process subdirectories with increased indentation
    result += renderSimpleDirectoryTree(node[dir], `${prefix}  `);
  });

  // Process files if any
  if (node['__files__']) {
    const files = node['__files__'] as PullRequestFile[];
    files.sort((a, b) => a.filename.localeCompare(b.filename)); // Sort files alphabetically

    files.forEach(file => {
      let changes = '';
      if (file.additions > 0 || file.deletions > 0) {
        changes = ` *+${file.additions} -${file.deletions}*`;
      }

      // Add files with code formatting and change statistics
      result += `${prefix}  - 📄 \`${file.filename}\`${changes}\n`;
    });
  }

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
