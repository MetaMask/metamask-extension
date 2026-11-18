import { Messenger } from '@metamask/messenger';
import { getSentryTracingServiceMessenger } from './sentry-tracing-service-messenger';

describe('getSentryTracingServiceMessenger', () => {
  it('creates a restricted messenger', () => {
    const rootMessenger = new Messenger({ namespace: 'Root' });

    const messenger = getSentryTracingServiceMessenger(rootMessenger);

    expect(messenger).toBeInstanceOf(Messenger);
  });
});
