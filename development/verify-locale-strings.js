#!/usr/bin/env node
// //////////////////////////////////////////////////////////////////////////////
//
// Locale verification script
//
// usage:
//
//     node app/scripts/verify-locale-strings.js [<locale>] [--fix] [--quiet]
//
// This script will validate that locales have no unused messages. It will check
// the English locale against string literals found under `ui/`, and it will check
// other locales by comparing them to the English locale. It will also validate
// that non-English locales have all descriptions present in the English locale.
//
// A report will be printed to the console detailing any unused messages.
//
// The if the optional '--fix' argument is given, locales will be automatically
// updated to remove any unused messages.
//
// The optional '--quiet' argument reduces the verbosity of the output, printing
// just a single summary of results for each locale verified
//
// //////////////////////////////////////////////////////////////////////////////

const { deepStrictEqual, AssertionError } = require('node:assert');
const fs = require('fs');
const { promisify } = require('util');
const log = require('loglevel');
const glob = require('fast-glob');
const matchAll = require('string.prototype.matchall').getPolyfill();
const localeIndex = require('../app/_locales/index.json');
const sentenceCaseExceptions = require('../app/_locales/sentence-case-exceptions.json');
const {
  compareLocalesForMissingDescriptions,
  compareLocalesForMissingItems,
  getLocale,
  getLocalePath,
} = require('./lib/locales');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);

// Build and compile a single regex from all exceptions for performance
function buildExceptionsRegex(exceptions) {
  const patterns = [];

  // Escape special regex characters for exact matches
  const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');

  // Add exact matches (escaped to treat as literals)
  exceptions.exactMatches.forEach((term) => {
    patterns.push(escapeRegex(term));
  });

  // Add acronyms (escaped to treat as literals)
  exceptions.acronyms.forEach((acronym) => {
    patterns.push(escapeRegex(acronym));
  });

  // Add existing regex patterns (already in regex format)
  Object.values(exceptions.patterns).forEach((pattern) => {
    patterns.push(pattern);
  });

  // Combine all patterns with OR operator
  return new RegExp(patterns.join('|'), 'u');
}

// Pre-compile the exceptions regex once at module load time
const specialCaseRegex = buildExceptionsRegex(sentenceCaseExceptions);

// Helper function to check if text contains special case terms
function containsSpecialCase(text) {
  return specialCaseRegex.test(text);
}

// Helper function to detect title case violations
function hasTitleCaseViolation(text) {
  // Remove quoted text (single quotes and escaped double quotes) before checking
  // Quoted text refers to UI elements and should preserve capitalization
  let textWithoutQuotes = text.replace(/'[^']*'/gu, ''); // Remove 'text'
  textWithoutQuotes = textWithoutQuotes.replace(/\\"[^"]*\\"/gu, ''); // Remove \"text\"

  // Ignore single words (filter out empty strings from whitespace)
  const words = textWithoutQuotes
    .split(/\s+/u)
    .filter((word) => word.length > 0);
  if (words.length < 2) {
    return false;
  }

  // Check if multiple words start with capital letters (Title Case pattern)
  // This pattern: "Word Word" or "Word Word Word"
  const titleCasePattern = /^([A-Z][a-z]+\s+)+[A-Z][a-z]+/u;

  // Also catch patterns like "In Progress", "Not Available"
  const multipleCapsPattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/u;

  return (
    titleCasePattern.test(textWithoutQuotes) ||
    multipleCapsPattern.test(textWithoutQuotes)
  );
}

// Helper function to convert to sentence case while preserving special cases
function toSentenceCase(text) {
  // If text contains special cases, we need to be careful
  if (containsSpecialCase(text)) {
    // Build a map of special terms and their positions
    const specialTerms = [];

    // Find all special terms from exact matches
    for (const term of sentenceCaseExceptions.exactMatches) {
      let index = text.indexOf(term);
      while (index !== -1) {
        specialTerms.push({ term, start: index, end: index + term.length });
        index = text.indexOf(term, index + 1);
      }
    }

    // Find all acronyms
    for (const acronym of sentenceCaseExceptions.acronyms) {
      let index = text.indexOf(acronym);
      while (index !== -1) {
        specialTerms.push({
          term: acronym,
          start: index,
          end: index + acronym.length,
        });
        index = text.indexOf(acronym, index + 1);
      }
    }

    // Sort by position first, then by length descending (prefer longer matches)
    // This ensures overlapping terms like "MetaMask Portfolio" are processed before "MetaMask"
    specialTerms.sort((a, b) => {
      if (a.start !== b.start) {
        return a.start - b.start;
      }
      // If same start position, prefer longer match
      return b.end - b.start - (a.end - a.start);
    });

    // Build result preserving special terms
    let result = '';
    let lastIndex = 0;

    for (const special of specialTerms) {
      // Skip overlapping terms (already covered by a previous term)
      if (special.start < lastIndex) {
        continue;
      }

      // Process text before this special term
      const before = text.substring(lastIndex, special.start);
      if (before) {
        result += convertToSentenceCase(before);
      }
      // Add the special term as-is
      result += special.term;
      lastIndex = special.end;
    }

    // Process remaining text
    if (lastIndex < text.length) {
      result += convertToSentenceCase(text.substring(lastIndex));
    }

    return result;
  }

  return convertToSentenceCase(text);
}

