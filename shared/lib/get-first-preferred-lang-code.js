import browser from 'webextension-polyfill';

// 只支持英文和日文
const supportedLocales = {
  'en': 'en',
  'en-us': 'en',
  'en-gb': 'en',
  'ja': 'ja',
  'ja-jp': 'ja'
};

/**
 * Returns a preferred language code, based on settings within the user's browser.
 * Only supports English and Japanese. Defaults to English if no supported language is detected.
 *
 * @returns {Promise<string>} Promises a locale code, either 'en' or 'ja'
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

  // 查找用户首选语言中是否包含支持的语言
  const firstPreferredLangCode = userPreferredLocaleCodes
    .map((code) => code.toLowerCase().replace('_', '-'))
    .find((code) => supportedLocales[code] !== undefined);

  // 如果找到支持的语言，返回对应的语言代码，否则默认返回英文
  return supportedLocales[firstPreferredLangCode] || 'en';
}
