const { SHARED_FOLDER_JS_REGEX } = require('../common/constants');
const {
  filterDiffByFilePath,
  filterDiffFileCreations,
} = require('../common/shared');

function preventJavaScriptFileAdditions(diff) {
  const sharedFolderDiff = filterDiffByFilePath(diff, SHARED_FOLDER_JS_REGEX);
  const sharedFolderCreationDiff = filterDiffFileCreations(sharedFolderDiff);

  const hasCreatedAtLeastOneJSFileInShared = sharedFolderCreationDiff !== '';
  if (hasCreatedAtLeastOneJSFileInShared) {
    return false;
  }
  return true;
}

module.exports = { preventJavaScriptFileAdditions };
