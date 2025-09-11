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
 * @param {{preferredLocale: string, t: (string) => string}} localeContext - The MetaMask state containing the current locale and translation function.
 * @param {string} [supportLink] - The support link to include in the footer.
 * @returns {string} The HTML string for the critical error message.
 */
export function getErrorHtml(errorKey, error, localeContext, supportLink) {
  switchDirectionForPreferredLocale(localeContext.preferredLocale);
  const { t } = localeContext;

  const legalText = `
    <span>${lodashEscape(t('errorLegalTextSummary'))}</span>
    <p>• ${lodashEscape(t('errorLegalTextFirstInfo'))}</p>
    <p>• ${lodashEscape(t('errorLegalTextSecondInfo'))}</p>
    <span>${lodashEscape(t('errorLegalTextNoPersonalInfo'))}</span>
`;

  const footer = supportLink
    ? `
      <p class="critical-error__footer">
        <span>${lodashEscape(t('stillGettingMessage'))}</span>
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
      <label class="critical-error__report">
        <input
        id="critical-error-checkbox"
          type="checkbox"
          checked
          class="critical-error__report-checkbox"
        />
        <span class="critical-error__report-text">
          ${lodashEscape(t('reportThisError'))}
        </span>
        <button
          id="critical-error-tip-anchor"
          popovertarget="critical-error-legal-text"
          type="button"
          class="critical-error__info"
        >
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="critical-error__info-icon">
            <path d="m11 17h2v-6h-2zm1-8c.2833 0 .5208-.09583.7125-.2875s.2875-.42917.2875-.7125-.0958-.52083-.2875-.7125-.4292-.2875-.7125-.2875-.5208.09583-.7125.2875-.2875.42917-.2875.7125.0958.52083.2875.7125.4292.2875.7125.2875zm0 13c-1.3833 0-2.68333-.2625-3.9-.7875s-2.275-1.2375-3.175-2.1375-1.6125-1.9583-2.1375-3.175-.7875-2.5167-.7875-3.9.2625-2.68333.7875-3.9 1.2375-2.275 2.1375-3.175 1.95833-1.6125 3.175-2.1375 2.5167-.7875 3.9-.7875 2.6833.2625 3.9.7875 2.275 1.2375 3.175 2.1375 1.6125 1.95833 2.1375 3.175.7875 2.5167.7875 3.9-.2625 2.6833-.7875 3.9-1.2375 2.275-2.1375 3.175-1.9583 1.6125-3.175 2.1375-2.5167.7875-3.9.7875zm0-2c2.2333 0 4.125-.775 5.675-2.325s2.325-3.4417 2.325-5.675c0-2.23333-.775-4.125-2.325-5.675s-3.4417-2.325-5.675-2.325c-2.23333 0-4.125.775-5.675 2.325s-2.325 3.44167-2.325 5.675c0 2.2333.775 4.125 2.325 5.675s3.44167 2.325 5.675 2.325z"/>
          </svg>
        </button>
      </label>
      <div
        popover
        anchor="critical-error-tip-anchor"
        id="critical-error-legal-text"
        class="critical-error__legal-text"
      >
        ${legalText}
      </div>
      <button
        id="critical-error-button"
        class="critical-error__button-restore button btn-primary"
        title="Report this error and restart MetaMask">
        ${lodashEscape(t('restartMetamask'))}
      </button>
      ${footer}
    `);
}
