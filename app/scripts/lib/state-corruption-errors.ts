import browser from 'webextension-polyfill';
import log from 'loglevel';
import { escape as lodashEscape } from 'lodash';
import {
  SUPPORT_LINK,
  VAULT_RECOVERY_LINK,
} from '../../../shared/lib/ui-utils';
import { getErrorHtmlBase } from '../../../shared/lib/error-utils';
import {
  MISSING_VAULT_ERROR,
  CORRUPTION_BLOCK_CHECKSUM_MISMATCH,
} from '../../../shared/constants/errors';
import { switchDirectionForPreferredLocale } from '../../../shared/lib/switch-direction';
import getFirstPreferredLangCode from './get-first-preferred-lang-code';
import { updateCurrentLocale, t } from '../translate';

export type ErrorLike = {
  message: string;
  name: string;
  stack?: string;
};

export const METHOD_RESTORE_DATABASE_FROM_BACKUP = 'restoreDatabaseFromBackup';

export const METHOD_DISPLAY_STATE_CORRUPTION_ERROR =
  'displayStateCorruptionError';

export const KNOWN_STATE_CORRUPTION_ERRORS = new Set([
  MISSING_VAULT_ERROR,
  CORRUPTION_BLOCK_CHECKSUM_MISMATCH,
]);

export async function getStateCorruptionErrorHtml(
  vaultRecoveryLink: string,
  hasBackup: boolean,
  currentLocale?: string,
  supportLink?: string,
) {
  let preferredLocale: string;
  if (currentLocale) {
    preferredLocale = currentLocale;
    await updateCurrentLocale(currentLocale);
  } else {
    preferredLocale = await getFirstPreferredLangCode();
    await updateCurrentLocale(preferredLocale);
  }

  switchDirectionForPreferredLocale(preferredLocale);

  const instructionsLink = `<a href="${lodashEscape(
    vaultRecoveryLink,
  )}" class="critical-error__link" target="_blank">${lodashEscape(
    t('stateCorruptionTheseInstructions') ?? '',
  )}</a>`;

  let corruptionDetectedMessage: string,
    copyAndRestoreMessage: string,
    restoreOrResetMessage: string;
  if (hasBackup) {
    corruptionDetectedMessage = t('stateCorruptionDetectedWithBackup') ?? '';
    copyAndRestoreMessage =
      t('stateCorruptionCopyAndRestoreBeforeRecovery', instructionsLink) ?? '';
    restoreOrResetMessage = t('restoreAccountsFromBackup') ?? '';
  } else {
    corruptionDetectedMessage = t('stateCorruptionDetectedNoBackup') ?? '';
    copyAndRestoreMessage =
      t('stateCorruptionCopyAndRestoreBeforeReset', instructionsLink) ?? '';
    restoreOrResetMessage = t('resetMetaMaskState') ?? '';
  }

  const header = `
    <h1>${t('stateCorruptionMetamaskDatabaseCannotBeAccessed')}</h1>
    <p>${lodashEscape(corruptionDetectedMessage)}</p>
    <p>${lodashEscape(copyAndRestoreMessage)}</p>
    <div id="critical-error-button" class="critical-error__link-restore button btn-danger" data-confirm="${lodashEscape(
      'Are you sure? This action is irreversible!',
    )}">
      ${restoreOrResetMessage}
    </div>
  `;

  const footer = supportLink
    ? `<p class="critical-error__footer">
      <span>${lodashEscape(t('unexpectedBehavior') ?? '')}</span>
      <a
        href="${lodashEscape(supportLink)}"
        class="critical-error__link"
        target="_blank"
        rel="noopener noreferrer">
          ${lodashEscape(t('sendBugReport') ?? '')}
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
  err: ErrorLike,
  hasBackup: boolean,
  currentLocale?: string,
) {
  log.error(err.stack);

  function handleRestoreClick(this: HTMLElement) {
    this.style.opacity = '0.5';
    this.style.pointerEvents = 'none';
    const confirmMessage = this.dataset.confirm;

    if (confirmMessage) {
      // TODO: not the best UI: we should talk about this
      // eslint-disable-next-line no-alert
      const confirmed = window.prompt(
        `${confirmMessage}Type \`restore\` to restore.`,
      );
      if (confirmed !== 'restore') {
        this.style.opacity = '1';
        this.style.pointerEvents = 'auto';
        return;
      }
    }
    this.removeEventListener('click', handleRestoreClick);
    port.postMessage({
      data: {
        method: METHOD_RESTORE_DATABASE_FROM_BACKUP,
      },
    });
  }

  const html = await getStateCorruptionErrorHtml(
    VAULT_RECOVERY_LINK,
    hasBackup,
    currentLocale,
    SUPPORT_LINK,
  );
  container.innerHTML = html;

  const button = container.querySelector('#critical-error-button');
  button?.addEventListener('click', handleRestoreClick);
}
