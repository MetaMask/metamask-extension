const fs = require('fs');
const { promisify } = require('util');
const log = require('loglevel');
const glob = require('fast-glob');
const matchAll = require('string.prototype.matchall').getPolyfill();

const readFile = promisify(fs.readFile);

/**
 * Async generator to read file contents
 * @param {string[]} filenames - Array of file paths
 * @yields {Promise<string>} File contents
 */
async function* getFileContents(filenames) {
  for (const filename of filenames) {
    yield readFile(filename, 'utf8');
  }
}

/**
 * Validate English locale for unused messages
 * @param {Object} locale - English locale object
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
async function validate(locale, options = {}) {
  // As time allows we'll switch to only performing the strict search.
  // In the meantime we'll use glob to specify which paths can be strict searched
  // and gradually phase out the key based search
  const globsToStrictSearch = [
    'ui/components/app/metamask-translation/*.js',
    'ui/components/app/metamask-translation/*.ts',
    'ui/pages/confirmation/templates/*.js',
    'ui/pages/confirmation/templates/*.ts',
  ];
  const testGlob = '**/*.test.js';
  const javascriptFiles = await glob(
    [
      'ui/**/*.js',
      'ui/**/*.ts',
      'ui/**/*.tsx',
      'shared/**/*.js',
      'shared/**/*.ts',
      'shared/**/*.tsx',
      'app/scripts/lib/**/*.js',
      'app/scripts/lib/**/*.ts',
      'app/scripts/constants/**/*.js',
      'app/scripts/constants/**/*.ts',
      'app/scripts/platforms/**/*.js',
      'app/scripts/controllers/**/*.ts',
    ],
    {
      ignore: [...globsToStrictSearch, testGlob],
    },
  );
  const javascriptFilesToStrictSearch = await glob(globsToStrictSearch, {
    ignore: [testGlob],
  });

  const strictSearchRegex =
    /\bt\(\s*'(\w+)'\s*\)|\btranslationKey:\s*'(\w+)'/gu;

  // match the keys from the locale file
  const keyRegex = /'(\w+)'|"(\w+)"/gu;
  const usedMessages = new Set();
  for await (const fileContents of getFileContents(javascriptFiles)) {
    for (const match of matchAll.call(fileContents, keyRegex)) {
      usedMessages.add(match[1] || match[2]);
    }
  }

  for await (const fileContents of getFileContents(
    javascriptFilesToStrictSearch,
  )) {
    for (const match of matchAll.call(fileContents, strictSearchRegex)) {
      usedMessages.add(match[1] || match[2] || match[3] || match[4]);
    }
  }

  // never consider these messages as unused
  const messageExceptions = [
    'appName',
    'appNameBeta',
    'appNameFlask',
    'appDescription',
    'rejected',
    'signed',
    // used via CSS
    'CSS_loadingTakingTooLongMessageText',
    'CSS_loadingTakingTooLongActionText',
  ];

  const englishMessages = Object.keys(locale);
  const unusedMessages = englishMessages.filter(
    (message) =>
      !messageExceptions.includes(message) && !usedMessages.has(message),
  );

  return {
    passed: unusedMessages.length === 0,
    unusedMessages,
    count: unusedMessages.length,
  };
}

/**
 * Fix unused messages by removing them
 * @param {Object} locale - Locale object to fix
 * @param {Object} options - Fix options
 * @returns {Object} Fixed locale object
 */
async function fix(locale, options = {}) {
  const result = await validate(locale, options);
  const newLocale = { ...locale };

  for (const key of result.unusedMessages) {
    delete newLocale[key];
  }

  return newLocale;
}

/**
 * Report unused messages validation results
 * @param {Object} results - Validation results
 * @param {Object} options - Reporting options
 */
function report(results, options = {}) {
  const { code = 'en' } = options;

  if (results.unusedMessages.length) {
    console.log(`**${code}**: ${results.count} unused messages`);
    log.info(`Messages not present in UI:`);
    results.unusedMessages.forEach(function (key) {
      log.info(`  - [ ] ${key}`);
    });
  }
}

module.exports = {
  name: 'unused-messages',
  validate,
  fix,
  report,
  // Only runs on English locale
  englishOnly: true,
};
