import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import {
  getBackendWebSocketServiceMessenger,
  getBackendWebSocketServiceInitMessenger,
} from './backend-websocket-service-messenger';

describe('getBackendWebSocketServiceMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = new Messenger<never, never>();
    const messenger = getBackendWebSocketServiceMessenger(controllerMessenger);

    expect(messenger).toBeInstanceOf(RestrictedMessenger);
    expect(messenger).toBeDefined();
  });
});

describe('getBackendWebSocketServiceInitMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = new Messenger<never, never>();
    const messenger =
      getBackendWebSocketServiceInitMessenger(controllerMessenger);

    expect(messenger).toBeInstanceOf(RestrictedMessenger);
    expect(messenger).toBeDefined();
  });
});
