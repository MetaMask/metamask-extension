import log from 'loglevel';
import { memoize } from 'lodash';
import getFirstPreferredLangCode from '../lib/get-first-preferred-lang-code';
import getFetchWithTimeout from '../../../shared/modules/fetch-with-timeout';
import switchDirection from '../../../shared/lib/switch-direction';

const fetchWithTimeout = getFetchWithTimeout();

const relativeTimeFormatLocaleData = new Set();

export async function loadRelativeTimeFormatLocaleData(localeCode) {
  const languageTag = localeCode.split('_')[0];
  if (
    Intl.RelativeTimeFormat &&
    typeof Intl.RelativeTimeFormat.__addLocaleData === 'function' &&
    !relativeTimeFormatLocaleData.has(languageTag)
  ) {
    const localeData = await fetchRelativeTimeFormatData(languageTag);
    Intl.RelativeTimeFormat.__addLocaleData(localeData);
  }
}

async function fetchRelativeTimeFormatData(languageTag) {
  const response = await fetchWithTimeout(
    `./intl/${languageTag}/relative-time-format-data.json`,
  );
  return await response.json();
}

export async function fetchLocale(localeCode) {
  try {
    const response = await fetchWithTimeout(
      `./_locales/${localeCode}/messages.json`,
    );
    return await response.json();
  } catch (error) {
    log.error(`failed to fetch ${localeCode} locale because of ${error}`);
    return {};
  }
}

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
