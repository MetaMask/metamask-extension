const { preventSinonAssertSyntax } = require('./sinon-assert-syntax');
const { preventJavaScriptFileAdditions } = require('./javascript-additions');

const RULES = [
  {
    name: "Don't use `sinon` or `assert` in unit tests",
    fn: preventSinonAssertSyntax,
    docURL:
      'https://github.com/MetaMask/metamask-extension/blob/develop/docs/testing.md#favor-jest-instead-of-mocha',
  },
  {
    name: "Don't add JS or JSX files to the `shared` directory",
    fn: preventJavaScriptFileAdditions,
    docURL: '',
  },
];

function runFitnessFunctionRule({ name, fn, docURL }, diff) {
  console.log(`Checking rule "${name}"...`);

  const hasRulePassed = fn(diff);
  if (hasRulePassed === true) {
    console.log(`...OK`);
  } else {
    console.log(`...FAILED. Changes not accepted by the fitness function.`);

    if (docURL !== '') {
      console.log(`For more info: ${docURL}.`);
    }

    process.exit(1);
  }
}

module.exports = { RULES, runFitnessFunctionRule };
