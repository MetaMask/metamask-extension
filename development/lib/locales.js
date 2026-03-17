const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const log = require('loglevel');

const readFile = promisify(fs.readFile);
const INVALID_REPLACEMENT_KEY_REGEX = /\$\d{2,}/gu;
const REPLACEMENT_KEY_REGEX = /\$\d(?!\d)/gu;

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

    const englishReplacementKeys = getReplacementKeys(
      englishLocale[key]?.message,
    );
    const targetReplacementKeys = getReplacementKeys(
      targetLocale[key]?.message,
    );
    const unexpectedReplacementKeys = targetReplacementKeys.filter(
      (replacementKey) => !englishReplacementKeys.includes(replacementKey),
    );

    if (unexpectedReplacementKeys.length === 0) {
      return [];
    }

    return [
      {
        englishReplacementKeys,
        key,
        targetReplacementKeys,
        unexpectedReplacementKeys,
      },
    ];
  });
}

function getMessagesWithInvalidReplacementKeys(locale) {
  return Object.keys(locale).flatMap((key) => {
    const invalidReplacementKeys = getInvalidReplacementKeys(
      locale[key]?.message,
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

function getReplacementKeys(message = '') {
  return [...new Set(message.match(REPLACEMENT_KEY_REGEX) ?? [])].sort(
    (firstKey, secondKey) =>
      Number(firstKey.slice(1)) - Number(secondKey.slice(1)),
  );
}

function getInvalidReplacementKeys(message = '') {
  return [...new Set(message.match(INVALID_REPLACEMENT_KEY_REGEX) ?? [])].sort(
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
