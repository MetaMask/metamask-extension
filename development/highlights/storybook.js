const path = require('path');
const { promisify } = require('util');
const exec = promisify(require('child_process').exec);
const fs = require('fs');
const dependencyTree = require('dependency-tree');

const stories = fs.readFileSync(
  path.join(__dirname, '..', '..', 'storybook-build', 'stories.json'),
  'utf8',
);

const cwd = process.cwd();
const resolutionCache = {};
// 1. load stories
// 2. load list per story
// 3. filter against files
module.exports = {
  getHighlights,
  getHighlightAnnouncement,
};

async function getHighlightAnnouncement({ changedFiles, artifactBase }) {
  const highlights = await getHighlights({ changedFiles });
  if (!highlights.length) {
    return null;
  }
  const highlightsBody = highlights
    .map((entry) => `\n- [${entry}](${urlForStoryFile(entry, artifactBase)})`)
    .join('');
  const announcement = `<details>
    <summary>storybook</summary>
    ${highlightsBody}
  </details>\n\n`;
  return announcement;
}

async function getHighlights({ changedFiles }) {
  const highlights = [];
  const storyFiles = await getAllStories();
  // check each story file for dep graph overlap with changed files
  for (const storyFile of storyFiles) {
    const list = await getLocalDependencyList(storyFile);
    if (list.some((entry) => changedFiles.includes(entry))) {
      highlights.push(storyFile);
    }
  }
  return highlights;
}

async function getAllStories() {
  const { stdout } = await exec('find ui -name "*.stories.js"');
  const matches = stdout.split('\n').slice(0, -1);
  return matches;
}

async function getLocalDependencyList(filename) {
  const list = dependencyTree
    .toList({
      filename,
      // not sure what this does but its mandatory
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

function urlForStoryFile(filename, artifactBase) {
  const storyId = getStoryId(filename);
  return `${artifactBase}/storybook/index.html?path=/story/${storyId}`;
}

/**
 * Get the ID for a story file.
 *
 * @param {fileName} string - The fileName to get the story id.
 * @returns The id of the story.
 */

function getStoryId(fileName) {
  const storiesArray = Object.values(stories.stories);
  const foundStory = storiesArray.find((story) => {
    return story.importPath.includes(fileName);
  });
  if (!foundStory) {
    throw new Error(`story for ${fileName} not found`);
  }
  return foundStory.id;
}
