import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getMultichainNetworkControllerMessenger } from './multichain-network-controller-messenger';

describe('getMultichainNetworkControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const multichainNetworkControllerMessenger =
      getMultichainNetworkControllerMessenger(messenger);

    expect(multichainNetworkControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
