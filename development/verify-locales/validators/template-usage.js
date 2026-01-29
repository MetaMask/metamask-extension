const fs = require('fs');
const { promisify } = require('util');
const log = require('loglevel');
const glob = require('fast-glob');

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
 * Validate that template strings are not used in t() function
 * @param {Object} locale - Locale object (not used)
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
async function validate(locale, options = {}) {
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

  // match "t(`...`)" because constructing message keys from template strings
  // prevents this script from finding the messages, and then inappropriately
  // deletes them
  const templateStringRegex = /\bt\(`.*`\)/gu;
  const templateUsage = [];

  for await (const fileContents of getFileContents(javascriptFiles)) {
    const templateMatches = fileContents.match(templateStringRegex);
    if (templateMatches) {
      templateMatches.forEach((match) => templateUsage.push(match));
    }
  }

  for await (const fileContents of getFileContents(
    javascriptFilesToStrictSearch,
  )) {
    const templateMatches = fileContents.match(templateStringRegex);
    if (templateMatches) {
      templateMatches.forEach((match) => templateUsage.push(match));
    }
  }

  return {
    passed: templateUsage.length === 0,
    templateUsage,
    count: templateUsage.length,
  };
}

/**
 * Report template usage validation results
 * @param {Object} results - Validation results
 * @param {Object} options - Reporting options
 */
function report(results, options = {}) {
  if (results.templateUsage.length) {
    log.info(`Forbidden use of template strings in 't' function:`);
    results.templateUsage.forEach(function (occurrence) {
      log.info(` - ${occurrence}`);
    });
  }
}

module.exports = {
  name: 'template-usage',
  validate,
  report,
  // Only runs on English locale
  englishOnly: true,
  // No fix function - this requires manual code changes
};
