const {
  filterDiffAdditions,
  filterDiffByFilePath,
  hasNumberOfCodeBlocksIncreased,
} = require('./shared');

function checkMochaSyntax(diff) {
  const ruleHeading = 'favor-jest-instead-of-mocha';
  const codeBlocks = [
    "import { strict as assert } from 'assert';",
    'assert.deepEqual',
    'assert.equal',
    'assert.rejects',
    'assert.strictEqual',
    'sinon.',
  ];

  console.log(`Checking ${ruleHeading}...`);

  const jsFilesExcludingE2ETests = '^(?!.*/test/e2e/).*.(js|ts|jsx)$';
  const diffByFilePath = filterDiffByFilePath(diff, jsFilesExcludingE2ETests);
  const diffAdditions = filterDiffAdditions(diffByFilePath);
  const hashmap = hasNumberOfCodeBlocksIncreased(diffAdditions, codeBlocks);

  Object.keys(hashmap).forEach((key) => {
    if (hashmap[key]) {
      console.error(`Number of occurences of "${key}" have increased.`);
    }
  });

  if (Object.values(hashmap).includes(true)) {
    console.error(
      `...changes have not been committed.\nFor more info, see: https://github.com/MetaMask/metamask-extension/blob/develop/docs/testing.md#${ruleHeading}`,
    );
    process.exit(1);
  } else {
    console.log(
      `...number of occurences has not increased for any code block.`,
    );
    process.exit(0);
  }
}

module.exports = { checkMochaSyntax };
