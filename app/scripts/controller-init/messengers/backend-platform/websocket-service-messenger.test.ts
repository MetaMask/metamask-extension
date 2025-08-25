import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getWebSocketServiceMessenger } from './websocket-service-messenger';

describe('getWebSocketServiceMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const webSocketServiceMessenger = getWebSocketServiceMessenger(messenger);

    expect(webSocketServiceMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});