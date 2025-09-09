function filterDiffByFilePath(diff: string, regex: RegExp): string {
  // split by `diff --git` and remove the first element which is empty
  const diffBlocks = diff.split(`diff --git`).slice(1);

  const filteredDiff = diffBlocks
    .map((block) => block.trim())
    .filter((block) => {
      let shouldCheckBlock = false;

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
          // If at least one of the paths MATCHES the regex, include this block
          if (regex.test(path)) {
            shouldCheckBlock = true;
          }
        });

      return shouldCheckBlock;
    })
    // prepend `git --diff` to each block
    .map((block) => `diff --git ${block}`)
    .join('\n');

  return filteredDiff;
}

function restrictedFilePresent(diff: string, regex: RegExp): boolean {
  // split by `diff --git` and remove the first element which is empty
  const diffBlocks = diff.split(`diff --git`).slice(1);
  let jsOrJsxFilePresent = false;
  diffBlocks
    .map((block) => block.trim())
    .filter((block) => {
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
          if (regex.test(path)) {
            // Not excluded, include in check
            jsOrJsxFilePresent = true;
          }
        });
      return jsOrJsxFilePresent;
    });
  return jsOrJsxFilePresent;
}

// This function returns all lines that are additions to files that are being
// modified but that previously already existed. Example:
// diff --git a/test.js b/test.js
// index 0000000000..872e0d8293
// --- /dev/null
// +++ b/test.js
// @@ -0,0 +1 @@
// +new line change to a previously existing file
function filterDiffLineAdditions(diff: string): string {
  const diffLines = diff.split('\n');

  const diffAdditionLines = diffLines.filter((line) => {
    const trimmedLine = line.trim();
    const isAdditionLine =
      trimmedLine.startsWith('+') && !trimmedLine.startsWith('+++');

    return isAdditionLine;
  });

  return diffAdditionLines.join('/n');
}

// This function returns all lines that are additions to new files that are being
// created. Example:
// diff --git a/test.js b/test.js
// new file mode 100644
// index 0000000000..872e0d8293
// --- /dev/null
// +++ b/test.js
// @@ -0,0 +1 @@
// +new line change as the new file is created
function filterDiffFileCreations(diff: string): string {
  // split by `diff --git` and remove the first element which is empty
  const diffBlocks = diff.split(`diff --git`).slice(1);

  const filteredDiff = diffBlocks
    .map((block) => block.trim())
    .filter((block) => {
      const lines = block.split('\n');
      if (lines.length < 2) {
        return false;
      }

      // Skip binary diff blocks
      if (block.includes('Binary files ') || block.includes('GIT binary patch')) {
        return false;
      }

      // Detect creation via explicit "new file mode" on second line
      const secondLine = lines[1].trim();
      if (secondLine.startsWith('new file mode')) {
        return true;
      }

      // Or via the /dev/null header pair indicating a new file
      const hasDevNullOld = lines.some((l) => l.startsWith('--- /dev/null'));
      const hasNewPath = lines.some((l) => l.startsWith('+++ b/'));
      if (hasDevNullOld && hasNewPath) {
        return true;
      }

      return false;
    })
    // prepend `git --diff` to each block
    .map((block) => `diff --git ${block}`)
    .join('\n');

  return filteredDiff;
}

function hasNumberOfCodeBlocksIncreased(
  diffFragment: string,
  codeBlocks: string[],
): { [codeBlock: string]: boolean } {
  const diffLines = diffFragment.split('\n');

  const codeBlockFound: { [codeBlock: string]: boolean } = {};

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

export {
  filterDiffByFilePath,
  restrictedFilePresent,
  filterDiffFileCreations,
  filterDiffLineAdditions,
  hasNumberOfCodeBlocksIncreased,
};
