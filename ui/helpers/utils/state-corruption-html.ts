import type browser from 'webextension-polyfill';
import log from 'loglevel';
import { escape as lodashEscape } from 'lodash';
import {
  SUPPORT_LINK,
  VAULT_RECOVERY_LINK,
} from '../../../shared/lib/ui-utils';
import { getErrorHtmlBase } from '../../../shared/lib/error-utils';
import type { ErrorLike } from '../../../shared/constants/errors';
import { switchDirectionForPreferredLocale } from '../../../shared/lib/switch-direction';
import getFirstPreferredLangCode from '../../../shared/lib/get-first-preferred-lang-code';
import { METHOD_REPAIR_DATABASE } from '../../../shared/constants/state-corruption';
import { t, updateCurrentLocale } from '../../../shared/lib/translate';

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
  )}" title="${lodashEscape(
    t('stateCorruptionTheseInstructionsLinkTitle') ?? '',
  )}" class="critical-error__link" target="_blank" rel="noopener noreferrer">${lodashEscape(
    t('stateCorruptionTheseInstructions') ?? '',
  )}</a>`;

  let corruptionDetectedMessage: string,
    copyAndRestoreMessage: string,
    restoreOrResetMessage: string;
  if (hasBackup) {
    corruptionDetectedMessage = t('stateCorruptionDetectedWithBackup') ?? '';
    copyAndRestoreMessage =
      t('stateCorruptionCopyAndRestoreBeforeRecovery', instructionsLink) ?? '';
    restoreOrResetMessage = t('stateCorruptionRestoreAccountsFromBackup') ?? '';
  } else {
    corruptionDetectedMessage = t('stateCorruptionDetectedNoBackup') ?? '';
    copyAndRestoreMessage =
      t('stateCorruptionCopyAndRestoreBeforeReset', instructionsLink) ?? '';
    restoreOrResetMessage = t('stateCorruptionResetMetaMaskState') ?? '';
  }

  const header = `
    <h1>${t('stateCorruptionMetamaskDatabaseCannotBeAccessed')}</h1>
  `;
  const body = `
    <p>${lodashEscape(corruptionDetectedMessage)}</p>
    <p>${copyAndRestoreMessage}</p>
    <button disabled id="critical-error-button" class="critical-error__button-restore button btn-primary">
      ${restoreOrResetMessage}
    </button>
  `;

  const footer = supportLink
    ? `<p class="critical-error__footer small">${lodashEscape(
        t('unexpectedBehavior') ?? '',
      )} <a
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
    ${body}
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
  log.error(err);

  function handleRestoreClick(this: HTMLButtonElement) {
    // eslint-disable-next-line no-alert
    const theyAreSure = confirm(t('stateCorruptionAreYouSure') ?? '');
    if (theyAreSure) {
      this.removeEventListener('click', handleRestoreClick);
      this.disabled = true;
      if (hasBackup) {
        this.innerText = t('stateCorruptionRestoringDatabase') ?? '';
      } else {
        this.innerText = t('stateCorruptionResettingDatabase') ?? '';
      }

      port.postMessage({
        data: {
          method: METHOD_REPAIR_DATABASE,
        },
      });
    }
  }

  const html = await getStateCorruptionErrorHtml(
    VAULT_RECOVERY_LINK,
    hasBackup,
    currentLocale,
    SUPPORT_LINK,
  );
  container.innerHTML = html;

  const button = container.querySelector<HTMLButtonElement>(
    '#critical-error-button',
  );
  if (button) {
    button.addEventListener('click', handleRestoreClick);
    setTimeout(() => {
      button.disabled = false;
      // wait a while before enabling the button to try to prevent accidental
      // or rush clicks.
    }, 5000);
  }
}
