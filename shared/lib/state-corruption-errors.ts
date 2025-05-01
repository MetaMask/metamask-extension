import log from 'loglevel';
import { escape as lodashEscape } from 'lodash';
import { SUPPORT_LINK, VAULT_RECOVERY_LINK } from './ui-utils';
import {
  ErrorLike,
  TranslateFunction,
  getErrorHtmlBase,
  getLocaleContextFromLocale,
} from './error-utils';
import {
  MISSING_VAULT_ERROR,
  CORRUPTION_BLOCK_CHECKSUM_MISMATCH,
} from '../constants/errors';
import { switchDirectionForLocale } from './switch-direction';

/**
 * State corruption error RPC method name
 */
export const METHOD_DISPLAY_STATE_CORRUPTION_ERROR =
  'displayStateCorruptionError';

/**
 * State corruption error types
 */
export const KNOWN_STATE_CORRUPTION_ERRORS = new Set([
  MISSING_VAULT_ERROR,
  CORRUPTION_BLOCK_CHECKSUM_MISMATCH,
]);

/**
 * Get the HTML for a state corruption error message.
 *
 * @param vaultRecoveryLink - The link for vault recovery
 * @param t - Translation function
 * @param supportLink - Optional support link
 * @returns The HTML string for the error message
 */
export function getStateCorruptionErrorHtml(
  vaultRecoveryLink: string,
  t: TranslateFunction,
  supportLink?: string,
) {
  const header = `<p>
      ${lodashEscape(t('stateCorruptionDetectedErrorMessage'))}
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

/**
 * Display a state corruption error message in the given container.
 *
 * @param container - The HTML element to display the error in
 * @param error - The error object containing error details
 * @param currentLocale - The current locale for translation
 */
export async function displayStateCorruptionError(
  container: HTMLElement,
  error: ErrorLike,
  currentLocale?: string,
) {
  const { translate, locale } = await getLocaleContextFromLocale(currentLocale);
  switchDirectionForLocale(locale);

  const html = getStateCorruptionErrorHtml(
    VAULT_RECOVERY_LINK,
    translate,
    SUPPORT_LINK,
  );
  container.innerHTML = html;

  log.error(error.stack);
  throw error;
}
