import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import {
  getNetworkControllerInitMessenger,
  getNetworkControllerMessenger,
} from './network-controller-messenger';

describe('getNetworkControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const NetworkControllerMessenger = getNetworkControllerMessenger(messenger);

    expect(NetworkControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getNetworkControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const NetworkControllerInitMessenger =
      getNetworkControllerInitMessenger(messenger);

    expect(NetworkControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
