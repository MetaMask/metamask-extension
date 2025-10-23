import { Messenger } from '@metamask/messenger';
import { getSelectedNetworkControllerMessenger } from './selected-network-controller-messenger';
import { getRootMessenger } from '.';

describe('getSelectedNetworkControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const selectedNetworkControllerMessenger =
      getSelectedNetworkControllerMessenger(messenger);

    expect(selectedNetworkControllerMessenger).toBeInstanceOf(Messenger);
  });
});
