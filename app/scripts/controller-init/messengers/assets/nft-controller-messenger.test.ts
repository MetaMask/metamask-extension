import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getNftControllerMessenger } from './nft-controller-messenger';

describe('getNftControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const nftControllerMessenger = getNftControllerMessenger(messenger);

    expect(nftControllerMessenger).toBeInstanceOf(RestrictedMessenger);
  });
});
