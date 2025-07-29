import type * as Sentry from '@sentry/browser';

/**
 * Captures an exception event and sends it to Sentry.
 *
 * @param exception -The exception to capture.
 * @param hint - Optional additional data to attach to the Sentry event.
 * @returns the id of the captured Sentry event, or `undefined` if Sentry is not initialized.
 */
export function captureException(
  exception: unknown,
  hint?: Parameters<(typeof Sentry)['captureException']>[1],
): string | undefined {
  if (!globalThis.sentry?.captureException) {
    console.warn('Sentry not initialized');
    console.error(exception, ...(hint ? [hint] : []));
    return undefined;
  }
  return globalThis.sentry.captureException(exception, ...(hint ? [hint] : []));
}

/**
 * Captures a message event and sends it to Sentry.
 *
 * @param message - The message to send to Sentry.
 * @param captureContext - Define the level of the message or pass in additional data to attach to the message.
 * @returns the id of the captured message, or `undefined` if Sentry is not initialized.
 */
export function captureMessage(
  message: string,
  captureContext?: Parameters<(typeof Sentry)['captureMessage']>[1],
): string | undefined {
  if (!globalThis.sentry?.captureMessage) {
    console.warn('Sentry not initialized');
    console.log(message, ...(captureContext ? [captureContext] : []));
    return undefined;
  }
  return globalThis.sentry.captureMessage(
    message,
    ...(captureContext ? [captureContext] : []),
  );
}
