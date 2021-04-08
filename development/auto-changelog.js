#!/usr/bin/env node
const fs = require('fs').promises;

const path = require('path');
const { version } = require('../app/manifest/_base.json');
const { updateChangelog } = require('./lib/changelog/updateChangelog');
const { unreleased } = require('./lib/changelog/constants');

const REPO_URL = 'https://github.com/MetaMask/metamask-extension';

const command = 'yarn update-changelog';

const helpText = `Usage: ${command} [--rc] [-h|--help]
Update CHANGELOG.md with any changes made since the most recent release.

Options:
      --rc    Add new changes to the current release header, rather than to the
                '${unreleased}' section.
  -h, --help  Display this help and exit.

New commits will be added to the "${unreleased}" section (or to the section for the
current release if the '--rc' flag is used) in reverse chronological order. Any
commits for PRs that are represented already in the changelog will be ignored.

If the '--rc' flag is used and the section for the current release does not yet
exist, it will be created.
`;

async function main() {
  const args = process.argv.slice(2);
  let isReleaseCandidate = false;

  for (const arg of args) {
    if (arg === '--rc') {
      isReleaseCandidate = true;
    } else if (['--help', '-h'].includes(arg)) {
      console.log(helpText);
      process.exit(0);
    } else {
      console.error(
        `Unrecognized argument: ${arg}\nTry '${command} --help' for more information.\n`,
      );
      process.exit(1);
    }
  }

  const changelogFilename = path.resolve(__dirname, '..', 'CHANGELOG.md');
  const changelogContent = await fs.readFile(changelogFilename, {
    encoding: 'utf8',
  });

  const newChangelogContent = await updateChangelog({
    changelogContent,
    currentVersion: version,
    repoUrl: REPO_URL,
    isReleaseCandidate,
  });

  await fs.writeFile(changelogFilename, newChangelogContent);

  console.log('CHANGELOG updated');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
