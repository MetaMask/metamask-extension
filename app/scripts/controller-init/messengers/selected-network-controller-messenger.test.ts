import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getSelectedNetworkControllerMessenger } from './selected-network-controller-messenger';

describe('getSelectedNetworkControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const selectedNetworkControllerMessenger =
      getSelectedNetworkControllerMessenger(messenger);

    expect(selectedNetworkControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
