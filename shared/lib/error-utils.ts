import { memoize, escape as lodashEscape } from 'lodash';
import type { ErrorLike } from '../constants/errors';
import type { I18NMessageDict } from './i18n';
import {
  fetchLocale,
  getMessage,
  loadRelativeTimeFormatLocaleData,
} from './i18n';
import getFirstPreferredLangCode from './get-first-preferred-lang-code';
import { switchDirectionForPreferredLocale } from './switch-direction';
import { REINSTALL_METAMASK_RECOVERY_LINK } from './ui-utils';

const defaultLocale = 'en';

/**
 * The context returned by {@link maybeGetLocaleContext} and accepted by
 * {@link getErrorHtml}.
 */
export type LocaleContext = {
  preferredLocale: string;
  t: (key: string) => string | undefined;
  /** Current locale messages; used with {@link getMessage} for substituted strings. */
  localeMessages: I18NMessageDict;
  /** English fallback messages; used with {@link getMessage} for substituted strings. */
  enLocaleMessages: I18NMessageDict;
};

const _setupLocale = async (
  currentLocale: string | undefined,
): Promise<{
  currentLocaleMessages: I18NMessageDict;
  enLocaleMessages: I18NMessageDict;
}> => {
  const enRelativeTime = loadRelativeTimeFormatLocaleData(defaultLocale);
  const enLocale = fetchLocale(defaultLocale);

  const promises: Promise<I18NMessageDict | void>[] = [
    enRelativeTime,
    enLocale,
  ];
  if (currentLocale === defaultLocale) {
    // enLocaleMessages and currentLocaleMessages are the same; reuse enLocale
    promises.push(enLocale); // currentLocaleMessages
  } else if (currentLocale) {
    // currentLocale does not match enLocaleMessages
    promises.push(fetchLocale(currentLocale)); // currentLocaleMessages
    promises.push(loadRelativeTimeFormatLocaleData(currentLocale));
  } else {
    // currentLocale is not set
    promises.push(Promise.resolve({}) as Promise<I18NMessageDict>); // currentLocaleMessages
  }

  const [, enLocaleMessages, currentLocaleMessages] =
    await Promise.all(promises);
  return {
    currentLocaleMessages: currentLocaleMessages as I18NMessageDict,
    enLocaleMessages: enLocaleMessages as I18NMessageDict,
  };
};

export const setupLocale = memoize(_setupLocale);

export const getLocaleContext = (
  currentLocaleMessages: I18NMessageDict,
  enLocaleMessages: I18NMessageDict,
): ((key: string) => string | undefined) => {
  return (key: string) => {
    let message = currentLocaleMessages[key]?.message;
    if (!message && enLocaleMessages[key]) {
      message = enLocaleMessages[key].message;
    }
    return message;
  };
};

export function criticalErrorWarningIconMarkup(): string {
  return `<div class="critical-error__icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
        </div>`;
}

export function getErrorHtmlBase(errorBody: string): string {
  return `
    <div class="critical-error__container">
      <div class="critical-error">
        <div class="critical-error__inner">
          ${errorBody}
        </div>
      </div>
    </div>
  `;
}

/**
 * Tries really hard to get the locale context function from the given locale.
 *
 * It falls back to the default browser locale, or 'en' if that fails.
 * If we can't get the locale context from some reason (the `messages.json`
 * file for the locale), we return a function that just returns the value passed
 * to it, which isn't ideal... but at least it is something (the alternative
 * is to hard-code the English locale in this file, which would be very hard
 * to maintain).
 *
 * Does not throw.
 *
 * @param currentLocale - The current locale
 * @returns A promise that resolves to an object containing the preferred locale, translation function, and message dicts for getMessage when needed.
 */
export async function maybeGetLocaleContext(
  currentLocale?: string,
): Promise<LocaleContext> {
  let preferredLocale: string | undefined;
  try {
    preferredLocale = currentLocale ?? (await getFirstPreferredLangCode());
    const response = await setupLocale(preferredLocale);
    const { currentLocaleMessages, enLocaleMessages } = response;
    const t = getLocaleContext(currentLocaleMessages, enLocaleMessages);
    return {
      preferredLocale,
      t,
      localeMessages: currentLocaleMessages,
      enLocaleMessages,
    };
  } catch (error) {
    console.error('Error setting up locale:', error);
    return {
      preferredLocale: preferredLocale ?? 'en',
      t: (value) => value,
      localeMessages: {},
      enLocaleMessages: {},
    };
  }
}

/**
 * Get the HTML for a critical error message.
 *
 * @param errorKey - The key for the error message.
 * @param error - The error object to log.
 * @param localeContext - The MetaMask state containing the current locale and translation function.
 * @param supportLink - The support link to include in the footer.
 * @param hasBackup - Whether a vault backup exists in IndexedDB.
 * @returns The HTML string for the critical error message.
 */
