const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const storybook = require('./storybook');

module.exports = { getHighlights };

async function getHighlights({ artifactBase, stories }) {
  let highlights = '';
  const target = process.env.BASE_BRANCH;
  if (!target) {
    console.log(`BASE_BRANCH is not set, skipping highlights`);
    return highlights;
  }
  const changedFiles = await getChangedFiles({ target });
  console.log(`detected changed files vs target:`);
  for (const filename of changedFiles) {
    console.log(`  ${filename}`);
  }
  const announcement = await storybook.getHighlightAnnouncement({
    changedFiles,
    artifactBase,
    stories,
  });
  if (announcement) {
    highlights += announcement;
  }
  return highlights;
}

async function getChangedFiles({ target }) {
  const { stdout } = await exec(`git diff --name-only ${target}...HEAD`);
  const changedFiles = stdout.split('\n').slice(0, -1);
  return changedFiles;
}
