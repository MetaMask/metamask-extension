const Changelog = require('./changelog');
const { unreleased } = require('./constants');

function truncated(line) {
  return line.length > 80 ? `${line.slice(0, 80)}...` : line;
}

/**
 * Constructs a Changelog instance that represents the given changelog, which
 * is parsed for release and change informatino.
 * @param {Object} options
 * @param {string} options.changelogContent - The changelog to parse
 * @param {string} options.repoUrl - The GitHub repository URL for the current
 *   project.
 * @returns {Changelog} A changelog instance that reflects the changelog text
 *   provided.
 */
function parseChangelog({ changelogContent, repoUrl }) {
  const changelogLines = changelogContent.split('\n');
  const changelog = new Changelog({ repoUrl });

  const unreleasedHeaderIndex = changelogLines.indexOf(`## [${unreleased}]`);
  if (unreleasedHeaderIndex === -1) {
    throw new Error(`Failed to find ${unreleased} header`);
  }
  const unreleasedLinkReferenceDefinition = changelogLines.findIndex((line) => {
    return line.startsWith(`[${unreleased}]: `);
  });
  if (unreleasedLinkReferenceDefinition === -1) {
    throw new Error(`Failed to find ${unreleased} link reference definition`);
  }

  const contentfulChangelogLines = changelogLines
    .slice(unreleasedHeaderIndex + 1, unreleasedLinkReferenceDefinition)
    .filter((line) => line !== '');

  let mostRecentRelease;
  let mostRecentCategory;
  for (const line of contentfulChangelogLines) {
    if (line.startsWith('## [')) {
      const results = line.match(
        /^## \[(\d+\.\d+\.\d+)\](?: - (\d\d\d\d-\d\d-\d\d))?(?: \[(\w+)\])?/u,
      );
      if (results === null) {
        throw new Error(`Malformed release header: '${truncated(line)}'`);
      }
      mostRecentRelease = results[1];
      mostRecentCategory = undefined;
      const date = results[2];
      const status = results[3];
      changelog.addRelease({
        addToStart: false,
        date,
        status,
        version: mostRecentRelease,
      });
    } else if (line.startsWith('### ')) {
      const results = line.match(/^### (\w+)$\b/u);
      if (results === null) {
        throw new Error(`Malformed category header: '${truncated(line)}'`);
      }
      mostRecentCategory = results[1];
    } else if (line.startsWith('- ')) {
      if (mostRecentCategory === undefined) {
        throw new Error(`Category missing for change: '${truncated(line)}'`);
      }
      const description = line.slice(2);
      changelog.addChange({
        addToStart: false,
        category: mostRecentCategory,
        description,
        version: mostRecentRelease,
      });
    } else if (mostRecentRelease === null) {
      continue;
    } else {
      throw new Error(`Unrecognized line: '${truncated(line)}'`);
    }
  }

  return changelog;
}

module.exports = { parseChangelog };
