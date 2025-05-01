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
import {
  MISSING_VAULT_ERROR,
  CORRUPTION_BLOCK_CHECKSUM_MISMATCH,
} from '../../../shared/constants/errors';
import { switchDirectionForPreferredLocale } from '../../../shared/lib/switch-direction';
import getFirstPreferredLangCode from './get-first-preferred-lang-code';

export type ErrorLike = {
  message: string;
  name: string;
  stack?: string;
};

export const METHOD_DISPLAY_STATE_CORRUPTION_ERROR =
  'displayStateCorruptionError';

export const KNOWN_STATE_CORRUPTION_ERRORS = new Set([
  MISSING_VAULT_ERROR,
  CORRUPTION_BLOCK_CHECKSUM_MISMATCH,
]);

export async function getStateCorruptionErrorHtml(
  vaultRecoveryLink: string,
  currentLocale?: string,
  supportLink?: string,
) {
  let response, preferredLocale: string;
  if (currentLocale) {
    preferredLocale = currentLocale;
    response = await setupLocale(currentLocale);
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
  err: ErrorLike,
  currentLocale?: string,
) {
  const html = await getStateCorruptionErrorHtml(
    VAULT_RECOVERY_LINK,
    currentLocale,
    SUPPORT_LINK,
  );
  container.innerHTML = html;
  log.error(err);
}
