import type {
  ActionConstraint,
  EventConstraint,
  Messenger,
} from '@metamask/messenger';
import { getActiveSpan, trace } from '../../../shared/lib/trace';
import { shouldSampleWrappers } from '../../../shared/lib/wrapper-sampling';

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
    const activeSpan = getActiveSpan();
    if (!activeSpan) {
      return originalCall(actionType, ...args);
    }
    if (!shouldSampleWrappers(activeSpan.spanContext()?.traceId)) {
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
