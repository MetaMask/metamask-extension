import { SCSS_REGEX } from '../common/constants';
import {
  filterDiffFileCreations,
  restrictedFilePresent,
} from '../common/shared';

function preventScssFileAdditions(diff: string): boolean {
  const diffAdditions = filterDiffFileCreations(diff);
  if (restrictedFilePresent(diffAdditions, SCSS_REGEX)) {
    return false;
  }
  return true;
}

export { preventScssFileAdditions };