export function getErrorHtml(
  errorKey: string,
  error: ErrorLike | undefined,
  localeContext: LocaleContext,
  supportLink?: string,
  hasBackup = false,
): string {
  switchDirectionForPreferredLocale(localeContext.preferredLocale);
  const { t, preferredLocale, localeMessages, enLocaleMessages } =
    localeContext;

  const legalText = `
    <span>${lodashEscape(t('errorLegalTextSummary'))}</span>
    <p>• ${lodashEscape(t('errorLegalTextFirstInfo'))}</p>
    <p>• ${lodashEscape(t('errorLegalTextSecondInfo'))}</p>
    <span>${lodashEscape(t('errorLegalTextNoPersonalInfo'))}</span>
`;

  const attemptRecoveryButton = hasBackup
    ? `<button
          id="critical-error-restore-link"
          type="button"
          class="critical-error__button-secondary button">
          ${lodashEscape(t('criticalErrorAttemptRecovery'))}
        </button>`
    : '';

  const externalIconSvg = `<svg
    class="critical-error__external-icon"
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="currentColor"
    aria-hidden="true">
    <path d="M14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7zM19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.11.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7z"/>
  </svg>`;

  const reinstallButton = `<a
        id="critical-error-reinstall-link"
        href="${lodashEscape(REINSTALL_METAMASK_RECOVERY_LINK)}"
        target="_blank"
        rel="noopener noreferrer"
        class="critical-error__button-secondary button">
        ${lodashEscape(t('criticalErrorReinstallMetamask'))}
        ${externalIconSvg}
      </a>`;

  const dividerSection = `<div class="critical-error__divider">
        <span>${lodashEscape(t('criticalErrorStillHavingIssues'))}</span>
      </div>`;

  const secondaryActions = `
      ${dividerSection}
      ${attemptRecoveryButton}
      ${reinstallButton}
    `;

  let footer = '';
  if (supportLink) {
    const contactSupportLabel = (
      t('errorPageContactSupport') ?? ''
    ).toLowerCase();
    const supportLinkAnchor = `<a
        href="${lodashEscape(supportLink)}"
        class="critical-error__link"
        target="_blank"
        rel="noopener noreferrer">${lodashEscape(contactSupportLabel)}</a>`;

    let footerContent: string | null | undefined;
    try {
      footerContent =
        (getMessage(
          preferredLocale,
          localeMessages,
          'criticalErrorFooterContactSupport',
          [supportLinkAnchor],
        ) as string | null) ||
        (getMessage(
          'en',
          enLocaleMessages,
          'criticalErrorFooterContactSupport',
          [supportLinkAnchor],
        ) as string | null);
    } catch {
      footerContent = null;
    }

    if (!footerContent) {
      footerContent = `If none of the above works, ${supportLinkAnchor}`;
    }

    footer = `
      <p class="critical-error__footer">
        ${footerContent}
      </p>
    `;
  }

  const detailsContent = error?.message
    ? `<p class="critical-error__details"><code>${lodashEscape(error?.message)}</code></p>`
    : '';

  /**
   * The pattern ${errorKey === 'somethingIsWrong' ? t('somethingIsWrong') : ''}
   * is necessary because we need linter to see the string
   * of the locale keys. If we use the variable directly, the linter will not
   * see the string and will not be able to check if the locale key exists.
   */
  return getErrorHtmlBase(`
      <div class="critical-error__header">
        ${criticalErrorWarningIconMarkup()}
        <h1 class="critical-error__title">${lodashEscape(t('troubleStartingTitle'))}</h1>
      </div>
      <div class="critical-error__body">
        <p class="critical-error__intro">
          ${errorKey === 'troubleStarting' ? t('troubleStartingMessage') : ''}
          ${errorKey === 'somethingIsWrong' ? t('somethingIsWrong') : ''}
        </p>
        <div class="critical-error__error-section">
          ${detailsContent}
          <label class="critical-error__report">
            <input
              id="critical-error-checkbox"
              type="checkbox"
              checked
              class="critical-error__report-checkbox"
            />
            <span class="critical-error__report-text">
              ${lodashEscape(t('reportThisError'))}
            </span>
            <button
              id="critical-error-tip-anchor"
              popovertarget="critical-error-legal-text"
              type="button"
              class="critical-error__info"
            >
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="critical-error__info-icon">
                <path d="m11 17h2v-6h-2zm1-8c.2833 0 .5208-.09583.7125-.2875s.2875-.42917.2875-.7125-.0958-.52083-.2875-.7125-.4292-.2875-.7125-.2875-.5208.09583-.7125.2875-.2875.42917-.2875.7125.0958.52083.2875.7125.4292.2875.7125.2875zm0 13c-1.3833 0-2.68333-.2625-3.9-.7875s-2.275-1.2375-3.175-2.1375-1.6125-1.9583-2.1375-3.175-.7875-2.5167-.7875-3.9.2625-2.68333.7875-3.9 1.2375-2.275 2.1375-3.175 1.95833-1.6125 3.175-2.1375 2.5167-.7875 3.9-.7875 2.6833.2625 3.9.7875 2.275 1.2375 3.175 2.1375 1.6125 1.95833 2.1375 3.175.7875 2.5167.7875 3.9-.2625 2.6833-.7875 3.9-1.2375 2.275-2.1375 3.175-1.9583 1.6125-3.175 2.1375-2.5167.7875-3.9.7875zm0-2c2.2333 0 4.125-.775 5.675-2.325s2.325-3.4417 2.325-5.675c0-2.23333-.775-4.125-2.325-5.675s-3.4417-2.325-5.675-2.325c-2.23333 0-4.125.775-5.675 2.325s-2.325 3.44167-2.325 5.675c0 2.2333.775 4.125 2.325 5.675s3.44167 2.325 5.675 2.325z"/>
              </svg>
            </button>
          </label>
        </div>
      </div>
      <div
        popover
        anchor="critical-error-tip-anchor"
        id="critical-error-legal-text"
        class="critical-error__legal-text"
      >
        ${legalText}
      </div>
      <div class="critical-error__footer-actions">
        <button
          id="critical-error-button"
          class="critical-error__button-restore button btn-primary"
          title="Report this error and restart MetaMask">
          ${lodashEscape(t('restartMetamask'))}
        </button>
        ${secondaryActions}
        ${footer}
      </div>
    `);
}
