import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getMultichainNetworkControllerMessenger } from './multichain-network-controller-messenger';

describe('getMultichainNetworkControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const multichainNetworkControllerMessenger =
      getMultichainNetworkControllerMessenger(messenger);

    expect(multichainNetworkControllerMessenger).toBeInstanceOf(Messenger);
  });
});
