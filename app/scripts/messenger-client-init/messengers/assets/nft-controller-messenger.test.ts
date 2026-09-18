import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import {
  getNftControllerInitMessenger,
  getNftControllerMessenger,
} from './nft-controller-messenger';

describe('getNftControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const nftControllerMessenger = getNftControllerMessenger(messenger);

    expect(nftControllerMessenger).toBeInstanceOf(Messenger);
  });
});

describe('getNftControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const nftControllerInitMessenger = getNftControllerInitMessenger(messenger);

    expect(nftControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
