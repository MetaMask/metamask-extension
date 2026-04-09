import { Messenger } from '@metamask/messenger';
import { getRootMessenger } from '../../../lib/messenger';
import { getMultichainAssetsRatesControllerMessenger } from './multichain-assets-rates-controller-messenger';

describe('getMultichainAssetsRatesControllerMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const multichainAssetsRatesControllerMessenger =
      getMultichainAssetsRatesControllerMessenger(messenger);

    expect(multichainAssetsRatesControllerMessenger).toBeInstanceOf(Messenger);
  });
});
