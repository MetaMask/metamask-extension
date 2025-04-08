import { memoize, escape as lodashEscape } from 'lodash';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import getFirstPreferredLangCode from '../../app/scripts/lib/get-first-preferred-lang-code';
import { fetchLocale, loadRelativeTimeFormatLocaleData } from '../modules/i18n';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import dangerIcon from '../../app/images/icons/danger.svg';
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

  const [, enLocaleMessages, currentLocaleMessages] = await Promise.all(
    promises,
  );
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
          <svg width="24" height="24">
            <use href="/${lodashEscape(dangerIcon)}#danger-icon"></use>
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
