import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getNftDetectionControllerMessenger } from './nft-detection-controller-messenger';

describe('getNftDetectionControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const nftDetectionControllerMessenger =
      getNftDetectionControllerMessenger(messenger);

    expect(nftDetectionControllerMessenger).toBeInstanceOf(Messenger);
  });
});
