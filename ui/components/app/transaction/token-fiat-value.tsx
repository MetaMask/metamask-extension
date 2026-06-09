import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { parseCaipAssetType } from '@metamask/utils';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import { formatUnits } from '../../../../shared/lib/unit';
import { useFormatters } from '../../../hooks/useFormatters';
import { getCurrentCurrency, getCurrencyRates } from '../../../ducks/metamask/metamask';
import { getAssetsPrice } from '../../../selectors/assets';
import { selectMarketRates } from '../../../selectors/activity';
import { getMultichainAssetsRatesControllerConversionRates } from '../../../../shared/lib/selectors/assets-migration';

const maximumFractionDigits = 8;

export function TokenFiatValue({ token }: { token: TokenAmount }) {
  const { formatToken, formatCurrencyWithMinThreshold } = useFormatters();
  const currentCurrency = useSelector(getCurrentCurrency);
  const assetsPrice = useSelector(getAssetsPrice);
  const marketRates = useSelector(selectMarketRates);
  const currencyRates = useSelector(getCurrencyRates);
  const conversionRates = useSelector(getMultichainAssetsRatesControllerConversionRates);

  const { amount: tokenAmount, decimals, symbol } = token;

  const humanAmount = useMemo(() => {
    if (!tokenAmount) {
      return undefined;
    }
    try {
      return formatUnits(BigInt(tokenAmount), decimals ?? 0);
    } catch {
      return tokenAmount;
    }
  }, [tokenAmount, decimals]);

  const fiatValue = useMemo(() => {
    if (!humanAmount) {
      return undefined;
    }

    // 1. assetsPrice covers all chains (EVM + non-EVM), price already in user's currency.
    if (token.assetId) {
      const prices = assetsPrice as Record<string, { assetPriceType?: string; price?: number } | undefined>;
      const priceEntry = prices[token.assetId];
      if (priceEntry?.assetPriceType === 'fungible' && priceEntry.price !== undefined) {
        return Number(humanAmount) * priceEntry.price;
      }
    }

    // 2. conversionRates (MultichainAssetsRatesController) keyed by CAIP assetId — covers non-EVM like Solana.
    if (token.assetId) {
      const rates = conversionRates as Record<string, { rate?: string } | undefined>;
      const entry = rates[token.assetId];
      if (entry?.rate) {
        return Number(humanAmount) * Number(entry.rate);
      }
    }

    // 3. currencyRates has native token rates keyed by symbol (e.g. SOL, ETH).
    if (symbol) {
      const rate = currencyRates?.[symbol]?.conversionRate;
      if (rate) {
        return Number(humanAmount) * rate;
      }
    }

    // 4. EVM fallback via selectMarketRates (hex chain ID based).
    if (token.assetId) {
      try {
        const { chain, assetReference } = parseCaipAssetType(
          token.assetId as `${string}:${string}/${string}:${string}`,
        );
        const chainId = parseInt(chain.reference, 10);
        const rate = marketRates[chainId]?.[assetReference.toLowerCase()];
        if (rate) {
          return Number(humanAmount) * rate;
        }
      } catch {
        // ignore parse errors
      }
    }

    return undefined;
  }, [token.assetId, humanAmount, symbol, assetsPrice, conversionRates, currencyRates, marketRates]);

  if (fiatValue !== undefined) {
    return <>{formatCurrencyWithMinThreshold(fiatValue, currentCurrency)}</>;
  }

  if (!humanAmount) {
    return null;
  }

  const tokenDisplay = symbol
    ? formatToken(humanAmount as `${number}`, symbol, { maximumFractionDigits })
    : humanAmount;

  return <>{tokenDisplay}</>;
}
