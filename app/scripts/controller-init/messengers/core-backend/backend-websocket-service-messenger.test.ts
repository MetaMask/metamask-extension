import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getBackendWebSocketServiceMessenger,
  getBackendWebSocketServiceInitMessenger,
} from './backend-websocket-service-messenger';

describe('getBackendWebSocketServiceMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = getRootMessenger<never, never>();
    const messenger = getBackendWebSocketServiceMessenger(controllerMessenger);

    expect(messenger).toBeInstanceOf(Messenger);
    expect(messenger).toBeDefined();
  });
});

describe('getBackendWebSocketServiceInitMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = getRootMessenger<never, never>();
    const messenger =
      getBackendWebSocketServiceInitMessenger(controllerMessenger);

    expect(messenger).toBeInstanceOf(Messenger);
    expect(messenger).toBeDefined();
  });
});
