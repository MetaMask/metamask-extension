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

export async function getErrorHtml(errorKey, supportLink, metamaskState) {
  let response, preferredLocale;
  if (metamaskState?.currentLocale) {
    preferredLocale = metamaskState.currentLocale;
    response = await setupLocale(metamaskState.currentLocale);
  } else {
    preferredLocale = await getFirstPreferredLangCode();
    response = await setupLocale(preferredLocale);
  }

  switchDirectionForPreferredLocale(preferredLocale);

  const { currentLocaleMessages, enLocaleMessages } = response;
  const t = getLocaleContext(currentLocaleMessages, enLocaleMessages);

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
