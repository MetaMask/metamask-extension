import fs from 'fs';
import path from 'path';
import { context, getOctokit } from '@actions/github';
import { GitHub } from '@actions/github/lib/utils';
import * as core from '@actions/core';
import { RestEndpointMethodTypes } from '@octokit/plugin-rest-endpoint-methods';

const githubToken = process.env.GITHUB_TOKEN;
if (!githubToken) {
  core.setFailed('GITHUB_TOKEN not found');
  process.exit(1);
}

const octokit: InstanceType<typeof GitHub> = getOctokit(githubToken);

// Get PR number from GitHub Actions environment variables
const PR_NUMBER = context.payload.pull_request?.number;

const CHANGED_FILES_DIR = 'changed-files';

// Use Octokit's built-in type for pull request data
type PullRequestData = RestEndpointMethodTypes['pulls']['get']['response']['data'];
type Label = { name?: string } | string;

/**
 * Get JSON info about the given pull request using Octokit
 *
 * @returns Pull request information from GitHub
 */
 async function getPrInfo(): Promise<PullRequestData | null> {
  if (!PR_NUMBER) {
    core.info('No PR number found');
    return null;
  }

  const { owner, repo } = context.repo;

  try {
    const { data } = await octokit.rest.pulls.get({
      owner,
      repo,
      pull_number: PR_NUMBER,
    });

    return data;
  } catch (error: any) {
    core.warning(`Failed to get PR info: ${error.message}`);
    return null;
  }
}

/**
 * Retrieves a list of changed files for the PR using the GitHub API.
 * It paginates through the results and returns a string where each line has the format:
 * "status    filename"
 *
 * @returns A string listing the changed files.
 */
async function getChangedFilesUsingAPI(): Promise<string> {
  if (!PR_NUMBER) {
    core.warning('No PR number found, cannot retrieve changed files');
    return '';
  }

  const { owner, repo } = context.repo;
  let changedFiles = '';
  let page = 1;
  const files_per_page = 100;
  const MAX_PAGES = 100; // Safety limit to prevent infinite loops

  try {
    while (page <= MAX_PAGES) {
      const response = await octokit.rest.pulls.listFiles({
        owner,
        repo,
        pull_number: PR_NUMBER,
        files_per_page,
        page,
      });

      const files = response.data;
      if (files.length === 0) {
        break;
      }

      for (const file of files) {
        changedFiles += `${file.status}\t${file.filename}\n`;
      }

      if (files.length < files_per_page) {
        break;
      }

      page++;
    }

    if (page > MAX_PAGES) {
      core.warning('Reached maximum page limit when retrieving changed files');
    }

    return changedFiles;
  } catch (error: any) {
    core.warning(`Failed to get changed files: ${error.message}`);
    return '';
  }
}

/**
 * Safely writes content to a file, with error handling
 *
 * @param filePath - Path to write to
 * @param content - Content to write
 * @returns boolean indicating success
 */
export function safeWriteFile(filePath: string, content: string): boolean {
  try {
    fs.writeFileSync(filePath, content);
    return true;
  } catch (error: any) {
    core.warning(`Failed to write to ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Writes the pull request body, base branch, and labels to a file.
 *
 * @param prInfo - The pull request information.
 * @returns boolean indicating success
 */
 function writePrBodyAndInfoToFile(prInfo: PullRequestData): boolean {
  const prBodyPath = path.resolve(CHANGED_FILES_DIR, 'pr-body.txt');

  const labels = prInfo.labels
    .map((label: Label) => {
      if (typeof label === 'string') {
        return label;
      }
      return label?.name || '';
    })
    .filter(Boolean)
    .join(', ');

  const updatedPrBody = `PR labels: {${labels}}\nPR base: {${prInfo.base.ref}}\n${prInfo.body?.trim() || ''}`;

  const success = safeWriteFile(prBodyPath, updatedPrBody);
  if (success) {
    core.info(`PR body and info saved to ${prBodyPath}`);
  }

  return success;
}

/**
 * Main run function that retrieves the list of changed files and the PR details
 * via GitHub API calls, then saves them to files.
 */
async function storeGitDiffOutputAndPrBody(): Promise<boolean> {
  try {
    // Create the output directory
    try {
      fs.mkdirSync(CHANGED_FILES_DIR, { recursive: true });
    } catch (error: any) {
      core.setFailed(`Failed to create directory ${CHANGED_FILES_DIR}: ${error.message}`);
      return false;
    }

    core.info('Determining whether to retrieve changed files via API...');
    if (!PR_NUMBER) {
      core.info('Not a PR, skipping changed files retrieval');
      return true;
    }

    const prInfo = await getPrInfo();
    if (!prInfo) {
      core.warning('Could not retrieve PR info, skipping changed files retrieval');
      return false;
    }

    if (!prInfo.base.ref) {
      core.warning('PR has no base reference, skipping changed files retrieval');
      return false;
    }

    core.info('Attempting to get changed files using GitHub API...');
    const diffOutput = await getChangedFilesUsingAPI();

    if (!diffOutput) {
      core.warning('No changed files retrieved');
      return false;
    }

    core.info(diffOutput);

    // Store the list of changed files
    const outputPath = path.resolve(CHANGED_FILES_DIR, 'changed-files.txt');
    const filesWritten = safeWriteFile(outputPath, diffOutput.trim());

    if (filesWritten) {
      core.info(`Changed files results saved to ${outputPath}`);
    } else {
      return false;
    }

    // Store PR details (body, labels, base branch)
    const prBodyWritten = writePrBodyAndInfoToFile(prInfo);
    if (!prBodyWritten) {
      return false;
    }

    core.info('All operations completed successfully');
    return true;
  } catch (error: any) {
    core.setFailed(`Failed to process changed files: ${error.message}`);
    return false;
  }
}

if (require.main === module) {
  storeGitDiffOutputAndPrBody();
}
