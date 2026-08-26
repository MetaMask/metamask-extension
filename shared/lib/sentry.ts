import { createModuleLogger, createProjectLogger } from '@metamask/utils';
import type * as Sentry from '@sentry/browser';

const projectLogger = createProjectLogger('sentry');

export const sentryLogger = createModuleLogger(
  projectLogger,
  globalThis.document ? 'ui' : 'background',
);

/**
 * The property the Sentry SDK sets on an exception the first time that exact
 * object is captured, via its internal `checkOrSetAlreadyCaught` helper. Both
 * `Client.captureException` and `Client.captureEvent` check it first and drop the
 * event if it is set, and the global `onerror`/`onunhandledrejection` handlers
 * report through `captureEvent` with `originalException`.
 *
 * Setting it ourselves therefore suppresses *every* later capture of that
 * object, including ones we do not control such as the global
 * unhandled-rejection handler.
 *
 * This is an SDK-internal name rather than a documented API. It fails open: if a
 * future SDK version renames it we get reports back, never lost ones.
 * `shared/lib/sentry.test.ts` pins the behaviour so an upgrade that changes it
 * fails loudly.
 */
const SENTRY_CAPTURED_PROPERTY = '__sentry_captured__';

/**
 * Marks an error as already accounted for, so Sentry drops any attempt to
 * capture it.
 *
 * Use this for errors that are deliberately not reported - an expected browser
 * condition, say - that still need to propagate so callers can react. Without
 * the mark, every layer the error passes through, plus the global
 * unhandled-rejection handler, reports it.
 *
 * Only mark errors that were reported or deliberately suppressed. Marking an
 * error that nobody has accounted for silences it permanently.
 *
 * @param error - The error to mark. Values that cannot carry the mark, such as
 * primitives, are returned untouched.
 * @returns The same error, for convenient use in `throw` and `return`.
 */
export function markErrorAsCaptured<ErrorType>(error: ErrorType): ErrorType {
  try {
    // Defined the same way the SDK does it (`addNonEnumerableProperty`) rather
    // than importing that helper: this module intentionally reaches Sentry only
    // through `globalThis.sentry`, so the SDK is not a hard dependency of every
    // module that reports an error. `enumerable` defaults to false, which keeps
    // the mark out of `extraErrorDataIntegration` payloads and out of
    // `JSON.stringify` of the error.
    Object.defineProperty(error, SENTRY_CAPTURED_PROPERTY, {
      value: true,
      writable: true,
      configurable: true,
    });
  } catch {
    // A primitive, a frozen or sealed object, or a proxy that refuses
    // `defineProperty`. Attempting it unconditionally and catching is what the
    // SDK does, so a value it can mark - a thrown function, say - is one we can
    // mark too. Worst case the error is reported, as it was before.
  }
  return error;
}

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
  console.error(exception, ...(hint ? [hint] : []));
  if (!globalThis.sentry?.captureException) {
    console.warn('Sentry not initialized');
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
