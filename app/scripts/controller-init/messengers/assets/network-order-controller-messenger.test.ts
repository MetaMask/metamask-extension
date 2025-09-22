import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getNetworkOrderControllerMessenger } from './network-order-controller-messenger';

describe('getNetworkOrderControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const nftControllerMessenger =
      getNetworkOrderControllerMessenger(messenger);
    expect(nftControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
