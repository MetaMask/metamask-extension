const { EXCLUDE_E2E_TESTS_REGEX } = require('../common/constants');
const {
  filterDiffLineAdditions,
  filterDiffByFilePath,
  hasNumberOfCodeBlocksIncreased,
} = require('../common/shared');

const codeBlocks = [
  "import { strict as assert } from 'assert';",
  'assert.deepEqual',
  'assert.equal',
  'assert.rejects',
  'assert.strictEqual',
  'sinon.',
];

function preventSinonAssertSyntax(diff) {
  const diffByFilePath = filterDiffByFilePath(diff, EXCLUDE_E2E_TESTS_REGEX);
  const diffAdditions = filterDiffLineAdditions(diffByFilePath);
  const hashmap = hasNumberOfCodeBlocksIncreased(diffAdditions, codeBlocks);

  const haveOccurencesOfAtLeastOneCodeBlockIncreased =
    Object.values(hashmap).includes(true);
  if (haveOccurencesOfAtLeastOneCodeBlockIncreased) {
    return false;
  }
  return true;
}

module.exports = { preventSinonAssertSyntax };
