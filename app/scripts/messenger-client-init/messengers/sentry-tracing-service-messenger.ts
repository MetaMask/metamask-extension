import {
  Messenger,
  type MessengerActions,
  type MessengerEvents,
} from '@metamask/messenger';
import type { SentryTracingServiceMessenger } from '../../services/sentry/sentry-tracing-service';
import type { RootMessenger } from '../../lib/messenger';

/**
 * Create a messenger restricted to the actions used by SentryTracingService.
 *
 * @param messenger - The root messenger.
 * @returns The restricted service messenger.
 */
export function getSentryTracingServiceMessenger(
  messenger: RootMessenger<
    MessengerActions<SentryTracingServiceMessenger>,
    MessengerEvents<SentryTracingServiceMessenger>
  >,
): SentryTracingServiceMessenger {
  const serviceMessenger: SentryTracingServiceMessenger = new Messenger({
    namespace: 'SentryTracingService',
    parent: messenger,
  });

  messenger.delegate({
    messenger: serviceMessenger,
    actions: ['AnalyticsController:getState'],
    events: [],
  });

  return serviceMessenger;
}
