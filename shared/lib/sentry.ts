import { createModuleLogger, createProjectLogger } from '@metamask/utils';
import type * as Sentry from '@sentry/browser';

const projectLogger = createProjectLogger('sentry');

export const sentryLogger = createModuleLogger(
  projectLogger,
  globalThis.document ? 'ui' : 'background',
);

type SentryCaptureExceptionHint = Parameters<
  (typeof Sentry)['captureException']
>[1];
type SentryCaptureExceptionHintWithTags = SentryCaptureExceptionHint & {
  tags?: Record<string, string>;
};
export const TRACE_ID_TAG = 'trace_id';

function getCaptureExceptionHintWithTraceId(
  hint?: SentryCaptureExceptionHint,
): SentryCaptureExceptionHint | undefined {
  const activeSpan = globalThis.sentry?.getActiveSpan?.();

  if (!activeSpan) {
    return hint;
  }

  let traceId: string | undefined;

  try {
    traceId = activeSpan.spanContext().traceId;
  } catch {
    return hint;
  }

  const hintWithTags = hint as SentryCaptureExceptionHintWithTags | undefined;

  if (!traceId || TRACE_ID_TAG in (hintWithTags?.tags ?? {})) {
    return hint;
  }

  // A scope-callback hint must be preserved and invoked. The object path below
  // would replace the callback with a plain tags object, so Sentry would never
  // run it and the caller's scope mutations would be lost. Wrap it instead: set
  // the trace id as a default on the scope, then run the caller's callback,
  // which may override it.
  if (typeof hint === 'function') {
    const scopeCallback = hint as (scope: Sentry.Scope) => Sentry.Scope;
    return ((scope: Sentry.Scope) => {
      scope.setTag(TRACE_ID_TAG, traceId);
      return scopeCallback(scope);
    }) as SentryCaptureExceptionHint;
  }

  return {
    ...hintWithTags,
    tags: {
      ...hintWithTags?.tags,
      [TRACE_ID_TAG]: traceId,
    },
  } as SentryCaptureExceptionHint;
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

  const captureHint = getCaptureExceptionHintWithTraceId(hint);

  return globalThis.sentry.captureException(
    exception,
    ...(captureHint ? [captureHint] : []),
  );
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
