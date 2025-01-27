const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const github = require('@actions/github');
const storybook = require('./storybook');

module.exports = { getHighlights };

/**
 * Generate highlights of all the story files that have changed dependencies.
 *
 * @param {{ hostUrl: string }} hostUrl - static host url
 * @returns {Promise<string | null>} The highlights.
 */

async function getHighlights({ hostUrl }) {
  const defaultBranch = github.context.payload.repository.default_branch;

  if (!defaultBranch) {
    throw new Error('Could not find default_branch in the event payload.');
  }

  const changedFiles = await getChangedFiles({
    target: `origin/${defaultBranch}`,
  });

  console.log(`detected changed files vs ${defaultBranch}:`);
  for (const filename of changedFiles) {
    console.log(`  ${filename}`);
  }

  const announcement = await storybook.getHighlightAnnouncement({
    changedFiles,
    hostUrl,
  });

  return announcement;
}

/**
 * Get the list of changed files between HEAD and the target branch.
 *
 * @param {{ target: string }} target - The target branch to compare against.
 * @returns {Promise<string[]>} The list of changed files.
 */

async function getChangedFiles({ target }) {
  const { stdout } = await exec(`git diff --name-only ${target}...HEAD`);
  const changedFiles = stdout.split('\n').slice(0, -1);
  return changedFiles;
}
