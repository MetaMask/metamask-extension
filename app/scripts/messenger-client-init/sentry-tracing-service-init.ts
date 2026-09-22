import {
  SentryTracingService,
  type SentryTracingServiceMessenger,
} from '../services/sentry/sentry-tracing-service';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the Sentry tracing service.
 *
 * @param request - The initialization request.
 * @param request.controllerMessenger - The messenger used by the service.
 * @returns The initialized service.
 */
export const SentryTracingServiceInit: MessengerClientInitFunction<
  SentryTracingService,
  SentryTracingServiceMessenger
> = ({ controllerMessenger }) => {
  const messengerClient = new SentryTracingService({
    messenger: controllerMessenger,
  });

  return {
    messengerClient,
    persistedStateKey: null,
    memStateKey: null,
  };
};
