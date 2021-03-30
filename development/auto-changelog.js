#!/usr/bin/env node
const fs = require('fs').promises;
const path = require('path');
const runCommand = require('./lib/runCommand');

const URL = 'https://github.com/MetaMask/metamask-extension';

async function main() {
  await runCommand('git', ['fetch', '--tags']);

  const [mostRecentTagCommitHash] = await runCommand('git', [
    'rev-list',
    '--tags',
    '--max-count=1',
  ]);
  const [mostRecentTag] = await runCommand('git', [
    'describe',
    '--tags',
    mostRecentTagCommitHash,
  ]);

  const commitsSinceLastRelease = await runCommand('git', [
    'rev-list',
    `${mostRecentTag}..HEAD`,
  ]);

  const changelogEntries = [];
  for (const commit of commitsSinceLastRelease) {
    const [subject] = await runCommand('git', [
      'show',
      '-s',
      '--format=%s',
      commit,
    ]);

    let prefix;
    let description = subject;

    // Squash & Merge: the commit subject is parsed as `<description> (#<PR ID>)`
    if (subject.match(/\(#\d+\)/u)) {
      const [, prNumber] = subject.match(/\(#(\d+)\)/u);
      prefix = `[#${prNumber}](${URL}/pull/${prNumber})`;
      description = subject.match(/^(.+)\s\(#\d+\)/u)[1];
      // Merge: the PR ID is parsed from the git subject (which is of the form `Merge pull request
      // #<PR ID> from <branch>`, and the description is assumed to be the first line of the body.
      // If no body is found, the description is set to the commit subject
    } else if (subject.match(/#\d+\sfrom/u)) {
      const [, prNumber] = subject.match(/#(\d+)\sfrom/u);
      prefix = `[#${prNumber}](${URL}/pull/${prNumber})`;
      const [firstLineOfBody] = await runCommand('git', [
        'show',
        '-s',
        '--format=%b',
        commit,
      ]);
      description = firstLineOfBody || subject;
    }
    // Otherwise:
    // Normal commits: The commit subject is the description, and the PR ID is omitted.

    const changelogEntry = prefix
      ? `- ${prefix}: ${description}`
      : `- ${description}`;
    changelogEntries.push(changelogEntry);
  }

  const changelogFilename = path.resolve(__dirname, '..', 'CHANGELOG.md');
  const changelog = await fs.readFile(changelogFilename, { encoding: 'utf8' });
  const changelogLines = changelog.split('\n');
  const releaseHeaderIndex = changelogLines.findIndex(
    (line) => line === '## Current Develop Branch',
  );
  if (releaseHeaderIndex === -1) {
    throw new Error('Failed to find release header');
  }
  changelogLines.splice(releaseHeaderIndex + 1, 0, ...changelogEntries);
  const updatedChangelog = changelogLines.join('\n');
  await fs.writeFile(changelogFilename, updatedChangelog);

  console.log('CHANGELOG updated');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
