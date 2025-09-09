import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getBackendWebSocketServiceMessenger } from './backend-websocket-service-messenger';

describe('getBackendWebSocketServiceMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = new Messenger<never, never>();
    const messenger = getBackendWebSocketServiceMessenger(controllerMessenger);

    expect(messenger).toBeInstanceOf(RestrictedMessenger);
  });
});
