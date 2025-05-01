import { memoize, escape as lodashEscape } from 'lodash';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import getFirstPreferredLangCode from '../../app/scripts/lib/get-first-preferred-lang-code';
import {
  I18NMessageDict,
  fetchLocale,
  loadRelativeTimeFormatLocaleData,
} from '../modules/i18n';

export type ErrorLike = {
  message: string;
  name: string;
  stack?: string;
};

export type TranslateFunction = (key: string) => string;

const defaultLocale = 'en';

/**
 * Returns the locale messages for the current locale and the default locale (en).
 *
 * @param {string} currentLocale - The current locale.
 */
const _setupLocale = async (
  currentLocale: string,
): Promise<{
  currentLocaleMessages: I18NMessageDict;
  enLocaleMessages: I18NMessageDict;
}> => {
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

  const [, enLocaleMessages, currentLocaleMessages] = (await Promise.all(
    promises,
  )) as [void, I18NMessageDict, I18NMessageDict];
  return { currentLocaleMessages, enLocaleMessages };
};

export const setupLocale = memoize(_setupLocale);

/**
 *
 * @param {I18NMessageDict} currentLocaleMessages - The current locale messages.
 * @param {I18NMessageDict} enLocaleMessages - The English locale messages.
 */
export const getLocaleContext = (
  currentLocaleMessages: I18NMessageDict,
  enLocaleMessages: I18NMessageDict,
) => {
  return (key: string) => {
    let message = currentLocaleMessages[key]?.message;
    if (!message && enLocaleMessages[key]) {
      message = enLocaleMessages[key].message;
    }
    return message;
  };
};

/**
 *
 * @param locale - The locale to use. If not provided, the first preferred language code will be used.
 */
export const getLocaleContextFromLocale = async (locale?: string) => {
  let response, preferredLocale;
  if (locale) {
    preferredLocale = locale;
    response = await setupLocale(locale);
  } else {
    preferredLocale = await getFirstPreferredLangCode();
    response = await setupLocale(preferredLocale);
  }

  const { currentLocaleMessages, enLocaleMessages } = response;
  const translate = getLocaleContext(currentLocaleMessages, enLocaleMessages);
  return { translate, locale: preferredLocale };
};

export function getErrorHtmlBase(errorBody: string) {
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

export function getErrorHtml(
  errorKey: string,
  supportLink: string,
  t: TranslateFunction,
) {
  const footer = supportLink
    ? `
      <p class="critical-error__footer">
        <span>${lodashEscape(t('stillGettingMessage'))}</span>
        <a
          href="${lodashEscape(supportLink)}"
          class="critical-error__link"
          target="_blank"
          rel="noopener noreferrer">
            ${lodashEscape(t('sendBugReport'))}
        </a>
      </p>
    `
    : '';

  /**
   * The pattern ${errorKey === 'troubleStarting' ? t('troubleStarting') : ''}
   * is necessary because we we need linter to see the string
   * of the locale keys. If we use the variable directly, the linter will not
   * see the string and will not be able to check if the locale key exists.
   */
  return getErrorHtmlBase(`
      <p>
        ${errorKey === 'troubleStarting' ? t('troubleStarting') : ''}
        ${errorKey === 'somethingIsWrong' ? t('somethingIsWrong') : ''}
      </p>
      <div id="critical-error-button" class="critical-error__link critical-error__link-restart">
        ${lodashEscape(t('restartMetamask'))}
      </div>
      ${footer}
    `);
}
