import { memoize } from 'lodash';
import getFirstPreferredLangCode from '../../app/scripts/lib/get-first-preferred-lang-code';
import {
  fetchLocale,
  loadRelativeTimeFormatLocaleData,
} from '../../ui/helpers/utils/i18n-helper';
import switchDirection from './switch-direction';

const _setupLocale = async (currentLocale) => {
  const currentLocaleMessages = currentLocale
    ? await fetchLocale(currentLocale)
    : {};
  const enLocaleMessages = await fetchLocale('en');

  await loadRelativeTimeFormatLocaleData('en');
  if (currentLocale) {
    await loadRelativeTimeFormatLocaleData(currentLocale);
  }

  return { currentLocaleMessages, enLocaleMessages };
};

export const setupLocale = memoize(_setupLocale);

const getLocaleContext = (currentLocaleMessages, enLocaleMessages) => {
  return (key) => {
    let message = currentLocaleMessages[key]?.message;
    if (!message && enLocaleMessages[key]) {
      message = enLocaleMessages[key].message;
    }
    return message;
  };
};

export async function getErrorHtml(supportLink, metamaskState) {
  let response, preferredLocale;
  if (metamaskState?.currentLocale) {
    preferredLocale = metamaskState.currentLocale;
    response = await setupLocale(metamaskState.currentLocale);
  } else {
    preferredLocale = await getFirstPreferredLangCode();
    response = await setupLocale(preferredLocale);
  }

  const textDirection = ['ar', 'dv', 'fa', 'he', 'ku'].includes(preferredLocale)
    ? 'rtl'
    : 'auto';

  switchDirection(textDirection);
  const { currentLocaleMessages, enLocaleMessages } = response;
  const t = getLocaleContext(currentLocaleMessages, enLocaleMessages);

  return `
    <div class="critical-error">
      <div class="critical-error__alert">
        <p class="critical-error__alert__message">
          ${t('troubleStarting')}
        </p>
        <button id='critical-error-button' class="critical-error__alert__button">
          ${t('restartMetamask')}
        </button>
      </div>
      <p class="critical-error__paragraph">
        ${t('stillGettingMessage')}
        <a
          href=${supportLink}
          class="critical-error__paragraph__link"
          target="_blank"
          rel="noopener noreferrer">
            ${t('sendBugReport')}
          </a>
      </p>
    </div>
    `;
}
