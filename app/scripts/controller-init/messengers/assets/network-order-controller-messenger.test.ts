import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getNetworkOrderControllerMessenger } from './network-order-controller-messenger';

describe('getNetworkOrderControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const nftControllerMessenger =
      getNetworkOrderControllerMessenger(messenger);
    expect(nftControllerMessenger).toBeInstanceOf(Messenger);
  });
});
