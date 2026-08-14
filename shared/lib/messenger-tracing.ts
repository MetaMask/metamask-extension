import type {
  ActionConstraint,
  EventConstraint,
  Messenger,
} from '@metamask/messenger';
import { sentryGetActiveSpan, trace } from './trace';
import { shouldSampleWrappers } from './wrapper-sampling';

/**
 * Read-only verb prefixes that produce noise in trace waterfalls without
 * useful timing or attribution signal. Empirically these dominate
 * messenger.call volume in `metamask-performance` (~90% of all calls).
 *
 * The pattern matches `:verb` followed by an uppercase letter (camelCase
 * method) or end-of-string, so it catches both `:getState` and `:getSnap`
 * without false-matching `:getter` (which doesn't exist as a method anyway).
 */
const READ_ONLY_VERB = /^(?:get|has|find|is|peek)(?:[A-Z]|$)/u;

export function isReadOnlyAction(actionType: string): boolean {
  const colonIndex = actionType.indexOf(':');
  if (colonIndex === -1) {
    return false;
  }
  return READ_ONLY_VERB.test(actionType.slice(colonIndex + 1));
}

/**
 * Wrap a messenger's `call` method with Sentry tracing.
 * Each `messenger.call(action, ...args)` invocation creates a child span
 * under the currently active trace, enabling visibility into
 * inter-controller communication sequences.
 * Skips trace overhead when no active span exists (e.g. MetaMetrics off).
 * Returns the messenger unchanged when SENTRY_DISTRIBUTED_TRACING_DISABLED is set.
 *
 * @param messenger - The messenger instance to instrument.
 * @returns The same messenger with tracing applied to `call`.
 */
export function wrapMessengerWithTracing<
  Namespace extends string,
  AllowedActions extends ActionConstraint,
  AllowedEvents extends EventConstraint,
>(
  messenger: Messenger<Namespace, AllowedActions, AllowedEvents>,
): Messenger<Namespace, AllowedActions, AllowedEvents> {
  if (process.env.SENTRY_DISTRIBUTED_TRACING_DISABLED) {
    return messenger;
  }

  const originalCall = messenger.call.bind(messenger) as (
    actionType: string,
    ...args: unknown[]
  ) => unknown;

  messenger.call = ((actionType: string, ...args: unknown[]) => {
    const activeSpan = sentryGetActiveSpan();
    let traceId: string | undefined;
    try {
      traceId = activeSpan?.spanContext().traceId;
    } catch {
      // Span may have ended or be invalid — fall through to original call so
      // tracing failure cannot escape into controller logic.
    }
    if (
      !traceId ||
      isReadOnlyAction(actionType) ||
      !shouldSampleWrappers(traceId)
    ) {
      return originalCall(actionType, ...args);
    }
    return trace(
      {
        name: `Messenger Call: ${actionType}`,
        op: 'messenger.call',
        data: { action: actionType },
      },
      () => originalCall(actionType, ...args),
    );
  }) as typeof messenger.call;

  return messenger;
}
