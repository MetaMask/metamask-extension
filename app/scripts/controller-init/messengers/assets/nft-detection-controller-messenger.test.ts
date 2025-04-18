import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getNftDetectionControllerMessenger } from './nft-detection-controller-messenger';

describe('getNftDetectionControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const nftDetectionControllerMessenger =
      getNftDetectionControllerMessenger(messenger);

    expect(nftDetectionControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
