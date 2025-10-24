import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getWebSocketServiceMessenger } from './websocket-service-messenger';

describe('getWebSocketServiceMessenger', () => {
  it('returns a restricted controller messenger', () => {
    const controllerMessenger = getRootMessenger<never, never>();
    const messenger = getWebSocketServiceMessenger(controllerMessenger);

    expect(messenger).toBeInstanceOf(Messenger);
  });
});
