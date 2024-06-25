import { promisify } from 'util';
import { exec as execCallback } from 'child_process';
import fs from 'fs';
import path from 'path';

const exec = promisify(execCallback);

/**
 * Fetches the git repository with a specified depth.
 *
 * @param {number} depth - The depth to use for the fetch command.
 * @returns {Promise<boolean>} True if the fetch is successful, otherwise false.
 */
async function fetchWithDepthIncrement(depth: number): Promise<boolean> {
  try {
    await exec(`git fetch --depth ${depth} origin develop`);
    await exec(`git fetch --depth ${depth} origin ${process.env.CIRCLE_BRANCH}`);
    return true;
  } catch (error: any) {
    console.error(`Failed to fetch with depth ${depth}:`, error.message);
    return false;
  }
}

/**
 * Attempts to get the git diff with retries at increasing fetch depths.
 *
 * @returns {Promise<string>} The git diff output.
 * @throws {Error} - Throws an error if unable to get the diff after fetching the entire history.
 */
async function gitDiffWithRetry(): Promise<string> {
  const depths = [1, 10, 100];
  let diffOutput = '';

  for (const depth of depths) {
    try {
      console.log(`Attempting git diff with depth ${depth}...`);
      await fetchWithDepthIncrement(depth);

      const { stdout: diffResult } = await exec(`git diff --name-only origin/HEAD...${process.env.CIRCLE_BRANCH}`);
      diffOutput = diffResult;
      break;
    } catch (error: any) {
      if (error.message.includes('no merge base')) {
        console.error(`Error 'no merge base' encountered with depth ${depth}. Incrementing depth...`);
      } else {
        throw error;
      }
    }
  }

  if (!diffOutput) {
    // If no merge base found, fetch the entire history
    await exec(`git fetch --unshallow origin develop`);

    const { stdout: diffResult } = await exec(`git diff --name-only origin/HEAD...${process.env.CIRCLE_BRANCH}`);
    diffOutput = diffResult;

    if (!diffOutput) {
      throw new Error('Unable to get diff after full checkout.');
    }
  }

  return diffOutput;
}

/**
 * Stores the output of git diff to a file.
 *
 * @returns {Promise<void>} Returns a promise that resolves when the git diff output is successfully stored.
 */
async function storeGitDiffOutput() {
  try {
    console.log("Attempting to get git diff...");
    const diffOutput = await gitDiffWithRetry();
    console.log(diffOutput);

    // Create the directory
    const outputDir = 'changed-files';
    fs.mkdirSync(outputDir, { recursive: true });

    // Store the output of git diff
    const outputPath = path.resolve(outputDir, 'changed-files.txt');
    fs.writeFileSync(outputPath, diffOutput);

    console.log(`Git diff results saved to ${outputPath}`);
    process.exit(0);
  } catch (error: any) {
    console.error('An error occurred:', error.message);
    process.exit(1);
  }
}

storeGitDiffOutput();