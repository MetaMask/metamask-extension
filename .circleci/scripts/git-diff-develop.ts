import { exec as execCallback } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const exec = promisify(execCallback);

// The CIRCLE_PR_NUMBER variable is only available on forked Pull Requests
const PR_NUMBER =
  process.env.CIRCLE_PR_NUMBER ||
  process.env.CIRCLE_PULL_REQUEST?.split('/').pop();

const MAIN_BRANCH = 'main';
const SOURCE_BRANCH = `refs/pull/${PR_NUMBER}/head`;

const CHANGED_FILES_DIR = 'changed-files';

type PRInfo = {
  base: {
    ref: string;
  };
  body: string;
  labels: { name: string }[];
};

/**
 * Get JSON info about the given pull request
 *
 * @returns JSON info from GitHub
 */
async function getPrInfo(): Promise<PRInfo | null> {
  if (!PR_NUMBER) {
    return null;
  }

  return await (
    await fetch(
      `https://api.github.com/repos/${process.env.CIRCLE_PROJECT_USERNAME}/${process.env.CIRCLE_PROJECT_REPONAME}/pulls/${PR_NUMBER}`,
    )
  ).json();
}

/**
 * Fetches the git repository with a specified depth.
 *
 * @param depth - The depth to use for the fetch command.
 * @returns True if the fetch is successful, otherwise false.
 */
async function fetchWithDepth(depth: number): Promise<boolean> {
  try {
    await exec(`git fetch --depth ${depth} origin "${MAIN_BRANCH}"`);
    await exec(
      `git fetch --depth ${depth} origin "${SOURCE_BRANCH}:${SOURCE_BRANCH}"`,
    );
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
      if (error instanceof Error && 'code' in error) {
        console.error(
          `Error 'no merge base' encountered with depth ${depth}. Incrementing depth...`,
        );
      } else {
        throw error;
      }
    }
  }
  await exec(`git fetch --unshallow origin "${MAIN_BRANCH}"`);
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
  const { stdout: diffResult } = await exec(
    `git diff --name-only "origin/HEAD...${SOURCE_BRANCH}"`,
  );
  if (!diffResult) {
    throw new Error('Unable to get diff after full checkout.');
  }
  return diffResult;
}

function writePrBodyToFile(prBody: string) {
  const prBodyPath = path.resolve(CHANGED_FILES_DIR, 'pr-body.txt');
  fs.writeFileSync(prBodyPath, prBody.trim());
  console.log(`PR body saved to ${prBodyPath}`);
}

/**
 * Main run function, stores the output of git diff and the body of the matching PR to a file.
 *
 * @returns Returns a promise that resolves when the git diff output and PR body is successfully stored.
 */
async function storeGitDiffOutputAndPrBody() {
  try {
    // Create the directory
    // This is done first because our CirleCI config requires that this directory is present,
    // even if we want to skip this step.
    fs.mkdirSync(CHANGED_FILES_DIR, { recursive: true });

    console.log(
      `Determining whether to run git diff...`,
    );
    if (!PR_NUMBER) {
      console.log('Not a PR, skipping git diff');
      return;
    }

    const prInfo = await getPrInfo();

    const baseRef = prInfo?.base.ref;
    if (!baseRef) {
      console.log('Not a PR, skipping git diff');
      return;
    } else if (baseRef !== MAIN_BRANCH) {
      console.log(`This is for a PR targeting '${baseRef}', skipping git diff`);
      writePrBodyToFile(prInfo.body);
      return;
    } else if (prInfo.labels.some(label => label.name === 'skip-e2e-quality-gate')) {
      console.log('PR has the skip-e2e-quality-gate label, skipping git diff');
      return;
    }

    console.log('Attempting to get git diff...');
    const diffOutput = await gitDiff();
    console.log(diffOutput);

    // Store the output of git diff
    const outputPath = path.resolve(CHANGED_FILES_DIR, 'changed-files.txt');
    fs.writeFileSync(outputPath, diffOutput.trim());
    console.log(`Git diff results saved to ${outputPath}`);

    writePrBodyToFile(prInfo.body);

    process.exit(0);
  } catch (error: any) {
    console.error('An error occurred:', error.message);
    process.exit(1);
  }
}

storeGitDiffOutputAndPrBody();
