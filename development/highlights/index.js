const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const storybook = require('./storybook.js');

module.exports = { getHighlights };

getHighlights().then(console.log)

async function getHighlights() {
  let highlights = '';
  const changedFiles = await getChangedFiles({ target: 'develop' });
  console.log(`detected changed files vs develop:`);
  for (const filename of changedFiles) {
    console.log(`  ${filename}`);
  }
  const announcement = await storybook.getHighlightAnnouncement({
    changedFiles,
  });
  console.log(`stories announcement:`, announcement);
  if (announcement) {
    highlights += announcement;
  }
  return highlights;
}

async function getChangedFiles({ target }) {
  const { stdout } = await exec(
    `git diff --name-only ${target}...HEAD`,
  );
  const changedFiles = stdout.split('\n').slice(0, -1);
  return changedFiles;
}
