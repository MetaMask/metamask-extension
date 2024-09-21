import { EXCLUDE_E2E_TESTS_REGEX } from '../common/constants';
import {
  filterDiffByFilePath,
  filterDiffFileCreations,
  hasNumberOfCodeBlocksIncreased,
} from '../common/shared';

const codeBlocks = [
  "import { strict as assert } from 'assert';",
  'assert.deepEqual',
  'assert.equal',
  'assert.rejects',
  'assert.strictEqual',
  'sinon.',
];

function preventSinonAssertSyntax(diff: string): boolean {
  const diffByFilePath = filterDiffByFilePath(diff, EXCLUDE_E2E_TESTS_REGEX);
  const diffAdditions = filterDiffFileCreations(diffByFilePath);
  const hashmap = hasNumberOfCodeBlocksIncreased(diffAdditions, codeBlocks);

  const haveOccurencesOfAtLeastOneCodeBlockIncreased =
    Object.values(hashmap).includes(true);
  if (haveOccurencesOfAtLeastOneCodeBlockIncreased) {
    return false;
  }
  return true;
}

export { preventSinonAssertSyntax };
