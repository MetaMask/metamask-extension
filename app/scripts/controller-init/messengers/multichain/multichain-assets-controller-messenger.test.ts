import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getMultichainAssetsControllerMessenger } from './multichain-assets-controller-messenger';

describe('getMultichainAssetsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const multichainAssetsControllerMessenger =
      getMultichainAssetsControllerMessenger(messenger);

    expect(multichainAssetsControllerMessenger).toBeInstanceOf(Messenger);
  });
});
