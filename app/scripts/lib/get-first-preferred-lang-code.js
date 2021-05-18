import extension from 'extensionizer';
import promisify from 'pify';
import allLocales from '../../_locales/index.json';

const getPreferredLocales = extension.i18n
  ? promisify(extension.i18n.getAcceptLanguages, { errorFirst: false })
  : async () => [];

// mapping some browsers return hyphen instead underscore in locale codes (e.g. zh_TW -> zh-tw)
const existingLocaleCodes = {};
allLocales.forEach((locale) => {
  if (locale && locale.code) {
    existingLocaleCodes[locale.code.toLowerCase().replace('_', '-')] =
      locale.code;
  }
});

/**
 * Returns a preferred language code, based on settings within the user's browser. If we have no translations for the
 * users preferred locales, 'en' is returned.
 *
 * @returns {Promise<string>} Promises a locale code, either one from the user's preferred list that we have a translation for, or 'en'
 *
 */
export default async function getFirstPreferredLangCode() {
  let userPreferredLocaleCodes;

  try {
    userPreferredLocaleCodes = await getPreferredLocales();
  } catch (e) {
    // Brave currently throws when calling getAcceptLanguages, so this handles that.
    userPreferredLocaleCodes = [];
  }

  // safeguard for Brave Browser until they implement chrome.i18n.getAcceptLanguages
  // https://github.com/MetaMask/metamask-extension/issues/4270
  if (!userPreferredLocaleCodes) {
    userPreferredLocaleCodes = [];
  }

  const firstPreferredLangCode = userPreferredLocaleCodes
    .map((code) => code.toLowerCase().replace('_', '-'))
    .find((code) => existingLocaleCodes[code] !== undefined);

  return existingLocaleCodes[firstPreferredLangCode] || 'en';
}
