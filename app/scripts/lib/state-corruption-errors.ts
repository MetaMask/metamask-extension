import browser from 'webextension-polyfill';
import log from 'loglevel';
import { escape as lodashEscape } from 'lodash';
import {
  SUPPORT_LINK,
  VAULT_RECOVERY_LINK,
} from '../../../shared/lib/ui-utils';
import {
  getErrorHtmlBase,
  getLocaleContext,
  setupLocale,
} from '../../../shared/lib/error-utils';
import { MetaMaskState } from '../background';
import {
  MISSING_VAULT_ERROR,
  CORRUPTION_BLOCK_CHECKSUM_MISMATCH,
} from '../../../shared/constants/errors';
import { switchDirectionForPreferredLocale } from '../../../shared/lib/switch-direction';
import getFirstPreferredLangCode from './get-first-preferred-lang-code';

// the @metamask/object-multiplex channel name
export const CHANNEL_RESTORE_VAULT_FROM_BACKUP = 'RESTORE_VAULT_FROM_BACKUP';

export const STATE_CORRUPTION_ERRORS = new Set([
  MISSING_VAULT_ERROR,
  CORRUPTION_BLOCK_CHECKSUM_MISMATCH,
]);

export async function getStateCorruptionErrorHtml(
  vaultRecoveryLink: string,
  metamaskState: MetaMaskState,
  supportLink?: string,
) {
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

  const header = `<p>
      ${t('stateCorruptionDetectedErrorMessage')}
    </p>
    <p>
      <a
        href="${lodashEscape(vaultRecoveryLink)}"
        class="critical-error__link"
        target="_blank"
        rel="noopener noreferrer">
          ${lodashEscape(
            t('stateCorruptionDetectedErrorMessageVaultRecoveryLink'),
          )}
      </a>
    </p>`;

  const footer = supportLink
    ? `<p class="critical-error__footer">
      <span>${lodashEscape(t('unexpectedBehavior'))}</span>
      <a
        href="${lodashEscape(supportLink)}"
        class="critical-error__link"
        target="_blank"
        rel="noopener noreferrer">
          ${lodashEscape(t('sendBugReport'))}
      </a>
    </p>`
    : '';

  return getErrorHtmlBase(`
    ${header}
    ${footer}
  `);
}

export async function displayStateCorruptionError(
  container: HTMLElement,
  port: browser.Runtime.Port,
  err: Error,
  metamaskState: MetaMaskState,
) {
  const html = await getStateCorruptionErrorHtml(
    VAULT_RECOVERY_LINK,
    metamaskState,
    SUPPORT_LINK,
  );
  container.innerHTML = html;

  const button = document.getElementById('critical-error-button');

  button?.addEventListener('click', (_) => {
    port.postMessage({
      target: 'Background',
      data: {
        name: CHANNEL_RESTORE_VAULT_FROM_BACKUP,
      },
    });
  });
  log.error(err.stack);
  throw err;
}
