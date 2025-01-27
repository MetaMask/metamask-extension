const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const github = require('@actions/github');
const storybook = require('./storybook');

module.exports = { getHighlights };

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

async function getChangedFiles({ target }) {
  const { stdout } = await exec(`git diff --name-only ${target}...HEAD`);
  const changedFiles = stdout.split('\n').slice(0, -1);
  return changedFiles;
}
