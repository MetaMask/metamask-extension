import browser from 'webextension-polyfill';
import log from 'loglevel';
import { v4 as uuidv4 } from 'uuid';
import { ErrorLike } from '../../../shared/constants/errors';
import {
  getErrorHtml,
  maybeGetLocaleContext,
} from '../../../shared/lib/error-utils';
import { SUPPORT_LINK } from '../../../shared/lib/ui-utils';
import { updateCurrentLocale } from '../../../shared/lib/translate';
import getFirstPreferredLangCode from '../../../shared/lib/get-first-preferred-lang-code';
import { confirmAndTriggerVaultRestore } from '../../../shared/lib/vault-restore-utils';

/**
 * Extracts the Sentry envelope URL from a Sentry DSN.
 *
 * DSN format: https://[PUBLIC_KEY]@[ORG_ID].[INGEST_DOMAIN]/[PROJECT_ID]
 * Envelope URL format: https://[ORG_ID].[INGEST_DOMAIN]/api/[PROJECT_ID]/envelope/
 *
 * @param dsn - The Sentry DSN string
 * @returns The corresponding envelope URL
 * @throws Error if DSN format is invalid
 */
export function extractEnvelopeUrlFromDsn(dsn: string): string {
  try {
    // Parse the DSN URL
    const url = new URL(dsn);
    // Extract project ID from pathname (remove leading slash)
    const projectId = url.pathname.slice(1);
    // Extract organization ID and ingest domain from hostname
    // hostname format: [ORG_ID].[INGEST_DOMAIN]
    const hostParts = url.hostname.split('.');
    const orgId = hostParts[0];
    const ingestDomain = hostParts.slice(1).join('.');

    // Construct envelope URL
    return `https://${orgId}.${ingestDomain}/api/${projectId}/envelope/`;
  } catch (error) {
    throw new Error('Invalid Sentry DSN format');
  }
}

function getSentryTarget() {
  if (process.env.METAMASK_ENVIRONMENT !== 'production') {
    return process.env.SENTRY_DSN_DEV;
  }

  return process.env.SENTRY_DSN;
}

export enum CriticalErrorTranslationKey {
  TroubleStarting = 'troubleStarting',
  SomethingIsWrong = 'somethingIsWrong',
}

/**
 * Sends critical MetaMask errors to Sentry via direct API call.
 *
 * @param error - The error object to report to Sentry
 * @returns Promise that resolves when the report is sent
 */
async function sendErrorToSentry(error: ErrorLike): Promise<void> {
  const sentryDSN = getSentryTarget();
  if (!sentryDSN) {
    return;
  }

  try {
    // Generate unique event ID (32-char hex UUID4)
    const eventId = uuidv4().replace(/-/gu, '');
    const timestamp = Math.floor(Date.now() / 1000);

    // Extract sentryTags from error object (if present)
    // Any error can define error.sentryTags to add searchable tags to Sentry
    const errorObj = error as Record<string, unknown>;
    const sentryTags =
      errorObj?.sentryTags && typeof errorObj.sentryTags === 'object'
        ? (errorObj.sentryTags as Record<string, string>)
        : {};

    // Create error_details without sentryTags to avoid duplication
    // (sentryTags are sent as top-level tags)
    let errorDetails: Record<string, unknown>;
    if (error && typeof error === 'object') {
      const { sentryTags: _omitted, ...rest } = errorObj;
      errorDetails = rest;
    } else {
      errorDetails = { message: String(error) };
    }

    // Create event payload according to Sentry specs
    // event_id, error_details and user_agent are required by Sentry envelope format, hence the disable is valid
    const eventPayload = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      event_id: eventId,
      timestamp,
      platform: 'javascript',
      level: 'error',
      message: error?.message || 'MetaMask extension crash critical error',
      release: browser.runtime.getManifest()?.version || 'unknown',
      extra: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        error_details: errorDetails,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        user_agent: globalThis.navigator?.userAgent || 'unknown',
      },
      // Add tags for searchable/filterable fields in Sentry UI
      tags: sentryTags,
    };

    // Create envelope headers
    // event_id and sent_at are Required by Sentry envelope format, hence the disable is valid
    const envelopeHeaders = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      event_id: eventId,
      dsn: sentryDSN,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      sent_at: new Date().toISOString(),
    };

    const eventPayloadString = JSON.stringify(eventPayload);
    const itemHeader = {
      type: 'event',
      length: eventPayloadString.length,
    };

    const envelope = `${JSON.stringify(envelopeHeaders)}\n${JSON.stringify(itemHeader)}\n${eventPayloadString}`;
    const sentryEnvelopeURL = extractEnvelopeUrlFromDsn(sentryDSN);

    // Send to Sentry envelope API (must match DSN region)
    await fetch(sentryEnvelopeURL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
      },
      body: envelope,
    });
  } catch (e) {
    console.error('Error sending report to Sentry:', e);
  }
}

