const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const log = require('loglevel');

const readFile = promisify(fs.readFile);
// Keep these patterns in sync with shared/lib/i18n.ts applySubstitutions().
const RUNTIME_REPLACEMENT_KEY_REGEX = /\$\d/gu;
const INVALID_REPLACEMENT_KEY_REGEX = /\$\d{2,}|\$0/gu;

function getLocalePath(code) {
  return path.resolve(
    __dirname,
    '..',
    '..',
    'app',
    '_locales',
    code,
    'messages.json',
  );
}

// eslint-disable-next-line consistent-return
async function getLocale(code) {
  try {
    const localeFilePath = getLocalePath(code);
    const fileContents = await readFile(localeFilePath, 'utf8');
    return JSON.parse(fileContents);
  } catch (e) {
    if (e.code === 'ENOENT') {
      log.error('Locale file not found');
    } else {
      log.error(`Error opening your locale ("${code}") file: `, e);
    }
    process.exit(1);
  }
}

function compareLocalesForMissingItems({ base, subject }) {
  return Object.keys(base).filter((key) => !subject[key]);
}

function compareLocalesForMissingDescriptions({ englishLocale, targetLocale }) {
  return Object.keys(englishLocale).filter(
    (key) =>
      targetLocale[key] !== undefined &&
      englishLocale[key].description !== undefined &&
      englishLocale[key].description !== targetLocale[key].description,
  );
}

function compareLocalesForUnexpectedReplacementKeys({
  englishLocale,
  targetLocale,
}) {
  return Object.keys(englishLocale).flatMap((key) => {
    if (targetLocale[key] === undefined) {
      return [];
    }

    const englishMessage = englishLocale[key].message;
    const targetMessage = targetLocale[key].message;
    const englishInvalidReplacementKeys =
      getInvalidReplacementKeys(englishMessage);
    const targetInvalidReplacementKeys =
      getInvalidReplacementKeys(targetMessage);

    // Invalid replacement-key syntax is reported separately, so skip parity
    // checks here to avoid duplicate or misleading errors for the same message.
    if (
      englishInvalidReplacementKeys.length > 0 ||
      targetInvalidReplacementKeys.length > 0
    ) {
      return [];
    }

    const englishReplacementKeys = new Set(getReplacementKeys(englishMessage));
    const targetReplacementKeys = getReplacementKeys(targetMessage);
    const unexpectedReplacementKeys = targetReplacementKeys.filter(
      (replacementKey) => !englishReplacementKeys.has(replacementKey),
    );

    if (unexpectedReplacementKeys.length === 0) {
      return [];
    }

    return [
      {
        key,
        unexpectedReplacementKeys,
      },
    ];
  });
}

function getMessagesWithInvalidReplacementKeys(locale) {
  return Object.keys(locale).flatMap((key) => {
    const invalidReplacementKeys = getInvalidReplacementKeys(
      locale[key].message,
    );

    if (invalidReplacementKeys.length === 0) {
      return [];
    }

    return [
      {
        invalidReplacementKeys,
        key,
      },
    ];
  });
}

function getReplacementKeys(message) {
  return getReplacementKeyMatches(message, RUNTIME_REPLACEMENT_KEY_REGEX);
}

function getInvalidReplacementKeys(message) {
  return getReplacementKeyMatches(message, INVALID_REPLACEMENT_KEY_REGEX);
}

function getReplacementKeyMatches(message, regex) {
  return [...new Set(message.match(regex) ?? [])].sort(
    (firstKey, secondKey) =>
      Number(firstKey.slice(1)) - Number(secondKey.slice(1)),
  );
}

module.exports = {
  compareLocalesForMissingDescriptions,
  compareLocalesForMissingItems,
  compareLocalesForUnexpectedReplacementKeys,
  getMessagesWithInvalidReplacementKeys,
  getLocale,
  getLocalePath,
};
