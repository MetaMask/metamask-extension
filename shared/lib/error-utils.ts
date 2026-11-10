import { memoize, escape as lodashEscape } from 'lodash';
import { MISSING_VAULT_ERROR, type ErrorLike } from '../constants/errors';
import {
  CriticalErrorRepairAction,
  isStateCorruptionErrorType,
  type CriticalErrorType,
} from '../constants/critical-error';
import type { I18NMessageDict } from './i18n';
import {
  fetchLocale,
  getMessage,
  loadRelativeTimeFormatLocaleData,
} from './i18n';
import getFirstPreferredLangCode from './get-first-preferred-lang-code';
import { switchDirectionForPreferredLocale } from './switch-direction';
import {
  REINSTALL_METAMASK_RECOVERY_LINK,
  VAULT_RECOVERY_LINK,
} from './ui-utils';

const defaultLocale = 'en';

// Dark mode keeps the original brand greys. `light:` reapplies semantic tokens
// only when PreferencesController resolves to a light theme.
const criticalErrorTextClass =
  'text-[var(--brand-colors-grey-grey000)] light:text-default';
const criticalErrorMutedClass =
  'text-[var(--brand-colors-grey-grey400)] light:text-alternative';
const criticalErrorSurfaceClass =
  'bg-[var(--brand-colors-grey-grey800)] light:bg-default';
const criticalErrorBorderClass =
  'border-[color-mix(in_srgb,var(--brand-colors-grey-grey400)_20%,transparent)] light:border-muted';
const criticalErrorCopyClass = `m-0 self-stretch text-left text-s-body-sm font-normal leading-s-body-sm ${criticalErrorMutedClass}`;
const criticalErrorLinkClass =
  'critical-error__link cursor-pointer text-[var(--brand-colors-grey-grey000)] underline visited:text-[var(--brand-colors-grey-grey000)] hover:text-[var(--brand-colors-grey-grey000)] hover:opacity-[0.88] active:text-[var(--brand-colors-grey-grey000)] light:text-default light:visited:text-default light:hover:text-default light:active:text-default';
const criticalErrorRestoreButtonClass =
  'box-border !m-0 !h-12 !w-full !cursor-pointer !rounded-full !border-0 !bg-[var(--brand-colors-grey-grey000)] !px-4 !py-0 !text-s-button-label-md !font-medium !leading-s-button-label-md !text-[var(--brand-colors-grey-grey900)] !transition-opacity !duration-200 hover:!opacity-[0.92] active:!scale-100 light:!bg-text-default light:!text-icon-inverse';
const criticalErrorSecondaryButtonClass =
  'box-border inline-flex !m-0 !h-12 !w-full !cursor-pointer items-center justify-center gap-2 !rounded-full !border-0 !bg-muted !px-4 !py-0 !text-s-button-label-md !font-medium !leading-s-button-label-md !no-underline !text-[var(--brand-colors-grey-grey000)] !transition-colors !duration-200 hover:!bg-muted-hover hover:!text-[var(--brand-colors-grey-grey000)] active:!scale-100 light:!text-default light:hover:!text-default';
const criticalErrorCheckboxClass =
  "critical-error__report-checkbox relative box-border m-[1px_12px_0_0] inline-flex h-[22px] w-[22px] shrink-0 cursor-pointer appearance-none items-center justify-center rounded border-2 border-solid border-[var(--brand-colors-grey-grey000)] bg-transparent transition-[background] duration-200 checked:border-[var(--brand-colors-grey-grey000)] checked:bg-[var(--brand-colors-grey-grey000)] checked:after:absolute checked:after:h-[10px] checked:after:w-[5px] checked:after:rotate-45 checked:after:border-solid checked:after:border-b-2 checked:after:border-l-0 checked:after:border-r-2 checked:after:border-t-0 checked:after:border-[var(--brand-colors-grey-grey900)] checked:after:content-[''] light:border-text-default light:checked:border-text-default light:checked:bg-text-default light:checked:after:border-icon-inverse";
