import type {
  ActionConstraint,
  EventConstraint,
  Messenger,
} from '@metamask/messenger';
import { getActiveSpan, trace, TraceName } from '../../../shared/lib/trace';

/**
 * Wrap a messenger's `call` method with Sentry tracing.
 * Each `messenger.call(action, ...args)` invocation creates a child span
 * under the currently active trace, enabling visibility into
 * inter-controller communication sequences.
 * Skips trace overhead when no active span exists (e.g. MetaMetrics off).
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
  const originalCall = messenger.call.bind(messenger);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (messenger as any).call = (actionType: string, ...args: unknown[]) => {
    if (!getActiveSpan()) {
      return (originalCall as (...a: unknown[]) => unknown)(actionType, ...args);
    }
    return trace(
      {
        name: `${TraceName.MessengerCall}: ${actionType}`,
        op: 'messenger.call',
        data: { action: actionType },
      },
      () => (originalCall as (...a: unknown[]) => unknown)(actionType, ...args),
    );
  };

  return messenger;
}
