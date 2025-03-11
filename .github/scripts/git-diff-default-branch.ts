import { exec as execCallback } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { context } from '@actions/github';
import * as core from '@actions/core';

const exec = promisify(execCallback);

// Get PR number from GitHub Actions environment variables
const PR_NUMBER = context.payload.pull_request?.number;

const GITHUB_DEFAULT_BRANCH = 'main';
const SOURCE_BRANCH = PR_NUMBER ? `refs/pull/${PR_NUMBER}/head` : '';

const CHANGED_FILES_DIR = 'changed-files';

type PRInfo = {
  base: {
    ref: string;
  };
  body: string;
  labels: { name: string }[];
};

/**
 * Get JSON info about the given pull request using Octokit
 *
 * @returns PR information from GitHub
 */
async function getPrInfo(): Promise<PRInfo | null> {
  if (!PR_NUMBER) {
    return null;
  }

  const { owner, repo } = context.repo;

  const response = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/pulls/${PR_NUMBER}`,
    {
      headers: {
        Authorization: `token ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    },
  );

  return await response.json();
}

/**
 * Fetches the git repository with a specified depth.
 *
 * @param depth - The depth to use for the fetch command.
 * @returns True if the fetch is successful, otherwise false.
 */
async function fetchWithDepth(depth: number): Promise<boolean> {
  try {
    await exec(`git fetch --depth ${depth} origin "${GITHUB_DEFAULT_BRANCH}"`);
    if (SOURCE_BRANCH) {
      await exec(
        `git fetch --depth ${depth} origin "${SOURCE_BRANCH}:${SOURCE_BRANCH}"`,
      );
    }
    return true;
  } catch (error) {
    core.warning(`Failed to fetch with depth ${depth}:`, error);
    return false;
  }
}

/**
 * Attempts to fetch the necessary commits until the merge base is found.
 * It tries different fetch depths and performs a full fetch if needed.
 *
 * @throws If an unexpected error occurs during the execution of git commands.
 */
async function fetchUntilMergeBaseFound() {
  const depths = [1, 10, 100];
  for (const depth of depths) {
    core.info(`Attempting git diff with depth ${depth}...`);
    await fetchWithDepth(depth);

    try {
      await exec(`git merge-base origin/${GITHUB_DEFAULT_BRANCH} HEAD`);
      return;
    } catch (error: unknown) {
      if (error instanceof Error && 'code' in error) {
        core.warning(
          `Error 'no merge base' encountered with depth ${depth}. Incrementing depth...`,
        );
      } else {
        throw error;
      }
    }
  }
  await exec(`git fetch --unshallow origin "${GITHUB_DEFAULT_BRANCH}"`);
}

/**
 * Performs a git diff command to get the list of files changed between the current branch and the origin.
 * It first ensures that the necessary commits are fetched until the merge base is found.
 *
 * @returns The output of the git diff command, listing the file paths with status (A, M, D).
 * @throws If unable to get the diff after fetching the merge base or if an unexpected error occurs.
 */
async function gitDiff(): Promise<string> {
  await fetchUntilMergeBaseFound();
  const { stdout: diffResult } = await exec(
    `git diff --name-status "origin/${GITHUB_DEFAULT_BRANCH}...${
      SOURCE_BRANCH || 'HEAD'
    }"`,
  );
  if (!diffResult) {
    throw new Error('Unable to get diff after full checkout.');
  }
  return diffResult;
}

function writePrBodyAndInfoToFile(prInfo: PRInfo) {
  const prBodyPath = path.resolve(CHANGED_FILES_DIR, 'pr-body.txt');
  const labels = prInfo.labels.map((label) => label.name).join(', ');
  const updatedPrBody = `PR labels: {${labels}}\nPR base: {${
    prInfo.base.ref
  }}\n${prInfo.body.trim()}`;
  fs.writeFileSync(prBodyPath, updatedPrBody);
  core.info(`PR body and info saved to ${prBodyPath}`);
}

/**
 * Main run function, stores the output of git diff and the body of the matching PR to a file.
 *
 * @returns Returns a promise that resolves when the git diff output and PR body is successfully stored.
 */
async function storeGitDiffOutputAndPrBody() {
  try {
    // Create the directory
    fs.mkdirSync(CHANGED_FILES_DIR, { recursive: true });

    core.info(`Determining whether to run git diff...`);
    if (!PR_NUMBER) {
      core.info('Not a PR, skipping git diff');
      return;
    }

    const prInfo = await getPrInfo();

    const baseRef = prInfo?.base.ref;
    if (!baseRef) {
      core.info('Not a PR, skipping git diff');
      return;
    }
    // We perform git diff even if the PR base is not main or skip-e2e-quality-gate label is applied
    // because we rely on the git diff results for other jobs
    core.info('Attempting to get git diff...');
    const diffOutput = await gitDiff();
    core.info(diffOutput);

    // Store the output of git diff
    const outputPath = path.resolve(CHANGED_FILES_DIR, 'changed-files.txt');
    fs.writeFileSync(outputPath, diffOutput.trim());
    core.info(`Git diff results saved to ${outputPath}`);

    writePrBodyAndInfoToFile(prInfo);

    core.info('success');
  } catch (error: any) {
    core.setFailed(`Failed to process git diff: ${error.message}`);
  }
}

// If main module (i.e. this is the TS file that was run directly)
if (require.main === module) {
  storeGitDiffOutputAndPrBody();
}
