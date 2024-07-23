import { hasProperty } from '@metamask/utils';
import { exec as execCallback } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const exec = promisify(execCallback);

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
    console.log("Attempting to get git diff...");
    const diffOutput = await gitDiff();
    console.log(diffOutput);

    // Create the directory
    const outputDir = 'changed-files';
    fs.mkdirSync(outputDir, { recursive: true });

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
