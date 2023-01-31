import browser from 'webextension-polyfill';
import allLocales from '../../_locales/index.json';

// ensure that we default users with browser language code 'zh' to the supported 'zh_CN' language code
const existingLocaleCodes = { zh: 'zh_CN' };

// mapping some browsers return hyphen instead underscore in locale codes (e.g. zh_TW -> zh-tw)
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
 */
export default async function getFirstPreferredLangCode() {
  let userPreferredLocaleCodes;

  try {
    userPreferredLocaleCodes = await browser.i18n.getAcceptLanguages();
  } catch (e) {
    // Brave currently throws when calling getAcceptLanguages, so this handles that.
    userPreferredLocaleCodes = [];
  }

  // safeguard for Brave Browser until they implement chrome.i18n.getAcceptLanguages
  // https://github.com/MetaMask/metamask-extension/issues/4270
  if (!userPreferredLocaleCodes) {
    userPreferredLocaleCodes = [];
  }

  let firstPreferredLangCode = userPreferredLocaleCodes
    .map((code) => code.toLowerCase().replace('_', '-'))
    .find(
      (code) =>
        existingLocaleCodes[code] !== undefined ||
        existingLocaleCodes[code.split('-')[0]] !== undefined,
    );

  // if we have matched against a code with a '-' present, meaning its a regional
  // code for which we have a non-regioned locale, we need to set firstPreferredLangCode
  // to the correct non-regional code.
  if (
    firstPreferredLangCode !== undefined &&
    existingLocaleCodes[firstPreferredLangCode] === undefined
  ) {
    firstPreferredLangCode = firstPreferredLangCode.split('-')[0];
  }

  return existingLocaleCodes[firstPreferredLangCode] || 'en';
}