// Simple sentence case conversion
function convertToSentenceCase(text) {
  if (!text) {
    return text;
  }

  // Extract quoted text (single quotes and escaped double quotes) and preserve them
  const quotedTexts = [];
  let textToProcess = text;
  let placeholderIndex = 0;

  // Find all single-quoted text and replace with unique placeholders
  textToProcess = textToProcess.replace(/'([^']*)'/gu, (match) => {
    const uniquePlaceholder = `___QUOTED_${placeholderIndex}___`;
    quotedTexts.push({ placeholder: uniquePlaceholder, text: match });
    placeholderIndex += 1;
    return uniquePlaceholder;
  });

  // Find all escaped double-quoted text and replace with unique placeholders
  textToProcess = textToProcess.replace(/\\"([^"]*)\\"/gu, (match) => {
    const uniquePlaceholder = `___QUOTED_${placeholderIndex}___`;
    quotedTexts.push({ placeholder: uniquePlaceholder, text: match });
    placeholderIndex += 1;
    return uniquePlaceholder;
  });

  // Convert to sentence case
  const words = textToProcess.split(/\s+/u).filter((word) => word.length > 0);
  let converted = words
    .map((word, index) => {
      // Check if word contains a placeholder (exact match or with punctuation)
      if (
        quotedTexts.some(
          (q) => word === q.placeholder || word.includes(q.placeholder),
        )
      ) {
        return word;
      }
      if (index === 0) {
        // First word: capitalize first letter
        return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
      }
      // Other words: all lowercase
      return word.toLowerCase();
    })
    .join(' ');

  // Restore quoted text with unique placeholders
  quotedTexts.forEach(({ placeholder, text: quotedText }) => {
    converted = converted.replace(placeholder, quotedText);
  });

  return converted;
}

// Validate sentence case compliance for a locale
function validateSentenceCaseCompliance(locale) {
  const violations = [];

  for (const [key, value] of Object.entries(locale)) {
    if (!value || !value.message) {
      continue;
    }

    const text = value.message;

    // Skip if contains special cases
    if (containsSpecialCase(text)) {
      continue;
    }

    // Check for title case violations
    if (hasTitleCaseViolation(text)) {
      const suggested = toSentenceCase(text);
      violations.push({
        key,
        current: text,
        suggested,
      });
    }
  }

  return violations;
}

log.setDefaultLevel('info');

let fix = false;
let specifiedLocale;
for (const arg of process.argv.slice(2)) {
  if (arg === '--fix') {
    fix = true;
  } else if (arg === '--quiet') {
    log.setLevel('error');
  } else {
    specifiedLocale = arg;
  }
}

main().catch((error) => {
  log.error(error);
  process.exit(1);
});

async function main() {
  if (specifiedLocale) {
    log.info(`Verifying selected locale "${specifiedLocale}":\n`);
    const localeEntry = localeIndex.find(
      (localeMeta) => localeMeta.code === specifiedLocale,
    );
    if (!localeEntry) {
      throw new Error(`No localize entry found for ${specifiedLocale}`);
    }

    const failed =
      specifiedLocale === 'en'
        ? await verifyEnglishLocale()
        : await verifyLocale(specifiedLocale);
    if (failed) {
      process.exit(1);
    } else {
      console.log('No invalid entries!');
    }
  } else {
    log.info('Verifying all locales:\n');
    let failed = await verifyEnglishLocale(fix);
    const localeCodes = localeIndex
      .filter((localeMeta) => localeMeta.code !== 'en')
      .map((localeMeta) => localeMeta.code);

    for (const code of localeCodes) {
      const localeFailed = await verifyLocale(code, fix);
      failed = failed || localeFailed;
    }

    if (failed) {
      process.exit(1);
    } else {
      console.log('No invalid entries!');
    }
  }
}

// eslint-disable-next-line consistent-return
async function writeLocale(code, locale) {
  try {
    const localeFilePath = getLocalePath(code);
    return writeFile(
      localeFilePath,
      `${JSON.stringify(locale, null, 2)}\n`,
      'utf8',
    );
  } catch (e) {
    if (e.code === 'ENOENT') {
      log.error('Locale file not found');
    } else {
      log.error(`Error writing your locale ("${code}") file: `, e);
    }
    process.exit(1);
  }
}