const criticalErrorDividerClass =
  "critical-error__divider m-0 flex items-center gap-3 text-s-body-sm font-normal leading-s-body-sm text-[var(--brand-colors-grey-grey400)] before:h-px before:flex-1 before:bg-[color-mix(in_srgb,var(--brand-colors-grey-grey400)_20%,transparent)] before:content-[''] after:h-px after:flex-1 after:bg-[color-mix(in_srgb,var(--brand-colors-grey-grey400)_20%,transparent)] after:content-[''] light:text-alternative light:before:bg-border-muted light:after:bg-border-muted [&>span]:shrink-0";

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
  return `<div class="critical-error__icon shrink-0 leading-none text-warning-default" aria-hidden="true">
          <svg class="block fill-current" width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/>
          </svg>
        </div>`;
}

export function getErrorHtmlBase(errorBody: string): string {
  return `
    <div class="critical-error__container box-border flex w-full flex-1 items-start justify-center px-4 py-6">
      <div class="critical-error box-border w-full max-w-[360px] rounded-lg p-0 ${criticalErrorSurfaceClass} ${criticalErrorTextClass}">
        <div class="critical-error__inner flex w-full flex-col items-stretch">
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
 * @param repairAction - The repair action to render.
 * @param criticalErrorType - The type of critical error to render.
 * @param showReportCheckbox - Whether to render the error reporting opt-in.
 * @returns The HTML string for the critical error message.
 */
export function getErrorHtml(
  errorKey: string,
  error: ErrorLike | undefined,
  localeContext: LocaleContext,
  supportLink?: string,
  repairAction: CriticalErrorRepairAction = CriticalErrorRepairAction.None,
  criticalErrorType?: CriticalErrorType,
  showReportCheckbox: boolean = true,
): string {
  switchDirectionForPreferredLocale(localeContext.preferredLocale);
  const { t, preferredLocale, localeMessages, enLocaleMessages } =
    localeContext;
  const isStateCorruptionError = isStateCorruptionErrorType(criticalErrorType);

  const legalText = `
    <span class="mb-3 block font-medium">${lodashEscape(t('errorLegalTextSummary'))}</span>
    <p class="my-2 font-normal">• ${lodashEscape(t('errorLegalTextFirstInfo'))}</p>
    <p class="my-2 font-normal">• ${lodashEscape(t('errorLegalTextSecondInfo'))}</p>
    <span class="mb-3 block font-medium">${lodashEscape(t('errorLegalTextNoPersonalInfo'))}</span>
  `;
  let repairButtonLabel;
  if (repairAction === CriticalErrorRepairAction.Recover) {
    if (error?.message === MISSING_VAULT_ERROR) {
      // In the case of "missing vault" error, the recovery is expected to work,
      // which is why we display "Recover accounts".
      repairButtonLabel = t('criticalErrorRecoverAccounts');
    } else {
      // In the case of errors other than "missing vault", we don't have 100% guarantee
      // that the recovery will work, which is why we display "Attempt recovery".
      repairButtonLabel = t('criticalErrorAttemptRecovery');
    }
  } else if (repairAction === CriticalErrorRepairAction.Reset) {
    repairButtonLabel = t('criticalErrorResetMetaMaskState');
  }

  const repairButtonClass = isStateCorruptionError
    ? `critical-error__button-restore button btn-primary ${criticalErrorRestoreButtonClass}`
    : `critical-error__button-secondary button ${criticalErrorSecondaryButtonClass}`;

  const repairButton = `<button
          id="critical-error-repair-button"
          type="button"
          disabled
          class="${repairButtonClass}">
          ${lodashEscape(repairButtonLabel)}
        </button>`;

  const externalIconSvg = `<svg
    class="critical-error__external-icon h-4 w-4 shrink-0 fill-current"
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
        class="critical-error__button-secondary button ${criticalErrorSecondaryButtonClass}">
        ${lodashEscape(t('criticalErrorReinstallMetamask'))}
        ${externalIconSvg}
      </a>`;

  const retryButton = `<button
        id="critical-error-button"
        class="critical-error__button-restore button btn-primary ${criticalErrorRestoreButtonClass}"
        title="Report this error and restart MetaMask">
        ${lodashEscape(t('restartMetamask'))}
      </button>`;

  const dividerSection = `<div class="${criticalErrorDividerClass}">
          <span>${lodashEscape(t('criticalErrorStillHavingIssues'))}</span>
        </div>`;

  let footer = '';
  if (supportLink) {
    const contactSupportLabel = (
      t('errorPageContactSupport') ?? ''
    ).toLowerCase();
    const supportLinkAnchor = `<a
        href="${lodashEscape(supportLink)}"
        class="${criticalErrorLinkClass}"
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
      <p class="critical-error__footer m-0 mt-2 self-stretch p-0 text-center text-s-body-sm font-medium leading-s-body-sm [&>span]:max-w-full [&>span]:shrink-0 ${criticalErrorMutedClass}">
        ${footerContent}
      </p>
    `;
  }

  const detailsContent = error?.message
    ? `<p class="critical-error__details m-0 max-h-[10em] overflow-auto border-b border-solid px-4 py-3 text-left ${criticalErrorMutedClass} ${criticalErrorBorderClass}"><code class="break-words whitespace-pre-wrap font-mono text-s-body-sm font-normal leading-s-body-sm">${lodashEscape(error?.message)}</code></p>`
    : '';

  let troubleStartingMessage = t('troubleStartingMessage');
  let salvageGuidance = '';
  if (isStateCorruptionError) {
    if (repairAction === CriticalErrorRepairAction.Reset) {
      troubleStartingMessage = t('criticalErrorStateCorruptionResetMessage');
    } else if (repairAction === CriticalErrorRepairAction.Recover) {
      troubleStartingMessage = t('criticalErrorStateCorruptionRecoverMessage');
    } else {
      troubleStartingMessage = '';
    }

    if (
      repairAction === CriticalErrorRepairAction.Reset ||
      repairAction === CriticalErrorRepairAction.Recover
    ) {
      const instructionsLink = `<a
        href="${lodashEscape(VAULT_RECOVERY_LINK)}"
        title="${lodashEscape(t('stateCorruptionTheseInstructionsLinkTitle') ?? '')}"
        class="${criticalErrorLinkClass}"
        target="_blank"
        rel="noopener noreferrer">${lodashEscape(t('stateCorruptionTheseInstructions') ?? '')}</a>`;
      try {
        salvageGuidance =
          (getMessage(
            preferredLocale,
            localeMessages,
            'stateCorruptionCopyAndRestoreBeforeReset',
            [instructionsLink],
          ) as string | null) ||
          (getMessage(
            'en',
            enLocaleMessages,
            'stateCorruptionCopyAndRestoreBeforeReset',
            [instructionsLink],
          ) as string | null) ||
          '';
      } catch {
        salvageGuidance = '';
      }
      if (salvageGuidance) {
        salvageGuidance = `<p class="${criticalErrorCopyClass} [&+p]:mt-3">${salvageGuidance}</p>`;
      }
    }
  }

  /**
   * The pattern ${errorKey === 'somethingIsWrong' ? t('somethingIsWrong') : ''}
   * is necessary because we need linter to see the string
   * of the locale keys. If we use the variable directly, the linter will not
   * see the string and will not be able to check if the locale key exists.
   */
  return getErrorHtmlBase(`
      <div class="critical-error__header box-border flex w-full items-center justify-center gap-2 px-4 pb-2 pt-4">
        ${criticalErrorWarningIconMarkup()}
        <h1 class="critical-error__title m-0 flex-auto text-left text-s-heading-sm font-bold leading-s-heading-sm ${criticalErrorTextClass}">${lodashEscape(t('troubleStartingTitle'))}</h1>
      </div>
      <div class="critical-error__body box-border flex w-full flex-col items-start gap-2.5 px-4">
        <p class="critical-error__intro ${criticalErrorCopyClass} empty:hidden pt-2">
          ${errorKey === 'troubleStarting' ? troubleStartingMessage : ''}
          ${errorKey === 'somethingIsWrong' ? t('somethingIsWrong') : ''}
        </p>
        ${salvageGuidance}
        <div class="critical-error__error-section box-border m-0 self-stretch rounded-lg border border-solid bg-muted p-0 ${criticalErrorBorderClass}">
          ${detailsContent}
          ${
            showReportCheckbox
              ? `<label class="critical-error__report m-0 flex cursor-pointer select-none items-start justify-start px-4 py-3 text-s-body-sm font-normal leading-s-body-sm ${criticalErrorTextClass}">
            <input
              id="critical-error-checkbox"
              type="checkbox"
              checked
              class="${criticalErrorCheckboxClass}"
            />
            <span class="critical-error__report-text flex-auto pt-px">
              ${lodashEscape(t('reportThisError'))}
            </span>
            <button
              id="critical-error-tip-anchor"
              popovertarget="critical-error-legal-text"
              type="button"
              class="critical-error__info m-0 ml-2 shrink-0 cursor-pointer border-0 bg-transparent p-0"
            >
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" class="critical-error__info-icon block h-5 w-5 fill-[var(--brand-colors-grey-grey400)] light:fill-text-alternative">
                <path d="m11 17h2v-6h-2zm1-8c.2833 0 .5208-.09583.7125-.2875s.2875-.42917.2875-.7125-.0958-.52083-.2875-.7125-.4292-.2875-.7125-.2875-.5208.09583-.7125.2875-.2875.42917-.2875.7125.0958.52083.2875.7125.4292.2875.7125.2875zm0 13c-1.3833 0-2.68333-.2625-3.9-.7875s-2.275-1.2375-3.175-2.1375-1.6125-1.9583-2.1375-3.175-.7875-2.5167-.7875-3.9.2625-2.68333.7875-3.9 1.2375-2.275 2.1375-3.175 1.95833-1.6125 3.175-2.1375 2.5167-.7875 3.9-.7875 2.6833.2625 3.9.7875 2.275 1.2375 3.175 2.1375 1.6125 1.95833 2.1375 3.175.7875 2.5167.7875 3.9-.2625 2.6833-.7875 3.9-1.2375 2.275-2.1375 3.175-1.9583 1.6125-3.175 2.1375-2.5167.7875-3.9.7875zm0-2c2.2333 0 4.125-.775 5.675-2.325s2.325-3.4417 2.325-5.675c0-2.23333-.775-4.125-2.325-5.675s-3.4417-2.325-5.675-2.325c-2.23333 0-4.125.775-5.675 2.325s-2.325 3.44167-2.325 5.675c0 2.2333.775 4.125 2.325 5.675s3.44167 2.325 5.675 2.325z"/>
              </svg>
            </button>
          </label>`
              : ''
          }
        </div>
      </div>
      ${
        showReportCheckbox
          ? `<div
        popover
        anchor="critical-error-tip-anchor"
        id="critical-error-legal-text"
        class="critical-error__legal-text z-[1000] max-w-80 rounded-lg border border-solid p-5 text-left text-s-body-sm leading-[1.2] shadow-md ${criticalErrorSurfaceClass} ${criticalErrorTextClass} ${criticalErrorBorderClass}"
      >
        ${legalText}
      </div>`
          : ''
      }
      <div class="critical-error__footer-actions box-border flex w-full flex-col items-stretch gap-3 p-4">
        ${isStateCorruptionError ? '' : `${retryButton}${dividerSection}`}
        ${repairAction === CriticalErrorRepairAction.None ? '' : repairButton}
        ${reinstallButton}
        ${footer}
      </div>
    `);
}
