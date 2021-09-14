const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const storybook = require('./storybook.js');

module.exports = { getHighlights };

async function getHighlights() {
  let highlights = '';
  const changedFiles = await getChangedFiles({ target: 'develop' });
  const announcement = await storybook.getHighlightAnnouncement({
    changedFiles,
  });
  if (announcement) {
    highlights += announcement;
  }
  return highlights;
}

async function getChangedFiles({ target }) {
  const { stdout } = await exec(
    `git diff-tree --no-commit-id --name-only -r ${target}`,
  );
  const changedFiles = stdout.split('\n').slice(0, -1);
  return changedFiles;
}