async function verifyLocale(code) {
  const englishLocale = await getLocale('en');
  let failed = false;

  try {
    // `en_GB` is a special case, added for compliance reasons
    // Not used in-app. Should be identical to `en`.
    const englishGbLocale = await getLocale('en_GB');
    deepStrictEqual(
      englishLocale,
      englishGbLocale,
      'en_GB should be identical to en',
    );
  } catch (error) {
    if (!(error instanceof AssertionError)) {
      throw error;
    }

    if (fix) {
      console.info('Differences detected in `en_GB` local; overwriting');
      await writeLocale('en_GB', englishLocale);
    } else {
      console.error(error);
    }
    failed = true;
  }

  const targetLocale = await getLocale(code);

  const extraItems = compareLocalesForMissingItems({
    base: targetLocale,
    subject: englishLocale,
  });

  if (extraItems.length) {
    console.log(`**${code}**: ${extraItems.length} unused messages`);
    log.info('Extra items that should not be localized:');
    extraItems.forEach(function (key) {
      log.info(`  - [ ] ${key}`);
    });
  }

  const missingDescriptions = compareLocalesForMissingDescriptions({
    englishLocale,
    targetLocale,
  });

  if (missingDescriptions.length) {
    console.log(
      `**${code}**: ${missingDescriptions.length} missing descriptions`,
    );
    log.info('Messages with missing descriptions:');
    missingDescriptions.forEach(function (key) {
      log.info(`  - [ ] ${key}`);
    });
  }

  if (extraItems.length > 0 || missingDescriptions.length > 0) {
    if (fix) {
      const newLocale = { ...targetLocale };
      for (const item of extraItems) {
        delete newLocale[item];
      }
      for (const message of Object.keys(englishLocale)) {
        if (englishLocale[message].description && targetLocale[message]) {
          targetLocale[message].description =
            englishLocale[message].description;
        }
      }
      await writeLocale(code, newLocale);
    }
    failed = true;
  }

  return failed;
}

async function verifyEnglishLocale() {
  const englishLocale = await getLocale('en');
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
  // match "t(`...`)" because constructing message keys from template strings
  // prevents this script from finding the messages, and then inappropriately
  // deletes them
  const templateStringRegex = /\bt\(`.*`\)/gu;
  const templateUsage = [];

  // match the keys from the locale file
  const keyRegex = /'(\w+)'|"(\w+)"/gu;
  const usedMessages = new Set();
  for await (const fileContents of getFileContents(javascriptFiles)) {
    for (const match of matchAll.call(fileContents, keyRegex)) {
      usedMessages.add(match[1] || match[2]);
    }
    const templateMatches = fileContents.match(templateStringRegex);
    if (templateMatches) {
      templateMatches.forEach((match) => templateUsage.push(match));
    }
  }

  for await (const fileContents of getFileContents(
    javascriptFilesToStrictSearch,
  )) {
    for (const match of matchAll.call(fileContents, strictSearchRegex)) {
      usedMessages.add(match[1] || match[2] || match[3] || match[4]);
    }

    const templateMatches = fileContents.match(templateStringRegex);
    if (templateMatches) {
      templateMatches.forEach((match) => templateUsage.push(match));
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

  const englishMessages = Object.keys(englishLocale);
  const unusedMessages = englishMessages.filter(
    (message) =>
      !messageExceptions.includes(message) && !usedMessages.has(message),
  );

  if (unusedMessages.length) {
    console.log(`**en**: ${unusedMessages.length} unused messages`);
    log.info(`Messages not present in UI:`);
    unusedMessages.forEach(function (key) {
      log.info(`  - [ ] ${key}`);
    });
  }

  if (templateUsage.length) {
    log.info(`Forbidden use of template strings in 't' function:`);
    templateUsage.forEach(function (occurrence) {
      log.info(` - ${occurrence}`);
    });
  }

  // Check sentence case compliance
  const sentenceCaseViolations = validateSentenceCaseCompliance(englishLocale);

  if (sentenceCaseViolations.length) {
    console.log(
      `**en**: ${sentenceCaseViolations.length} sentence case violations`,
    );
    log.info(`Messages not following sentence case:`);
    sentenceCaseViolations.forEach(function (violation) {
      log.info(
        `  - [ ] ${violation.key}: "${violation.current}" → "${violation.suggested}"`,
      );
    });
  }

  if (
    !unusedMessages.length &&
    !templateUsage.length &&
    !sentenceCaseViolations.length
  ) {
    return false; // failed === false
  }

  // Apply fixes if --fix flag is used
  // Combine both unused message deletions and sentence case fixes into a single write
  if ((unusedMessages.length > 0 || sentenceCaseViolations.length > 0) && fix) {
    const newLocale = { ...englishLocale };

    // Remove unused messages
    for (const key of unusedMessages) {
      delete newLocale[key];
    }

    // Apply sentence case fixes
    for (const violation of sentenceCaseViolations) {
      if (newLocale[violation.key]) {
        newLocale[violation.key].message = violation.suggested;
      }
    }

    // Write once with all changes applied
    await writeLocale('en', newLocale);
  }

  return true; // failed === true
}

async function* getFileContents(filenames) {
  for (const filename of filenames) {
    yield readFile(filename, 'utf8');
  }
}
