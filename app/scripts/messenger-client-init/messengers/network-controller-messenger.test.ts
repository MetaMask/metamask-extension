import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getNetworkControllerMessenger } from './network-controller-messenger';

describe('getNetworkControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const NetworkControllerMessenger = getNetworkControllerMessenger(messenger);

    expect(NetworkControllerMessenger).toBeInstanceOf(Messenger);
  });
});
