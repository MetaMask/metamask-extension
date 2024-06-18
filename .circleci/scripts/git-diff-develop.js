const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const fs = require('fs');
const path = require('path');


async function fetchWithDepthIncrement(depth) {
  try {
    await exec(`git fetch --depth ${depth} origin develop`);
    await exec(`git fetch --depth ${depth} origin ${process.env.CIRCLE_BRANCH}`);
    return true;
  } catch (error) {
    console.error(`Failed to fetch with depth ${depth}:`, error.message);
    return false;
  }
}

async function gitDiffWithRetry() {
  const depths = [1, 10, 100];
  let diffOutput = '';

  for (const depth of depths) {
    try {
      console.log(`Attempting git diff with depth ${depth}...`);
      await fetchWithDepthIncrement(depth);

      const { stdout: diffResult } = await exec(`git diff --name-only origin/develop...${process.env.CIRCLE_BRANCH}`);
        diffOutput = diffResult;
        break;
      } catch (error) {
        if (error.message.includes('no merge base')) {
          console.error(`Error 'no merge base' encountered with depth ${depth}. Incrementing depth...`);
        } else {
          throw error;
        }
      }
  }

  if (!diffOutput) {
    // Use unshallow to fetch the entire history
    await exec(`git fetch --unshallow origin develop`);
    await exec(`git fetch --unshallow origin ${process.env.CIRCLE_BRANCH}`);

    const { stdout: finalDiffResult } = await exec(`git diff --name-only origin/develop...${process.env.CIRCLE_BRANCH}`);
    diffOutput = finalDiffResult;

    if (!diffOutput) {
      throw new Error('Unable to get diff after full checkout.');
    }
  }

  return diffOutput;
}

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
  } catch (error) {
    console.error('An error occurred:', error.message);
    process.exit(1);
  }
}

storeGitDiffOutput();