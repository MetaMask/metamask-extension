const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const log = require('loglevel');

const readFile = promisify(fs.readFile);

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

module.exports = {
  compareLocalesForMissingDescriptions,
  compareLocalesForMissingItems,
  getLocale,
  getLocalePath,
};
