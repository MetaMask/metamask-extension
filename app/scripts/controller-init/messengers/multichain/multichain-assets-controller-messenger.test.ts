import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getMultichainAssetsControllerMessenger } from './multichain-assets-controller-messenger';

describe('getMultichainAssetsControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const multichainAssetsControllerMessenger =
      getMultichainAssetsControllerMessenger(messenger);

    expect(multichainAssetsControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