/**
 * Handles the restart action: sends error report to Sentry (if enabled) and restarts MetaMask.
 *
 * @param error - The error object to report
 * @param shouldReport - Whether to send the error report to Sentry
 */
async function handleRestartAction(
  error: ErrorLike,
  shouldReport: boolean,
): Promise<void> {
  // Send error report to Sentry first (if enabled)
  if (shouldReport) {
    await sendErrorToSentry(error);
  }
  // Restart the extension
  browser.runtime.reload();
}

/**
 * Checks if a vault backup exists in IndexedDB.
 * This is used to determine whether to show the "restore accounts" option on the critical error screen.
 *
 * Note: We access IndexedDB directly here instead of using globalThis.stateHooks.getBackupState()
 * because this function is called when the UI initialization has timed out, meaning the
 * PersistenceManager (which powers stateHooks) may not have been initialized yet.
 *
 * @returns A promise that resolves to true if a vault backup exists, false otherwise.
 */
async function checkVaultBackupExists(): Promise<boolean> {
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('metamask-backup', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    const tx = db.transaction('store', 'readonly');
    const store = tx.objectStore('store');
    const keyringRequest = store.get('KeyringController');

    return new Promise((resolve) => {
      keyringRequest.onsuccess = () => {
        const keyringController = keyringRequest.result as
          | { vault?: unknown }
          | undefined;
        const hasVault = Boolean(keyringController?.vault);
        db.close();
        resolve(hasVault);
      };
      keyringRequest.onerror = () => {
        db.close();
        resolve(false);
      };
    });
  } catch {
    return false;
  }
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
 * @param port - Optional port for background communication (needed for restore accounts functionality).
 * @throws {ErrorLike} Throws the error after displaying the message.
 * @returns A promise that resolves to never, as it always throws an error.
 */
export async function displayCriticalErrorMessage(
  container: HTMLElement,
  errorKey: CriticalErrorTranslationKey,
  error: ErrorLike,
  currentLocale?: string,
  port?: browser.Runtime.Port,
): Promise<never> {
  // Check if we can trigger restore: need both a port for communication and a backup in IndexedDB
  const canTriggerRestore = Boolean(port) && (await checkVaultBackupExists());

  const localeContext = await maybeGetLocaleContext(currentLocale);
  const html = getErrorHtml(
    errorKey,
    error,
    localeContext,
    SUPPORT_LINK,
    canTriggerRestore,
  );

  const criticalErrorContainer = displayCriticalErrorPage(container, html);
  if (criticalErrorContainer) {
    const restartButton =
      criticalErrorContainer.querySelector<HTMLButtonElement>(
        '#critical-error-button',
      );
    const reportCheckbox =
      criticalErrorContainer.querySelector<HTMLInputElement>(
        '#critical-error-checkbox',
      );

    // Restart button: report error and restart MetaMask
    restartButton?.addEventListener('click', async () => {
      const shouldReport = reportCheckbox?.checked ?? false;
      await handleRestartAction(error, shouldReport);
    });

    // Restore accounts link: trigger vault recovery flow
    if (canTriggerRestore && port) {
      const restoreLink =
        criticalErrorContainer.querySelector<HTMLAnchorElement>(
          '#critical-error-restore-link',
        );

      if (restoreLink) {
        // Set up locale for confirmation dialog
        const preferredLocale =
          currentLocale ?? (await getFirstPreferredLangCode());
        await updateCurrentLocale(preferredLocale);

        const handleRestoreClick = async (event: Event) => {
          event.preventDefault();
          const confirmed = confirmAndTriggerVaultRestore(port);
          if (confirmed) {
            restoreLink.removeEventListener('click', handleRestoreClick);
            // Open the extension in a new full-page tab. This gives the background
            // a fresh connection attempt and provides a better user experience
            // for the recovery flow.
            const extensionURL = browser.runtime.getURL('home.html');
            await browser.tabs.create({ url: extensionURL });
            // Close the current popup/sidepanel
            window.close();
          }
        };
        restoreLink.addEventListener('click', handleRestoreClick);
      }
    }
  }

  log.error(error.stack);
  throw error;
}

/**
 * Displays a critical error in the given container using the given HTML.
 *
 * @param container - The HTML element to display the error in.
 * @param html - The HTML contents of the critical error page.
 */
export function displayCriticalErrorPage(
  container: HTMLElement,
  html: string,
): HTMLElement | undefined {
  const appContainerParent = container.parentElement;
  if (!appContainerParent) {
    console.warn(
      'Cannot display critical error. Another critical error may already be shown.',
    );
    return undefined;
  }

  const criticalErrorContainer = document.createElement('div');
  criticalErrorContainer.setAttribute('id', 'critical-error-content');
  criticalErrorContainer.innerHTML = html;

  // Prevent app contents from writing over critical error by removing application root.
  appContainerParent.removeChild(container);
  appContainerParent.prepend(criticalErrorContainer);
  return criticalErrorContainer;
}
