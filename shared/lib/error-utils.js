import { memoize, escape as lodashEscape } from 'lodash';
import { fetchLocale, loadRelativeTimeFormatLocaleData } from '../modules/i18n';
import getFirstPreferredLangCode from './get-first-preferred-lang-code';
import { switchDirectionForPreferredLocale } from './switch-direction';

const defaultLocale = 'en';
const _setupLocale = async (currentLocale) => {
  const enRelativeTime = loadRelativeTimeFormatLocaleData(defaultLocale);
  const enLocale = fetchLocale(defaultLocale);

  const promises = [enRelativeTime, enLocale];
  if (currentLocale === defaultLocale) {
    // enLocaleMessages and currentLocaleMessages are the same; reuse enLocale
    promises.push(enLocale); // currentLocaleMessages
  } else if (currentLocale) {
    // currentLocale does not match enLocaleMessages
    promises.push(fetchLocale(currentLocale)); // currentLocaleMessages
    promises.push(loadRelativeTimeFormatLocaleData(currentLocale));
  } else {
    // currentLocale is not set
    promises.push(Promise.resolve({})); // currentLocaleMessages
  }

  const [, enLocaleMessages, currentLocaleMessages] =
    await Promise.all(promises);
  return { currentLocaleMessages, enLocaleMessages };
};

export const setupLocale = memoize(_setupLocale);

export const getLocaleContext = (currentLocaleMessages, enLocaleMessages) => {
  return (key) => {
    let message = currentLocaleMessages[key]?.message;
    if (!message && enLocaleMessages[key]) {
      message = enLocaleMessages[key].message;
    }
    return message;
  };
};

export function getErrorHtmlBase(errorBody) {
  return `
    <div class="critical-error__container">
      <div class="critical-error">
        <div class="critical-error__icon">
          <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="m443 342l-126-241c-16-32-40-50-65-50-26 0-50 18-66 50l-126 241c-16 30-18 60-5 83 13 23 38 36 71 36l251 0c33 0 58-13 71-36 13-23 11-53-5-83z m-206-145c0-8 6-15 15-15 8 0 14 7 14 15l0 105c0 8-6 15-14 15-9 0-15-7-15-15z m28 182c-1 1-2 2-3 3-1 0-2 1-3 1-1 1-2 1-4 2-1 0-2 0-3 0-2 0-3 0-4 0-2-1-3-1-4-2-1 0-2-1-3-1-1-1-2-2-3-3-4-4-6-9-6-15 0-5 2-11 6-15 1 0 2-1 3-2 1-1 2-2 3-2 1-1 2-1 4-1 2-1 5-1 7 0 2 0 3 0 4 1 1 0 2 1 3 2 1 1 2 2 3 2 4 4 6 10 6 15 0 6-2 11-6 15z"/>
          </svg>
        </div>
        <div>
          ${errorBody}
        </div>
      </div>
    </div>
  `;
}

/**
 * Tries really hard to get the locale context function from the given locale.
 *
 * It falls back to the default browser locale, or 'en' if that fails.
 * If we can't get the locale context from some reason (the `messages.json`
 * file for the locale), we return a function that just returns the value passed
 * to it, which isn't ideal... but at least it is something (the alternative
 * is to hard-code the English locale in this file, which would be very hard
 * to maintain).
 *
 * Does not throw.
 *
 * @param {string} [currentLocale] - The current locale
 * @returns {Promise<{preferredLocale: string, t: (any) => any}>} A promise that resolves to an object containing the preferred locale and a translation function.
 */
export async function maybeGetLocaleContext(currentLocale) {
  let preferredLocale;
  try {
    preferredLocale = currentLocale ?? (await getFirstPreferredLangCode());
    const response = await setupLocale(preferredLocale);
    const { currentLocaleMessages, enLocaleMessages } = response;
    const t = getLocaleContext(currentLocaleMessages, enLocaleMessages);
    return { preferredLocale, t };
  } catch (error) {
    console.error('Error setting up locale:', error);
    return { preferredLocale: preferredLocale ?? 'en', t: (value) => value };
  }
}

/**
 * Get the HTML for a critical error message.
 *
 * @param {import('../../ui/helpers/utils/display-critical-error').CriticalErrorTranslationKey} errorKey - The key for the error message.
 * @param {ErrorLike} error - The error object to log.
 * @param {{preferredLocale: string, t: (string) => string}} localeContext - The MetaMask state containing the current locale.
 * @param {string} [supportLink] - The support link to include in the footer.
 * @returns {string} The HTML string for the critical error message.
 */
export function getErrorHtml(errorKey, error, localeContext, supportLink) {
  switchDirectionForPreferredLocale(localeContext.preferredLocale);
  const { t } = localeContext;

  const legalText = `
    <span>
      We will receive a single error report, containing:<br />
      - Technical diagnostic information.<br />
      - Your browser, operating system and MetaMask versions.<br />
      <br />
      No personal information or other device information will be collected.
    </span>
  `;

  const footer = supportLink
    ? `
      <p class="critical-error__footer">
        <span>${lodashEscape(t('stillGettingMessage'))}</span>
        <br />
        <a
          href="${lodashEscape(supportLink)}"
          class="critical-error__link"
          target="_blank"
          rel="noopener noreferrer">
            ${lodashEscape(t('errorPageContactSupport'))}
        </a>
      </p>
    `
    : '';

  let detailsRawHtml = '';
  if (error?.message) {
    detailsRawHtml += `<strong>${lodashEscape(t('errorDetails'))}</strong>\n`;
    detailsRawHtml += `<p class="critical-error__details"><code>${lodashEscape(error?.message)}</code></p>`;
  }

  /**
   * The pattern ${errorKey === 'somethingIsWrong' ? t('somethingIsWrong') : ''}
   * is necessary because we we need linter to see the string
   * of the locale keys. If we use the variable directly, the linter will not
   * see the string and will not be able to check if the locale key exists.
   */
  return getErrorHtmlBase(`
      <h1>${lodashEscape(t('troubleStartingTitle'))}</h1>
      <p>
        ${errorKey === 'troubleStarting' ? t('troubleStartingMessage') : ''}
        ${errorKey === 'somethingIsWrong' ? t('somethingIsWrong') : ''}
      </p>
      ${detailsRawHtml}
      <input type="checkbox" checked>
        ${lodashEscape(t('sendBugReport'))}
        <button
          id="critical-error__tip-anchor"
          popovertarget="critical-error__legal-text"
        >
          ℹ️
        </button>
      </input>
      <div
        popover
        anchor="critical-error__tip-anchor"
        id="critical-error__legal-text"
        class="critical-error__legal-text"
      >
        ${legalText}
      </div>
        ${lodashEscape(t('restartMetamask'))}
      </button>
      ${footer}
    `);
}
