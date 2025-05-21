import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getMultichainAssetsRatesControllerMessenger } from './multichain-assets-rates-controller-messenger';

describe('getMultichainAssetsRatesControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const multichainAssetsRatesControllerMessenger =
      getMultichainAssetsRatesControllerMessenger(messenger);

    expect(multichainAssetsRatesControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
