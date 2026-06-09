import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { parseCaipAssetType } from '@metamask/utils';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import { formatUnits } from '../../../../shared/lib/unit';
import { useFormatters } from '../../../hooks/useFormatters';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';
import { selectMarketRates } from '../../../selectors/activity';

const maximumFractionDigits = 8;

export function TokenFiatValue({ token }: { token: TokenAmount }) {
  const { formatToken, formatCurrencyWithMinThreshold } = useFormatters();
  const currentCurrency = useSelector(getCurrentCurrency);
  const marketRates = useSelector(selectMarketRates);

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
    if (!token.assetId || !humanAmount) {
      return undefined;
    }
    try {
      const { chain, assetReference } = parseCaipAssetType(
        token.assetId as `${string}:${string}/${string}:${string}`,
      );
      const chainId = parseInt(chain.reference, 10);
      const tokenAddress = assetReference.toLowerCase();
      const rate = marketRates[chainId]?.[tokenAddress];
      if (!rate) {
        return undefined;
      }
      return Number(humanAmount) * rate;
    } catch {
      return undefined;
    }
  }, [token.assetId, humanAmount, marketRates]);

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
