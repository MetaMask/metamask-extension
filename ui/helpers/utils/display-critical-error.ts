import browser from 'webextension-polyfill';
import log from 'loglevel';
import { ErrorLike } from '../../../shared/constants/errors';
import {
  getErrorHtml,
  maybeGetLocaleContext,
} from '../../../shared/lib/error-utils';
import { SUPPORT_LINK } from '../../../shared/lib/ui-utils';

export enum CriticalErrorTranslationKey {
  TroubleStarting = 'troubleStarting',
  SomethingIsWrong = 'somethingIsWrong',
}

/**
 * Displays a critical error message in the given container.
 *
 * This function always throws the error after displaying the message.
 *
 * @param container - The HTML element to display the error in.
 * @param errorKey - The key for the error message to display.
 * @param error - The error object to log.
 * @param currentLocale - Optional locale context for translations.
 * @throws {ErrorLike} Throws the error after displaying the message.
 * @returns A promise that resolves to never, as it always throws an error.
 */
export async function displayCriticalError(
  container: HTMLElement,
  errorKey: CriticalErrorTranslationKey,
  error: ErrorLike,
  currentLocale?: string,
): Promise<never> {
  const localeContext = await maybeGetLocaleContext(currentLocale);
  container.innerHTML = getErrorHtml(
    errorKey,
    error,
    localeContext,
    SUPPORT_LINK,
  );

  const button = document.getElementById('critical-error-button');

  button?.addEventListener('click', (_) => {
    browser.runtime.reload();
  });

  log.error(error.stack);
  throw error;
}
