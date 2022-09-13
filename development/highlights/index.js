const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const storybook = require('./storybook');

module.exports = { getHighlights };

async function getHighlights({ artifactBase }) {
  let highlights = '';
  // here we assume the PR base branch ("target") is `develop` in lieu of doing
  // a query against the github api which requires an access token
  // see https://discuss.circleci.com/t/how-to-retrieve-a-pull-requests-base-branch-name-github/36911
  const changedFiles = await getChangedFiles({ target: 'develop' });
  console.log(`detected changed files vs develop:`);
  for (const filename of changedFiles) {
    console.log(`  ${filename}`);
  }
  const announcement = await storybook.getHighlightAnnouncement({
    changedFiles,
    artifactBase,
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
