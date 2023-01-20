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

  const diffAdditions = filterDiffAdditions(diff);

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

function filterDiffAdditions(diff) {
  const diffLines = diff.split('\n');
  const diffAdditionLines = diffLines.filter((line) => {
    const isAdditionLine = line.startsWith('+') && !line.startsWith('+++');

    return isAdditionLine;
  });

  return diffAdditionLines;
}

function hasNumberOfCodeBlocksIncreased(diffLines, codeBlocks) {
  const codeBlockFound = {};

  for (const codeBlock of codeBlocks) {
    codeBlockFound[codeBlock] = false;

    for (const diffLine of diffLines) {
      if (diffLine.includes(codeBlock)) {
        console.log(`Found code block: ${diffLine}`);
        codeBlockFound[codeBlock] = true;
        break;
      }
    }
  }

  return codeBlockFound;
}

module.exports = { checkMochaSyntax };
