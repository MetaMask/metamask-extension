#!/usr/bin/env node
const log = require('loglevel');
const localeIndex = require('../../app/_locales/index.json');
const { getLocale } = require('../lib/locales');
const { parseArgs } = require('./cli');

// Import all validators
const sentenceCaseValidator = require('./validators/sentence-case');
const enGbSyncValidator = require('./validators/en-gb-sync');
const unusedMessagesValidator = require('./validators/unused-messages');
const templateUsageValidator = require('./validators/template-usage');
const missingDescriptionsValidator = require('./validators/missing-descriptions');
const extraItemsValidator = require('./validators/extra-items');

// Registry of all validators
const validators = [
  unusedMessagesValidator,
  templateUsageValidator,
  sentenceCaseValidator,
];

const nonEnglishValidators = [extraItemsValidator, missingDescriptionsValidator];

/**
 * Run validators for English locale
 * @param {Object} options - CLI options
 * @returns {Promise<Object>} Validation results
 */
async function runEnglishValidators(options) {
  const englishLocale = await getLocale('en');
  let failed = false;
  const results = [];

  for (const validator of validators) {
    // Skip if not in --only list (when specified)
    if (options.only.length && !options.only.includes(validator.name)) {
      continue;
    }

    // Skip if in --skip list
    if (options.skip.includes(validator.name)) {
      continue;
    }

    // Skip validators marked as nonEnglishOnly
    if (validator.nonEnglishOnly) {
      continue;
    }

    const result = await validator.validate(englishLocale, {
      code: 'en',
      ...options,
    });

    if (!result.passed) {
      if (validator.report) {
        validator.report(result, { code: 'en', ...options });
      }

      if (options.fix && validator.fix) {
        const fixedLocale = await validator.fix(englishLocale, {
          code: 'en',
          ...options,
        });
        // Merge fixes back into englishLocale for subsequent validators
        Object.assign(englishLocale, fixedLocale);
      }

      failed = true;
    }

    results.push({ validator: validator.name, ...result });
  }

  // Write the fixed locale if any fixes were applied
  if (options.fix && failed) {
    const { writeLocale } = require('../lib/locales');
    await writeLocale('en', englishLocale);
  }

  return { failed, results };
}

/**
 * Run validators for non-English locale
 * @param {string} code - Locale code
 * @param {Object} options - CLI options
 * @returns {Promise<boolean>} True if validation failed
 */
async function runNonEnglishValidators(code, options) {
  const englishLocale = await getLocale('en');
  const targetLocale = await getLocale(code);
  let failed = false;

  for (const validator of nonEnglishValidators) {
    // Skip if not in --only list (when specified)
    if (options.only.length && !options.only.includes(validator.name)) {
      continue;
    }

    // Skip if in --skip list
    if (options.skip.includes(validator.name)) {
      continue;
    }

    // Skip validators marked as englishOnly
    if (validator.englishOnly) {
      continue;
    }

    const result = await validator.validate(targetLocale, {
      code,
      englishLocale,
      ...options,
    });

    if (!result.passed) {
      if (validator.report) {
        validator.report(result, { code, ...options });
      }

      if (options.fix && validator.fix) {
        const fixedLocale = await validator.fix(targetLocale, {
          code,
          englishLocale,
          ...options,
        });
        // Merge fixes back into targetLocale
        Object.assign(targetLocale, fixedLocale);
      }

      failed = true;
    }
  }

  // Write the fixed locale if any fixes were applied
  if (options.fix && failed) {
    const { writeLocale } = require('../lib/locales');
    await writeLocale(code, targetLocale);
  }

  return failed;
}

/**
 * Run en_GB sync validator
 * @param {Object} options - CLI options
 * @returns {Promise<boolean>} True if validation failed
 */
async function runEnGbSync(options) {
  // Skip if not in --only list (when specified)
  if (
    options.only.length &&
    !options.only.includes(enGbSyncValidator.name)
  ) {
    return false;
  }

  // Skip if in --skip list
  if (options.skip.includes(enGbSyncValidator.name)) {
    return false;
  }

  const result = await enGbSyncValidator.validate(null, options);

  if (!result.passed) {
    if (enGbSyncValidator.report) {
      enGbSyncValidator.report(result, options);
    }

    if (options.fix && enGbSyncValidator.fix) {
      const englishLocale = await enGbSyncValidator.fix(null, options);
      const { writeLocale } = require('../lib/locales');
      await writeLocale('en_GB', englishLocale);
      console.info('Differences detected in `en_GB` locale; overwriting');
    }

    return true;
  }

  return false;
}

/**
 * Main function
 */
async function main() {
  const options = parseArgs();

  // Set log level
  log.setDefaultLevel(options.quiet ? 'error' : 'info');

  if (options.locale) {
    log.info(`Verifying selected locale "${options.locale}":\n`);
    const localeEntry = localeIndex.find(
      (localeMeta) => localeMeta.code === options.locale,
    );

    // Allow en_GB even though it's not in index
    if (!localeEntry && options.locale !== 'en_GB') {
      throw new Error(`No locale entry found for ${options.locale}`);
    }

    let failed = false;

    if (options.locale === 'en') {
      const { failed: enFailed } = await runEnglishValidators(options);
      failed = enFailed;
    } else if (options.locale === 'en_GB') {
      failed = await runEnGbSync(options);
    } else {
      failed = await runNonEnglishValidators(options.locale, options);
    }

    if (failed) {
      process.exit(1);
    } else {
      console.log('No invalid entries!');
    }
  } else {
    log.info('Verifying all locales:\n');
    let failed = false;

    // Run English validators
    const { failed: enFailed } = await runEnglishValidators(options);
    failed = enFailed;

    // Run en_GB sync
    const gbFailed = await runEnGbSync(options);
    failed = failed || gbFailed;

    // Run validators for all other locales
    const localeCodes = localeIndex
      .filter((localeMeta) => localeMeta.code !== 'en')
      .map((localeMeta) => localeMeta.code);

    for (const code of localeCodes) {
      const localeFailed = await runNonEnglishValidators(code, options);
      failed = failed || localeFailed;
    }

    if (failed) {
      process.exit(1);
    } else {
      console.log('No invalid entries!');
    }
  }
}

// Run main function
main().catch((error) => {
  log.error(error);
  process.exit(1);
});
