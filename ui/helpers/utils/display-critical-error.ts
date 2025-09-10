import browser from 'webextension-polyfill';
import log from 'loglevel';
import { v4 as uuidv4 } from 'uuid';
import { ErrorLike } from '../../../shared/constants/errors';
import {
  getErrorHtml,
  maybeGetLocaleContext,
} from '../../../shared/lib/error-utils';
import { SUPPORT_LINK } from '../../../shared/lib/ui-utils';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';

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
export function extractEnvelopeUrlFromDsn(dsn: string): string | null {
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
    return null;
  }
}

function getSentryTarget() {
  if (
    process.env.IN_TEST &&
    (!process.env.SENTRY_DSN_DEV || !getManifestFlags().sentry?.forceEnable)
  ) {
    return null;
  }

  if (!process.env.SENTRY_DSN) {
    return null;
  }

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

    // Create event payload according to Sentry specs
    // event_id, error_details and user_agent are required by Sentry envelope format, hence the disable is valid
    const eventPayload = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      event_id: eventId,
      timestamp,
      platform: 'javascript',
      level: 'error',
      message: error?.message || 'MetaMask extension crush critical error',
      release: browser.runtime.getManifest()?.version || 'unknown',
      extra: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        error_details:
          error && typeof error === 'object'
            ? error
            : { message: String(error) },
        // eslint-disable-next-line @typescript-eslint/naming-convention
        user_agent: globalThis.navigator?.userAgent || 'unknown',
      },
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

    if (!sentryEnvelopeURL) {
      throw new Error(`Invalid Sentry DSN format: ${sentryDSN}`);
    }

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

  const restartButton = container.querySelector<HTMLButtonElement>(
    '#critical-error-button',
  );
  const reportCheckbox = container.querySelector<HTMLInputElement>(
    '#critical-error-checkbox',
  );

  // Restart button: report error and restart MetaMask
  restartButton?.addEventListener('click', async () => {
    const shouldReport = reportCheckbox?.checked ?? false;
    await handleRestartAction(error, shouldReport);
  });

  log.error(error.stack);
  throw error;
}
