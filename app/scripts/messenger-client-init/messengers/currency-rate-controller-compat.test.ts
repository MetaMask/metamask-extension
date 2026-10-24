import { Messenger } from '@metamask/messenger';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../../shared/lib/environment';
import { getRootMessenger } from '../../lib/messenger';
import {
  getCurrencyRateCompatState,
  registerCurrencyRateGetStateCompat,
} from './currency-rate-controller-compat';

jest.mock('../../../../shared/lib/environment', () => ({
  ...jest.requireActual('../../../../shared/lib/environment'),
  getIsAssetsUnifiedStateIncludedInBuild: jest.fn(() => true),
}));

describe('currency-rate-controller-compat', () => {
  beforeEach(() => {
    jest.mocked(getIsAssetsUnifiedStateIncludedInBuild).mockReturnValue(true);
  });

  it('provides CurrencyRateController state backed by AssetsController pay state', () => {
    const messenger = getRootMessenger<never, never>();
    const assetsControllerMessenger = new Messenger({
      namespace: 'AssetsController',
      parent: messenger,
    });
    const currencyRates = {
      ETH: {
        conversionDate: 1,
        conversionRate: 1700,
        usdConversionRate: 1700,
      },
    };

    // This action is registered by AssetsController in production.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (assetsControllerMessenger as any).registerActionHandler(
      'AssetsController:getStateForTransactionPay',
      () => ({
        currencyRates,
        currentCurrency: 'usd',
      }),
    );

    registerCurrencyRateGetStateCompat(messenger);

    expect(
      // Compat action is registered dynamically on the root messenger.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (messenger as any).call('CurrencyRateController:getState'),
    ).toStrictEqual({
      currencyRates,
      currentCurrency: 'usd',
    });
  });

  it('derives CurrencyRateController state from AssetsController:getState', () => {
    const messenger = getRootMessenger<never, never>();
    const assetsControllerMessenger = new Messenger({
      namespace: 'AssetsController',
      parent: messenger,
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (assetsControllerMessenger as any).registerActionHandler(
      'AssetsController:getState',
      () => ({
        selectedCurrency: 'eur',
        assetsInfo: {
          'eip155:1/slip44:60': {
            symbol: 'ETH',
            type: 'native',
          },
        },
        assetsPrice: {
          'eip155:1/slip44:60': {
            assetPriceType: 'fungible',
            lastUpdated: 2000,
            price: 2500,
            usdPrice: 2500,
          },
        },
      }),
    );

    expect(
      getCurrencyRateCompatState(
        messenger as unknown as {
          call: (actionType: string, ...args: unknown[]) => unknown;
        },
      ),
    ).toStrictEqual({
      currentCurrency: 'eur',
      currencyRates: {
        ETH: {
          conversionDate: 2,
          conversionRate: 2500,
          usdConversionRate: 2500,
        },
      },
    });
  });

  it('provides empty CurrencyRateController state when assets are excluded', () => {
    jest.mocked(getIsAssetsUnifiedStateIncludedInBuild).mockReturnValue(false);
    const messenger = getRootMessenger<never, never>();

    registerCurrencyRateGetStateCompat(messenger);

    expect(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (messenger as any).call('CurrencyRateController:getState'),
    ).toStrictEqual({
      currencyRates: {},
      currentCurrency: '',
    });
  });

  it('registers CurrencyRateController:getState only once per root messenger', () => {
    const messenger = getRootMessenger<never, never>();

    registerCurrencyRateGetStateCompat(messenger);
    expect(() => registerCurrencyRateGetStateCompat(messenger)).not.toThrow();
  });
});
