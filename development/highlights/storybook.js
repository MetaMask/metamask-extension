const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const dependencyTree = require('dependency-tree');

const cwd = process.cwd();
const resolutionCache = {};

module.exports = {
  getHighlights,
  getHighlightAnnouncement,
};

/**
 * Generate an announcement of all story files that have changed dependencies.
 *
 * @param {{ changedFiles: string[]; hostUrl: string }} arguments - The list of changed files and the static host url.
 * @returns {Promise<string | null>} The announcement.
 */

async function getHighlightAnnouncement({ changedFiles, hostUrl }) {
  const highlights = await getHighlights({ changedFiles });
  if (!highlights.length) {
    return null;
  }

  const storiesResponse = await fetch(
    `${hostUrl}/storybook-build/stories.json`,
  );
  if (!storiesResponse.ok) {
    throw new Error(`Failed to fetch ${hostUrl}/storybook-build/stories.json`);
  }
  const storiesBody = await storiesResponse.json();
  const stories = Object.values(storiesBody.stories);

  const highlightsBody = highlights
    .map(
      (entry) => `\n- [${entry}](${urlForStoryFile(stories, entry, hostUrl)})`,
    )
    .join('');

  const announcement = `<details>
    <summary>storybook</summary>
    ${highlightsBody}
  </details>\n\n`;

  return announcement;
}

/**
 * Get all story files that have changed dependencies.
 *
 * @param {{ changedFiles: string[]; }} changedFiles - The list of changed files.
 * @returns {Promise<string[]>} The list of story files that have changed dependencies.
 */

async function getHighlights({ changedFiles }) {
  const highlights = [];
  const storyFiles = await getAllStories();
  // check each story file for dep graph overlap with changed files
  for (const storyFile of storyFiles) {
    const list = getLocalDependencyList(storyFile);
    if (list.some((entry) => changedFiles.includes(entry))) {
      highlights.push(storyFile);
    }
  }
  return highlights;
}

/**
 * Get all story files.
 *
 * @returns {Promise<string[]>} The list of story files.
 */

async function getAllStories() {
  const { stdout } = await exec('find ui -name "*.stories.js"');
  const matches = stdout.split('\n').slice(0, -1);
  return matches;
}

/**
 * Get the local dependency list for a file.
 *
 * @param {string} filename - filename to get the local dependency list for.
 * @returns {string[]} The list of local dependencies.
 */

function getLocalDependencyList(filename) {
  const list = dependencyTree
    .toList({
      filename,
      directory: cwd,
      webpackConfig: `.storybook/main.js`,
      // skip all dependencies
      filter: (entry) => !entry.includes('node_modules'),
      // for memoization across trees: 30s -> 5s
      visited: resolutionCache,
    })
    .map((entry) => path.relative(cwd, entry));
  return list;
}

/**
 * Get the url for a story file.
 *
 * @param {{ importPath: string }[]} stories - list of stories.
 * @param {string} filename - filename to get the story id.
 * @param {string} hostUrl - static host url.
 * @returns {string} The url of the story file.
 */

function urlForStoryFile(stories, filename, hostUrl) {
  const storyId = getStoryId(stories, filename);
  return `${hostUrl}/storybook-build/index.html?path=/story/${storyId}`;
}

/**
 * Get the ID for a story.
 *
 * @param {{ importPath: string }[]} stories - list of stories.
 * @param {string} filename - filename to get the story id.
 * @returns {string} The id of the story.
 */

function getStoryId(stories, filename) {
  const foundStory = stories.find((story) => {
    return story.importPath.includes(filename);
  });
  if (!foundStory) {
    throw new Error(`story for ${filename} not found`);
  }
  return foundStory.id;
}
