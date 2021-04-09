const assert = require('assert').strict;
const runCommand = require('../runCommand');
const { parseChangelog } = require('./parseChangelog');
const { changeCategories } = require('./constants');

async function getMostRecentTag() {
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
  return mostRecentTag;
}

async function getCommits(commitHashes) {
  const commits = [];
  for (const commitHash of commitHashes) {
    const [subject] = await runCommand('git', [
      'show',
      '-s',
      '--format=%s',
      commitHash,
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
        commitHash,
      ]);
      description = firstLineOfBody || subject;
    }
    // Otherwise:
    // Normal commits: The commit subject is the description, and the PR ID is omitted.

    commits.push({ prNumber, description });
  }
  return commits;
}

function getAllChangeDescriptions(changelog) {
  const releases = changelog.getReleases();
  const changeDescriptions = Object.values(
    changelog.getUnreleasedChanges(),
  ).flat();
  for (const release of releases) {
    changeDescriptions.push(
      ...Object.values(changelog.getReleaseChanges(release.version)).flat(),
    );
  }
  return changeDescriptions;
}

function getAllLoggedPrNumbers(changelog) {
  const changeDescriptions = getAllChangeDescriptions(changelog);

  const prNumbersWithChangelogEntries = [];
  for (const description of changeDescriptions) {
    const matchResults = description.match(/^\[#(\d+)\]/u);
    if (matchResults === null) {
      continue;
    }
    const prNumber = matchResults[1];
    prNumbersWithChangelogEntries.push(prNumber);
  }

  return prNumbersWithChangelogEntries;
}

/**
 * @typedef {import('./constants.js').Version} Version
 */

/**
 * Update a changelog with any commits made since the last release. Commits for
 * PRs that are already included in the changelog are omitted.
 * @param {Object} options
 * @param {string} options.changelogContent - The current changelog
 * @param {Version} options.currentVersion - The current version
 * @param {string} options.repoUrl - The GitHub repository URL for the current
 *   project.
 * @param {boolean} options.isReleaseCandidate - Denotes whether the current
 *   project is in the midst of release preparation or not. If this is set, any
 *   new changes are listed under the current release header. Otherwise, they
 *   are listed under the 'Unreleased' section.
 * @returns
 */
async function updateChangelog({
  changelogContent,
  currentVersion,
  repoUrl,
  isReleaseCandidate,
}) {
  const changelog = parseChangelog({ changelogContent, repoUrl });

  // Ensure we have all tags on remote
  await runCommand('git', ['fetch', '--tags']);
  const mostRecentTag = await getMostRecentTag();
  const commitsHashesSinceLastRelease = await runCommand('git', [
    'rev-list',
    `${mostRecentTag}..HEAD`,
  ]);
  const commits = await getCommits(commitsHashesSinceLastRelease);

  const loggedPrNumbers = getAllLoggedPrNumbers(changelog);
  const newCommits = commits.filter(
    ({ prNumber }) => !loggedPrNumbers.includes(prNumber),
  );

  const hasUnreleasedChanges = changelog.getUnreleasedChanges().length !== 0;
  if (
    newCommits.length === 0 &&
    (!isReleaseCandidate || hasUnreleasedChanges)
  ) {
    return undefined;
  }

  // Ensure release header exists, if necessary
  if (
    isReleaseCandidate &&
    !changelog
      .getReleases()
      .find((release) => release.version === currentVersion)
  ) {
    changelog.addRelease({ version: currentVersion });
  }

  if (isReleaseCandidate && hasUnreleasedChanges) {
    changelog.migrateUnreleasedChangesToRelease(currentVersion);
  }

  const newChangeEntries = newCommits.map(({ prNumber, description }) => {
    if (prNumber) {
      const prefix = `[#${prNumber}](${repoUrl}/pull/${prNumber})`;
      return `${prefix}: ${description}`;
    }
    return description;
  });

  for (const description of newChangeEntries.reverse()) {
    changelog.addChange({
      version: isReleaseCandidate ? currentVersion : undefined,
      category: changeCategories.Uncategorized,
      description,
    });
  }

  return changelog.toString();
}

module.exports = { updateChangelog };
