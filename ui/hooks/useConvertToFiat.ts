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

function getPositiveRate(value: unknown): number | undefined {
  const rate = Number(value);
  if (Number.isFinite(rate) && rate > 0) {
    return rate;
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
  const assetsPrice = useSelector(getAssetsPrice);
  const conversionRates = useSelector(getAssetsRates);
  const currencyRates = useSelector(getCurrencyRates);
  const marketRates = useSelector(selectMarketRates);
  const shouldShowFiat = useAppSelector((state) => {
    if (chainId === undefined) {
      return true;
    }

    if (isNonEvmChainId(chainId)) {
      if (!getUseCurrencyRateCheck(state)) {
        return false;
      }
      return MULTICHAIN_TESTNET_NETWORKS.includes(chainId as MultichainNetworks)
        ? getShowFiatInTestnets(state)
        : true;
    }

    return getMultichainShouldShowFiat(state, undefined, chainId);
  });

  return useCallback(
    (token: TokenAmount | undefined): number | undefined => {
      if (!shouldShowFiat || !token) {
        return undefined;
      }

      const humanAmount = getHumanReadableTokenAmount(token);
      if (humanAmount === undefined) {
        return undefined;
      }

      const quantity = Number(humanAmount);
      if (!Number.isFinite(quantity)) {
        return undefined;
      }

      // 1. assetsPrice — all chains, already in user's currency.
      if (token.assetId) {
        const priceEntry = (
          assetsPrice as Record<
            string,
            { assetPriceType?: string; price?: number } | undefined
          >
        )[token.assetId];
        if (priceEntry?.assetPriceType === 'fungible') {
          const rate = getPositiveRate(priceEntry.price);
          if (rate !== undefined) {
            return quantity * rate;
          }
        }
      }

      // 2. conversionRates — MultichainAssetsRatesController by CAIP assetId.
      if (token.assetId) {
        const rate = getPositiveRate(
          (
            conversionRates as Record<
              string,
              { rate?: string | number } | undefined
            >
          )[token.assetId]?.rate,
        );
        if (rate !== undefined) {
          return quantity * rate;
        }
      }

      if (token.assetId) {
        try {
          const { chain, assetNamespace } = parseCaipAssetType(
            token.assetId as `${string}:${string}/${string}:${string}`,
          );

          // 3. currencyRates — non-EVM natives only (slip44). Symbol match is
          // unsafe for SPL/etc. tokens that reuse native tickers.
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

          // 4. EVM marketRates fallback.
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
      }

      return undefined;
    },
    [shouldShowFiat, assetsPrice, conversionRates, currencyRates, marketRates],
  );
}
