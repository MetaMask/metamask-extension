///: BEGIN:ONLY_INCLUDE_IF(desktop)
import browser from 'webextension-polyfill';
///: END:ONLY_INCLUDE_IF
import { memoize } from 'lodash';
import getFirstPreferredLangCode from '../../app/scripts/lib/get-first-preferred-lang-code';
import { fetchLocale, loadRelativeTimeFormatLocaleData } from '../modules/i18n';
///: BEGIN:ONLY_INCLUDE_IF(desktop)
import { renderDesktopError } from '../../ui/pages/desktop-error/render-desktop-error';
import { EXTENSION_ERROR_PAGE_TYPES } from '../constants/desktop';
import { openCustomProtocol } from './deep-linking';
///: END:ONLY_INCLUDE_IF
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
  ///: BEGIN:ONLY_INCLUDE_IF(desktop)
  err,
  ///: END:ONLY_INCLUDE_IF
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

  ///: BEGIN:ONLY_INCLUDE_IF(desktop)
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
  ///: END:ONLY_INCLUDE_IF
  /**
   * The pattern ${errorKey === 'troubleStarting' ? t('troubleStarting') : ''}
   * is neccessary because we we need linter to see the string
   * of the locale keys. If we use the variable directly, the linter will not
   * see the string and will not be able to check if the locale key exists.
   */
  return `
    <div class="critical-error__container">
      <div class="critical-error">
        <div class="critical-error__icon">
          <svg width="24" height="24" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
            <path d="m443 342l-126-241c-16-32-40-50-65-50-26 0-50 18-66 50l-126 241c-16 30-18 60-5 83 13 23 38 36 71 36l251 0c33 0 58-13 71-36 13-23 11-53-5-83z m-206-145c0-8 6-15 15-15 8 0 14 7 14 15l0 105c0 8-6 15-14 15-9 0-15-7-15-15z m28 182c-1 1-2 2-3 3-1 0-2 1-3 1-1 1-2 1-4 2-1 0-2 0-3 0-2 0-3 0-4 0-2-1-3-1-4-2-1 0-2-1-3-1-1-1-2-2-3-3-4-4-6-9-6-15 0-5 2-11 6-15 1 0 2-1 3-2 1-1 2-2 3-2 1-1 2-1 4-1 2-1 5-1 7 0 2 0 3 0 4 1 1 0 2 1 3 2 1 1 2 2 3 2 4 4 6 10 6 15 0 6-2 11-6 15z"/>
          </svg>
        </div>
        <div>
          <p>
            ${errorKey === 'troubleStarting' ? t('troubleStarting') : ''}
            ${errorKey === 'somethingIsWrong' ? t('somethingIsWrong') : ''}
          </p>
          <div id="critical-error-button" class="critical-error__link critical-error__link-restart">
            ${t('restartMetamask')}
          </div>
          <p class="critical-error__footer">
            <span>${t('stillGettingMessage')}</span>
            <a
              href=${supportLink}
              class="critical-error__link"
              target="_blank"
              rel="noopener noreferrer">
                ${t('sendBugReport')}
              </a>
          </p>
        </div>
      </div>
    </div>
    `;
}

///: BEGIN:ONLY_INCLUDE_IF(desktop)
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
///: END:ONLY_INCLUDE_IF
