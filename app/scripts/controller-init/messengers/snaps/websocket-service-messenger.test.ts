import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getWebSocketServiceMessenger } from './websocket-service-messenger';

describe('getWebSocketServiceMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = new Messenger<never, never>();
    const messenger = getWebSocketServiceMessenger(controllerMessenger);

    expect(messenger).toBeInstanceOf(RestrictedMessenger);
  });
});
