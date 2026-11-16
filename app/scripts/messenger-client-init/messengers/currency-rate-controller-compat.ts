import type { AssetsControllerState } from '@metamask/assets-controller';
import { Messenger } from '@metamask/messenger';
import type { RootMessenger } from '../../lib/messenger';
import { augmentTempoCurrencyRates } from '../../../../shared/lib/assets/enablement/tempo';

export type CurrencyRateCompatState = {
  currencyRates: Record<
    string,
    {
      conversionDate: number | null;
      conversionRate: number | null;
      usdConversionRate: number | null;
    }
  >;
  currentCurrency: string;
};

const EMPTY_CURRENCY_RATE_STATE: CurrencyRateCompatState = {
  currencyRates: {},
  currentCurrency: '',
};

type CompatRootMessenger = {
  call: (actionType: string, ...args: unknown[]) => unknown;
};

const registeredRoots = new WeakSet<object>();

/**
 * Derive CurrencyRateController-shaped state from AssetsController so
 * downstream packages can keep calling CurrencyRateController:getState after
 * CurrencyRateController removal.
 *
 * Prefers `AssetsController:getStateForTransactionPay` when available (already
 * shaped for pay/rates), then falls back to AssetsController:getState.
 * Tempo has no native asset, so both paths add its USD rate from token prices
 * via `augmentTempoCurrencyRates`, matching `getCurrencyRateControllerCurrencyRates`.
 *
 * @param messenger - Root messenger used to read AssetsController state.
 * @returns Compat state with `currencyRates` and `currentCurrency`.
 */
export function getCurrencyRateCompatState(
  messenger: CompatRootMessenger,
): CurrencyRateCompatState {
  try {
    const transactionPayState = messenger.call(
      'AssetsController:getStateForTransactionPay',
    ) as CurrencyRateCompatState | undefined;
    if (transactionPayState) {
      return {
        currencyRates: withTempoCurrencyRates(
          transactionPayState.currencyRates ?? {},
          readAssetsPrice(messenger),
        ),
        currentCurrency: transactionPayState.currentCurrency ?? '',
      };
    }
  } catch {
    // Fall through to AssetsController:getState.
  }

  try {
    const assetsState = messenger.call('AssetsController:getState') as
      | {
          selectedCurrency?: string;
          assetsInfo?: Record<string, { symbol?: string; type?: string }>;
          assetsPrice?: Record<
            string,
            {
              assetPriceType?: string;
              lastUpdated?: number;
              price?: number;
              usdPrice?: number;
            }
          >;
        }
      | undefined;

    const currentCurrency = assetsState?.selectedCurrency ?? '';
    const currencyRates: CurrencyRateCompatState['currencyRates'] = {};
    const assetsInfo = assetsState?.assetsInfo ?? {};
    const assetsPrice = assetsState?.assetsPrice ?? {};

    for (const [assetId, metadata] of Object.entries(assetsInfo).toSorted(
      (a, b) => a[0].localeCompare(b[0]),
    )) {
      if (!metadata.symbol || currencyRates[metadata.symbol]) {
        continue;
      }
      if (metadata.type !== 'native') {
        continue;
      }
      if (!assetId.startsWith('eip155:')) {
        continue;
      }

      const price = assetsPrice[assetId];
      if (price?.assetPriceType !== 'fungible') {
        continue;
      }

      currencyRates[metadata.symbol] = {
        conversionDate:
          typeof price.lastUpdated === 'number'
            ? price.lastUpdated / 1000
            : null,
        conversionRate: price.price ?? null,
        usdConversionRate: price.usdPrice ?? null,
      };
    }

    return {
      currencyRates: withTempoCurrencyRates(
        currencyRates,
        assetsPrice as AssetsControllerState['assetsPrice'],
      ),
      currentCurrency,
    };
  } catch {
    return EMPTY_CURRENCY_RATE_STATE;
  }
}

/**
 * Adds the Tempo USD rate when token prices can supply one.
 * A failure here keeps the rates already derived for other chains.
 *
 * @param currencyRates - Rates keyed by native symbol.
 * @param assetsPrice - Asset prices keyed by CAIP-19 asset id.
 * @returns Rates including the derived Tempo USD rate when one is available.
 */
function withTempoCurrencyRates(
  currencyRates: CurrencyRateCompatState['currencyRates'],
  assetsPrice: AssetsControllerState['assetsPrice'],
): CurrencyRateCompatState['currencyRates'] {
  try {
    return augmentTempoCurrencyRates(currencyRates, assetsPrice);
  } catch {
    return currencyRates;
  }
}

/**
 * Reads asset prices for Tempo rate derivation. Missing state leaves rates unchanged.
 *
 * @param messenger - Root messenger used to read AssetsController state.
 * @returns Asset prices, or an empty map when state cannot be read.
 */
function readAssetsPrice(
  messenger: CompatRootMessenger,
): AssetsControllerState['assetsPrice'] {
  try {
    const assetsState = messenger.call('AssetsController:getState') as
      | { assetsPrice?: AssetsControllerState['assetsPrice'] }
      | undefined;
    return assetsState?.assetsPrice ?? {};
  } catch {
    return {};
  }
}

/**
 * Register a CurrencyRateController:getState shim backed by AssetsController.
 * Idempotent per root messenger so multiple consumers can safely call this.
 *
 * @param messenger - The root messenger.
 */
export function registerCurrencyRateGetStateCompat(
  messenger: RootMessenger,
): void {
  if (registeredRoots.has(messenger as object)) {
    return;
  }

  const compatMessenger = new Messenger({
    namespace: 'CurrencyRateController',
    parent: messenger,
  });
  // Namespace messenger has no built-in action types; register the compat getState.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (compatMessenger as any).registerActionHandler(
    'CurrencyRateController:getState',
    () =>
      getCurrencyRateCompatState(messenger as unknown as CompatRootMessenger),
  );

  registeredRoots.add(messenger as object);
}
