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

  it('defaults currency fields missing from pay state', () => {
    const messenger = getRootMessenger<never, never>();
    registerAssetsHandlers(messenger, {
      getStateForTransactionPay: () => ({ currentCurrency: 'gbp' }),
    });

    expect(readCompatState(messenger)).toStrictEqual({
      currencyRates: {},
      currentCurrency: 'gbp',
    });

    const ratesOnlyMessenger = getRootMessenger<never, never>();
    registerAssetsHandlers(ratesOnlyMessenger, {
      getStateForTransactionPay: () => ({
        currencyRates: {
          ETH: {
            conversionDate: 1,
            conversionRate: 1700,
            usdConversionRate: 1700,
          },
        },
      }),
    });

    expect(readCompatState(ratesOnlyMessenger)).toStrictEqual({
      currencyRates: {
        ETH: {
          conversionDate: 1,
          conversionRate: 1700,
          usdConversionRate: 1700,
        },
      },
      currentCurrency: '',
    });
  });

  it('falls back to asset state when pay state is empty and skips unusable assets', () => {
    const messenger = getRootMessenger<never, never>();
    registerAssetsHandlers(messenger, {
      getStateForTransactionPay: () => undefined,
      getState: () => ({
        assetsInfo: {
          'bip122:0/slip44:0': { symbol: 'BTC', type: 'native' },
          'eip155:1/erc20:0xabc': { symbol: 'DAI', type: 'erc20' },
          'eip155:1/slip44:60': { symbol: 'ETH', type: 'native' },
          'eip155:1/slip44:61': { symbol: 'ETH', type: 'native' },
          'eip155:1/slip44:62': { type: 'native' },
          'eip155:137/slip44:966': { symbol: 'POL', type: 'native' },
          'eip155:56/slip44:714': { symbol: 'BNB', type: 'native' },
        },
        assetsPrice: {
          'eip155:1/slip44:60': { assetPriceType: 'fungible' },
          'eip155:137/slip44:966': { assetPriceType: 'nft' },
        },
      }),
    });

    expect(readCompatState(messenger)).toStrictEqual({
      currentCurrency: '',
      currencyRates: {
        ETH: {
          conversionDate: null,
          conversionRate: null,
          usdConversionRate: null,
        },
      },
    });
  });

  it('defaults missing AssetsController fields', () => {
    const messenger = getRootMessenger<never, never>();
    registerAssetsHandlers(messenger, {
      getState: () => ({ selectedCurrency: 'cad' }),
    });

    expect(readCompatState(messenger)).toStrictEqual({
      currencyRates: {},
      currentCurrency: 'cad',
    });

    const emptyMessenger = getRootMessenger<never, never>();
    registerAssetsHandlers(emptyMessenger, {
      getState: () => undefined,
    });

    expect(readCompatState(emptyMessenger)).toStrictEqual({
      currencyRates: {},
      currentCurrency: '',
    });
  });

  it('returns empty state when AssetsController state cannot be read', () => {
    const messenger = getRootMessenger<never, never>();
    registerAssetsHandlers(messenger, {
      getStateForTransactionPay: () => {
        throw new Error('pay state unavailable');
      },
      getState: () => {
        throw new Error('assets state unavailable');
      },
    });

    expect(readCompatState(messenger)).toStrictEqual({
      currencyRates: {},
      currentCurrency: '',
    });
  });
});

function registerAssetsHandlers(
  messenger: ReturnType<typeof getRootMessenger<never, never>>,
  handlers: {
    getState?: () => unknown;
    getStateForTransactionPay?: () => unknown;
  },
) {
  const assetsControllerMessenger = new Messenger({
    namespace: 'AssetsController',
    parent: messenger,
  });

  if (handlers.getState) {
    // AssetsController owns this action in production.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (assetsControllerMessenger as any).registerActionHandler(
      'AssetsController:getState',
      handlers.getState,
    );
  }

  if (handlers.getStateForTransactionPay) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (assetsControllerMessenger as any).registerActionHandler(
      'AssetsController:getStateForTransactionPay',
      handlers.getStateForTransactionPay,
    );
  }
}

function readCompatState(
  messenger: ReturnType<typeof getRootMessenger<never, never>>,
) {
  return getCurrencyRateCompatState(
    messenger as unknown as {
      call: (actionType: string, ...args: unknown[]) => unknown;
    },
  );
}
