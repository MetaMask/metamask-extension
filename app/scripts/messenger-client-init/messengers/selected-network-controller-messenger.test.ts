import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../lib/messenger';
import { getSelectedNetworkControllerMessenger } from './selected-network-controller-messenger';

describe('getSelectedNetworkControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const selectedNetworkControllerMessenger =
      getSelectedNetworkControllerMessenger(messenger);

    expect(selectedNetworkControllerMessenger).toBeInstanceOf(Messenger);
  });
});
