const EXCLUDE_E2E_TESTS_REGEX = '^(?!test/e2e/).*.(js|ts|jsx)$';

function filterDiffByFilePath(diff, regex) {
  // split by `diff --git` and remove the first element which is empty
  const diffBlocks = diff.split(`diff --git`).slice(1);

  const filteredDiff = diffBlocks
    .map((block) => block.trim())
    .filter((block) => {
      let didAPathInBlockMatchRegEx = false;

      block
        // get the first line of the block which has the paths
        .split('\n')[0]
        .trim()
        // split the two paths
        .split(' ')
        // remove `a/` and `b/` from the paths
        .map((path) => path.substring(2))
        // if at least one of the two paths matches the regex, filter the
        // corresponding diff block in
        .forEach((path) => {
          if (new RegExp(regex, 'u').test(path)) {
            didAPathInBlockMatchRegEx = true;
          }
        });

      return didAPathInBlockMatchRegEx;
    })
    // prepend `git --diff` to each block
    .map((block) => `diff --git ${block}`)
    .join('\n');

  return filteredDiff;
}

function filterDiffAdditions(diff) {
  const diffLines = diff.split('\n');

  const diffAdditionLines = diffLines.filter((line) => {
    const isAdditionLine = line.startsWith('+') && !line.startsWith('+++');

    return isAdditionLine;
  });

  return diffAdditionLines.join('/n');
}

function hasNumberOfCodeBlocksIncreased(diffFragment, codeBlocks) {
  const diffLines = diffFragment.split('\n');

  const codeBlockFound = {};

  for (const codeBlock of codeBlocks) {
    codeBlockFound[codeBlock] = false;

    for (const diffLine of diffLines) {
      if (diffLine.includes(codeBlock)) {
        codeBlockFound[codeBlock] = true;
        break;
      }
    }
  }

  return codeBlockFound;
}

module.exports = {
  EXCLUDE_E2E_TESTS_REGEX,
  filterDiffByFilePath,
  filterDiffAdditions,
  hasNumberOfCodeBlocksIncreased,
};
