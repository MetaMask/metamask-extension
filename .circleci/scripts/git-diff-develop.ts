import { hasProperty } from '@metamask/utils';
import { exec as execCallback } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const exec = promisify(execCallback);

const MAIN_BRANCH = 'develop';

/**
 * Get the target branch for the given pull request.
 *
 * @returns The name of the branch targeted by the PR.
 */
async function getBaseRef(): Promise<string | null> {
  if (!process.env.CIRCLE_PULL_REQUEST) {
    return null;
  }

  // We're referencing the CIRCLE_PULL_REQUEST environment variable within the script rather than
  // passing it in because this makes it easier to use Bash parameter expansion to extract the
  // PR number from the URL.
  const result = await exec(`gh pr view --json baseRefName "\${CIRCLE_PULL_REQUEST##*/}" --jq '.baseRefName'`);
  const baseRef = result.stdout.trim();
  return baseRef;
}

/**
 * Fetches the git repository with a specified depth.
 *
 * @param depth - The depth to use for the fetch command.
 * @returns True if the fetch is successful, otherwise false.
 */
async function fetchWithDepth(depth: number): Promise<boolean> {
  try {
    await exec(`git fetch --depth ${depth} origin develop`);
    await exec(`git fetch --depth ${depth} origin ${process.env.CIRCLE_BRANCH}`);
    return true;
  } catch (error: unknown) {
    console.error(`Failed to fetch with depth ${depth}:`, error);
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
    console.log(`Attempting git diff with depth ${depth}...`);
    await fetchWithDepth(depth);

    try {
      await exec(`git merge-base origin/HEAD HEAD`);
      return;
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        hasProperty(error, 'code') &&
        error.code === 1
      ) {
        console.error(`Error 'no merge base' encountered with depth ${depth}. Incrementing depth...`);
      } else {
        throw error;
      }
    }
  }
  await exec(`git fetch --unshallow origin develop`);
}

/**
 * Performs a git diff command to get the list of files changed between the current branch and the origin.
 * It first ensures that the necessary commits are fetched until the merge base is found.
 *
 * @returns The output of the git diff command, listing the changed files.
 * @throws If unable to get the diff after fetching the merge base or if an unexpected error occurs.
 */
async function gitDiff(): Promise<string> {
  await fetchUntilMergeBaseFound();
  const { stdout: diffResult } = await exec(`git diff --name-only origin/HEAD...${process.env.CIRCLE_BRANCH}`);
  if (!diffResult) {
      throw new Error('Unable to get diff after full checkout.');
  }
  return diffResult;
}

/**
 * Stores the output of git diff to a file.
 *
 * @returns Returns a promise that resolves when the git diff output is successfully stored.
 */
async function storeGitDiffOutput() {
  try {
    // Create the directory
    // This is done first because our CirleCI config requires that this directory is present,
    // even if we want to skip this step.
    const outputDir = 'changed-files';
    fs.mkdirSync(outputDir, { recursive: true });

    console.log(`Determining whether this run is for a PR targetting ${MAIN_BRANCH}`)
    if (!process.env.CIRCLE_PULL_REQUEST) {
      console.log("Not a PR, skipping git diff");
      return;
    }

    const baseRef = await getBaseRef();
    if (baseRef === null) {
      console.log("Not a PR, skipping git diff");
      return;
    } else if (baseRef !== MAIN_BRANCH) {
      console.log(`This is for a PR targeting '${baseRef}', skipping git diff`);
      return;
    }

    console.log("Attempting to get git diff...");
    const diffOutput = await gitDiff();
    console.log(diffOutput);

    // Store the output of git diff
    const outputPath = path.resolve(outputDir, 'changed-files.txt');
    fs.writeFileSync(outputPath, diffOutput.trim());

    console.log(`Git diff results saved to ${outputPath}`);
    process.exit(0);
  } catch (error: any) {
    console.error('An error occurred:', error.message);
    process.exit(1);
  }
}

storeGitDiffOutput();
