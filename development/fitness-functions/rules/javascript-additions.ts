import { SHARED_FOLDER_JS_REGEX } from '../common/constants';
import {
  filterDiffByFilePath,
  filterDiffFileCreations,
} from '../common/shared';

function preventJavaScriptFileAdditions(diff: string): boolean {
  const sharedFolderDiff = filterDiffByFilePath(diff, SHARED_FOLDER_JS_REGEX);
  const sharedFolderCreationDiff = filterDiffFileCreations(sharedFolderDiff);

  const hasCreatedAtLeastOneJSFileInShared = sharedFolderCreationDiff !== '';
  if (hasCreatedAtLeastOneJSFileInShared) {
    return false;
  }
  return true;
}

export { preventJavaScriptFileAdditions };
