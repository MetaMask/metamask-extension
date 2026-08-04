import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { isNonEvmChainId } from '@metamask/bridge-controller';
import {
  type CaipChainId,
  type Hex,
  parseCaipAssetType,
} from '@metamask/utils';
import {
  calculateFiatFromMarketRates,
  getHumanReadableTokenAmount,
  toMarketRateLookupToken,
} from '../../shared/lib/activity/fiat';
import type { TokenAmount } from '../../shared/lib/activity/types';
import {
  MULTICHAIN_TESTNET_NETWORKS,
  type MultichainNetworks,
} from '../../shared/constants/multichain/networks';
import { decimalToPrefixedHex } from '../../shared/lib/conversion.utils';
import { getCurrencyRates } from '../ducks/metamask/metamask';
import { selectMarketRates } from '../selectors/activity';
import { getAssetsPrice, getAssetsRates } from '../selectors/assets';
import { getShowFiatInTestnets, getUseCurrencyRateCheck } from '../selectors';
import { getMultichainShouldShowFiat } from '../selectors/multichain';
import { useAppSelector } from '../store/hooks';
import type { MetaMaskReduxState } from '../store/store';

type AssetsPriceMap = Record<
  string,
  { assetPriceType?: string; price?: number } | undefined
>;
type ConversionRatesMap = Record<
  string,
  { rate?: string | number } | undefined
>;
type CurrencyRatesMap = Record<string, { conversionRate?: number } | undefined>;

function getPositiveRate(value: unknown): number | undefined {
  const rate = Number(value);
  if (Number.isFinite(rate) && rate > 0) {
    return rate;
  }
  return undefined;
}

function getFiniteTokenQuantity(
  token: TokenAmount,
): { humanAmount: string; quantity: number } | undefined {
  const humanAmount = getHumanReadableTokenAmount(token);
  if (humanAmount === undefined) {
    return undefined;
  }

  const quantity = Number(humanAmount);
  if (!Number.isFinite(quantity)) {
    return undefined;
  }

  return { humanAmount, quantity };
}

function shouldShowFiatForChain(
  state: MetaMaskReduxState,
  chainId: Hex | CaipChainId | undefined,
): boolean {
  if (chainId === undefined) {
    return true;
  }

  if (!isNonEvmChainId(chainId)) {
    return getMultichainShouldShowFiat(state, undefined, chainId);
  }

  if (!getUseCurrencyRateCheck(state)) {
    return false;
  }

  return MULTICHAIN_TESTNET_NETWORKS.includes(chainId as MultichainNetworks)
    ? getShowFiatInTestnets(state)
    : true;
}

function fiatFromAssetsPrice(
  token: TokenAmount,
  assetsPrice: AssetsPriceMap,
  quantity: number,
): number | undefined {
  if (!token.assetId) {
    return undefined;
  }

  const priceEntry = assetsPrice[token.assetId];
  if (priceEntry?.assetPriceType !== 'fungible') {
    return undefined;
  }

  const rate = getPositiveRate(priceEntry.price);
  return rate === undefined ? undefined : quantity * rate;
}

function fiatFromConversionRates(
  token: TokenAmount,
  conversionRates: ConversionRatesMap,
  quantity: number,
): number | undefined {
  if (!token.assetId) {
    return undefined;
  }

  const rate = getPositiveRate(conversionRates[token.assetId]?.rate);
  return rate === undefined ? undefined : quantity * rate;
}

function fiatFromCurrencyOrMarketRates(
  token: TokenAmount,
  currencyRates: CurrencyRatesMap,
  marketRates: ReturnType<typeof selectMarketRates>,
  humanAmount: string,
  quantity: number,
): number | undefined {
  if (!token.assetId) {
    return undefined;
  }

  try {
    const { chain, assetNamespace } = parseCaipAssetType(
      token.assetId as `${string}:${string}/${string}:${string}`,
    );

    // Non-EVM natives only (slip44). Symbol match is unsafe for SPL/etc.
    // tokens that reuse native tickers.
    if (
      chain.namespace !== 'eip155' &&
      assetNamespace === 'slip44' &&
      token.symbol
    ) {
      const rate = getPositiveRate(
        currencyRates?.[token.symbol]?.conversionRate,
      );
      if (rate !== undefined) {
        return quantity * rate;
      }
    }

    if (chain.namespace === 'eip155') {
      const hexChainId = decimalToPrefixedHex(chain.reference) as Hex;
      const lookupToken = toMarketRateLookupToken(token, hexChainId);
      return calculateFiatFromMarketRates(
        humanAmount,
        lookupToken,
        marketRates,
      );
    }
  } catch {
    return undefined;
  }

  return undefined;
}

/**
 * Returns a function that converts a {@link TokenAmount} to an unsigned fiat
 * value in the user's current currency. `direction` is not required — apply
 * activity `+/-` at the call site when needed.
 *
 * When `chainId` is provided, respects the user's show-fiat preferences. For
 * non-EVM activity rows, gating uses the row chain (not the selected account),
 * because `getMultichainShouldShowFiat` fails when an EVM account is selected.
 *
 * Rate lookup order:
 * 1. `assetsPrice` (all chains; price already in user currency)
 * 2. MultichainAssetsRatesController conversion rates (CAIP assetId)
 * 3. `currencyRates` by token symbol (non-EVM natives only)
 * 4. EVM `marketRates` fallback
 *
 * @param chainId - Optional activity/row chain used for show-fiat gating.
 * @returns A function `(token) => fiatAmount` in the user's currency, or
 * `undefined` when fiat should be hidden or no rate is available.
 */
export function useConvertToFiat(chainId?: Hex | CaipChainId) {
  const assetsPrice = useSelector(getAssetsPrice) as AssetsPriceMap;
  const conversionRates = useSelector(getAssetsRates) as ConversionRatesMap;
  const currencyRates = useSelector(getCurrencyRates) as CurrencyRatesMap;
  const marketRates = useSelector(selectMarketRates);
  const shouldShowFiat = useAppSelector((state) =>
    shouldShowFiatForChain(state, chainId),
  );

  return useCallback(
    (token: TokenAmount | undefined): number | undefined => {
      if (!shouldShowFiat || !token) {
        return undefined;
      }

      const parsed = getFiniteTokenQuantity(token);
      if (!parsed) {
        return undefined;
      }

      const { humanAmount, quantity } = parsed;
      return (
        fiatFromAssetsPrice(token, assetsPrice, quantity) ??
        fiatFromConversionRates(token, conversionRates, quantity) ??
        fiatFromCurrencyOrMarketRates(
          token,
          currencyRates,
          marketRates,
          humanAmount,
          quantity,
        )
      );
    },
    [shouldShowFiat, assetsPrice, conversionRates, currencyRates, marketRates],
  );
}
