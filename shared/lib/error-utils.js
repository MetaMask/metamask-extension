///: BEGIN:ONLY_INCLUDE_IN(desktop)
import browser from 'webextension-polyfill';
///: END:ONLY_INCLUDE_IN
import { memoize } from 'lodash';
import getFirstPreferredLangCode from '../../app/scripts/lib/get-first-preferred-lang-code';
import {
  fetchLocale,
  loadRelativeTimeFormatLocaleData,
} from '../../ui/helpers/utils/i18n-helper';
///: BEGIN:ONLY_INCLUDE_IN(desktop)
import { renderDesktopError } from '../../ui/pages/desktop-error/render-desktop-error';
import { EXTENSION_ERROR_PAGE_TYPES } from '../constants/desktop';
import { openCustomProtocol } from './deep-linking';
///: END:ONLY_INCLUDE_IN
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

export async function getErrorHtml(
  errorKey,
  supportLink,
  metamaskState,
  ///: BEGIN:ONLY_INCLUDE_IN(desktop)
  err,
  ///: END:ONLY_INCLUDE_IN
) {
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

  ///: BEGIN:ONLY_INCLUDE_IN(desktop)
  const isDesktopEnabled = metamaskState?.desktopEnabled === true;

  if (isDesktopEnabled) {
    let errorType = EXTENSION_ERROR_PAGE_TYPES.CRITICAL_ERROR;

    if (err?.message.includes('No response from RPC')) {
      errorType = EXTENSION_ERROR_PAGE_TYPES.CONNECTION_LOST;
    }

    return renderDesktopError({
      type: errorType,
      t,
      isHtmlError: true,
    });
  }
  ///: END:ONLY_INCLUDE_IN
  /**
   * The pattern ${errorKey === 'troubleStarting' ? t('troubleStarting') : ''}
   * is neccessary because we we need linter to see the string
   * of the locale keys. If we use the variable directly, the linter will not
   * see the string and will not be able to check if the locale key exists.
   */
  return `
    <div class="critical-error">
      <div class="critical-error__icon">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M13.2325 9.78823L9.14559 1.96347C8.59641 0.910661 7.83651 0.333313 6.99998 0.333313C6.16345 0.333313 5.40354 0.910661 4.85437 1.96347L0.767492 9.78823C0.250247 10.7867 0.192775 11.7444 0.607848 12.4984C1.02292 13.2523 1.8403 13.6666 2.9131 13.6666H11.0869C12.1597 13.6666 12.977 13.2523 13.3921 12.4984C13.8072 11.7444 13.7497 10.7799 13.2325 9.78823ZM6.52105 5.08794C6.52105 4.80945 6.73816 4.57852 6.99998 4.57852C7.26179 4.57852 7.47891 4.80945 7.47891 5.08794V8.4841C7.47891 8.76259 7.26179 8.99353 6.99998 8.99353C6.73816 8.99353 6.52105 8.76259 6.52105 8.4841V5.08794ZM7.45337 11.0041C7.42144 11.0312 7.38951 11.0584 7.35758 11.0856C7.31927 11.1127 7.28095 11.1331 7.24264 11.1467C7.20432 11.1671 7.16601 11.1807 7.12131 11.1874C7.08299 11.1942 7.03829 11.201 6.99998 11.201C6.96166 11.201 6.91696 11.1942 6.87226 11.1874C6.83395 11.1807 6.79563 11.1671 6.75732 11.1467C6.71901 11.1331 6.68069 11.1127 6.64238 11.0856C6.61045 11.0584 6.57852 11.0312 6.54659 11.0041C6.43165 10.875 6.3614 10.6984 6.3614 10.5218C6.3614 10.3452 6.43165 10.1686 6.54659 10.0395C6.57852 10.0124 6.61045 9.98521 6.64238 9.95804C6.68069 9.93087 6.71901 9.91049 6.75732 9.8969C6.79563 9.87653 6.83395 9.86294 6.87226 9.85615C6.95528 9.83577 7.04468 9.83577 7.12131 9.85615C7.16601 9.86294 7.20432 9.87653 7.24264 9.8969C7.28095 9.91049 7.31927 9.93087 7.35758 9.95804C7.38951 9.98521 7.42144 10.0124 7.45337 10.0395C7.56831 10.1686 7.63855 10.3452 7.63855 10.5218C7.63855 10.6984 7.56831 10.875 7.45337 11.0041Z" fill="#F66A0A"/>
        </svg>
      </div>
      <div class="critical-error__dscription">
        <div class="critical-error__alert">
          <p class="critical-error__alert__message">
            ${errorKey === 'troubleStarting' ? t('troubleStarting') : ''}
            ${errorKey === 'somethingIsWrong' ? t('somethingIsWrong') : ''}
          </p>
          <span id='critical-error-button' class="critical-error__alert__action-link">
            ${t('restartMetamask')}
          </span>
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
    </div>
    `;
}

///: BEGIN:ONLY_INCLUDE_IN(desktop)
export const MMD_DOWNLOAD_LINK =
  'https://github.com/MetaMask/metamask-desktop/releases';

function disableDesktop(backgroundConnection) {
  backgroundConnection.disableDesktopError();
}

export function downloadDesktopApp() {
  global.platform.openTab({
    url: MMD_DOWNLOAD_LINK,
  });
}

export function downloadExtension() {
  global.platform.openTab({ url: 'https://metamask.io/' });
}

export function restartExtension() {
  browser.runtime.reload();
}

export function openOrDownloadMMD() {
  openCustomProtocol('metamask-desktop://pair').catch(() => {
    window.open(MMD_DOWNLOAD_LINK, '_blank').focus();
  });
}

export function registerDesktopErrorActions(backgroundConnection) {
  const disableDesktopButton = document.getElementById(
    'desktop-error-button-disable-mmd',
  );
  const restartMMButton = document.getElementById(
    'desktop-error-button-restart-mm',
  );
  const downloadMMDButton = document.getElementById(
    'desktop-error-button-download-mmd',
  );

  const openOrDownloadMMDButton = document.getElementById(
    'desktop-error-button-open-or-download-mmd',
  );

  disableDesktopButton?.addEventListener('click', (_) => {
    disableDesktop(backgroundConnection);
  });

  restartMMButton?.addEventListener('click', (_) => {
    restartExtension();
  });

  downloadMMDButton?.addEventListener('click', (_) => {
    downloadDesktopApp();
  });

  openOrDownloadMMDButton?.addEventListener('click', (_) => {
    openOrDownloadMMD();
  });
}
///: END:ONLY_INCLUDE_IN
