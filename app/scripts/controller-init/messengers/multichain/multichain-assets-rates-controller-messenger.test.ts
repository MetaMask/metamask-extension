import { Messenger, RestrictedMessenger } from '@metamask/base-controller';
import { getMultiChainAssetsRatesControllerMessenger } from './multichain-assets-rates-controller-messenger';

describe('getMultiChainAssetsRatesControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = new Messenger<never, never>();
    const multichainAssetsRatesControllerMessenger =
      getMultiChainAssetsRatesControllerMessenger(messenger);

    expect(multichainAssetsRatesControllerMessenger).toBeInstanceOf(
      RestrictedMessenger,
    );
  });
});
