import { Messenger } from '@metamask/messenger';
import { SentryTracingService } from '../services/sentry/sentry-tracing-service';
import { getSentryTracingServiceMessenger } from './messengers/sentry-tracing-service-messenger';
import { SentryTracingServiceInit } from './sentry-tracing-service-init';

describe('SentryTracingServiceInit', () => {
  it('returns a non-persisted service instance', () => {
    const rootMessenger = new Messenger({ namespace: 'Root' });
    const controllerMessenger = getSentryTracingServiceMessenger(rootMessenger);

    const result = SentryTracingServiceInit({
      controllerMessenger,
    } as never);

    expect(result).toStrictEqual({
      messengerClient: expect.any(SentryTracingService),
      persistedStateKey: null,
      memStateKey: null,
    });
  });
});
