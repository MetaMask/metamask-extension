#!/usr/bin/env node
const fs = require('fs').promises;
const assert = require('assert').strict;
const path = require('path');
const { version } = require('../app/manifest/_base.json');
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
  assert.equal(mostRecentTag[0], 'v', 'Most recent tag should start with v');

  const commitsSinceLastRelease = await runCommand('git', [
    'rev-list',
    `${mostRecentTag}..HEAD`,
  ]);

  const commitEntries = [];
  for (const commit of commitsSinceLastRelease) {
    const [subject] = await runCommand('git', [
      'show',
      '-s',
      '--format=%s',
      commit,
    ]);

    let prNumber;
    let description = subject;

    // Squash & Merge: the commit subject is parsed as `<description> (#<PR ID>)`
    if (subject.match(/\(#\d+\)/u)) {
      const matchResults = subject.match(/\(#(\d+)\)/u);
      prNumber = matchResults[1];
      description = subject.match(/^(.+)\s\(#\d+\)/u)[1];
      // Merge: the PR ID is parsed from the git subject (which is of the form `Merge pull request
      // #<PR ID> from <branch>`, and the description is assumed to be the first line of the body.
      // If no body is found, the description is set to the commit subject
    } else if (subject.match(/#\d+\sfrom/u)) {
      const matchResults = subject.match(/#(\d+)\sfrom/u);
      prNumber = matchResults[1];
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

    commitEntries.push({ prNumber, description });
  }

  const changelogFilename = path.resolve(__dirname, '..', 'CHANGELOG.md');
  const changelog = await fs.readFile(changelogFilename, { encoding: 'utf8' });
  const changelogLines = changelog.split('\n');

  // remove the "v" prefix
  const mostRecentVersion = mostRecentTag.slice(1);

  const isReleaseCandidate = mostRecentVersion !== version;
  const versionHeader = `## ${version}`;
  const currentDevelopBranchHeader = '## Current Develop Branch';
  const currentReleaseHeaderPattern = isReleaseCandidate
    ? // This ensures this doesn't match on a version with a suffix
      // e.g. v9.0.0 should not match on the header v9.0.0-beta.0
      `${versionHeader}$|${versionHeader}\\s`
    : currentDevelopBranchHeader;

  let releaseHeaderIndex = changelogLines.findIndex((line) =>
    line.match(new RegExp(currentReleaseHeaderPattern, 'u')),
  );
  if (releaseHeaderIndex === -1) {
    if (!isReleaseCandidate) {
      throw new Error(
        `Failed to find release header '${currentDevelopBranchHeader}'`,
      );
    }

    // Add release header if not found
    const firstReleaseHeaderIndex = changelogLines.findIndex((line) =>
      line.match(/## \d+\.\d+\.\d+/u),
    );
    changelogLines.splice(firstReleaseHeaderIndex, 0, versionHeader, '');
    releaseHeaderIndex = firstReleaseHeaderIndex;
  }

  const prNumbersWithChangelogEntries = [];
  for (const line of changelogLines) {
    const matchResults = line.match(/- \[#(\d+)\]/u);
    if (matchResults === null) {
      continue;
    }
    const prNumber = matchResults[1];
    prNumbersWithChangelogEntries.push(prNumber);
  }

  const changelogEntries = [];
  for (const { prNumber, description } of commitEntries) {
    if (prNumbersWithChangelogEntries.includes(prNumber)) {
      continue;
    }

    let changelogEntry;
    if (prNumber) {
      const prefix = `[#${prNumber}](${URL}/pull/${prNumber})`;
      changelogEntry = `- ${prefix}: ${description}`;
    } else {
      changelogEntry = `- ${description}`;
    }
    changelogEntries.push(changelogEntry);
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
