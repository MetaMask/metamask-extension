import { Messenger } from '@metamask/messenger';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../../shared/lib/environment';
import { getRootMessenger } from '../../lib/messenger';
import {
  getBridgeControllerInitMessenger,
  getBridgeControllerMessenger,
} from './bridge-controller-messenger';

jest.mock('../../../../shared/lib/environment', () => ({
  ...jest.requireActual('../../../../shared/lib/environment'),
  getIsAssetsUnifiedStateIncludedInBuild: jest.fn(() => true),
}));

describe('getBridgeControllerMessenger', () => {
  beforeEach(() => {
    jest.mocked(getIsAssetsUnifiedStateIncludedInBuild).mockReturnValue(true);
  });

  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const BridgeControllerMessenger = getBridgeControllerMessenger(messenger);

    expect(BridgeControllerMessenger).toBeInstanceOf(Messenger);
  });

  it('provides CurrencyRateController state backed by AssetsController', () => {
    const messenger = getRootMessenger<never, never>();
    const assetsControllerMessenger = new Messenger({
      namespace: 'AssetsController',
      parent: messenger,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (assetsControllerMessenger as any).registerActionHandler(
      'AssetsController:getState',
      () => ({
        selectedCurrency: 'usd',
        assetsInfo: {
          'eip155:1/slip44:60': { symbol: 'ETH', type: 'native' },
        },
        assetsPrice: {
          'eip155:1/slip44:60': {
            assetPriceType: 'fungible',
            lastUpdated: 2000,
            price: 1700,
            usdPrice: 1700,
          },
        },
      }),
    );

    const bridgeControllerMessenger = getBridgeControllerMessenger(messenger);

    expect(
      bridgeControllerMessenger.call('CurrencyRateController:getState'),
    ).toStrictEqual({
      currentCurrency: 'usd',
      currencyRates: {
        ETH: {
          conversionDate: 2,
          conversionRate: 1700,
          usdConversionRate: 1700,
        },
      },
    });
  });
});

describe('getBridgeControllerInitMessenger', () => {
  it('returns a restricted messenger', () => {
    const messenger = getRootMessenger<never, never>();
    const BridgeControllerInitMessenger =
      getBridgeControllerInitMessenger(messenger);

    expect(BridgeControllerInitMessenger).toBeInstanceOf(Messenger);
  });
});
