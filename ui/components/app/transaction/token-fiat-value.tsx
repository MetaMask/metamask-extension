import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { parseCaipAssetType, type Hex } from '@metamask/utils';
import type { TokenAmount } from '../../../../shared/lib/activity/types';
import { decimalToPrefixedHex } from '../../../../shared/lib/conversion.utils';
import { formatUnits } from '../../../../shared/lib/unit';
import { useConvertToFiat } from '../../../hooks/useConvertToFiat';
import { useFormatters } from '../../../hooks/useFormatters';
import { useGetTokenStandardAndDetails } from '../../../pages/confirmations/hooks/useGetTokenStandardAndDetails';
import { getCurrentCurrency } from '../../../ducks/metamask/metamask';

const maximumFractionDigits = 8;

export function TokenFiatValue({ token }: { token: TokenAmount }) {
  const { formatToken, formatCurrencyWithMinThreshold } = useFormatters();
  const currentCurrency = useSelector(getCurrentCurrency);
  const convertToFiat = useConvertToFiat();

  const shouldResolveOnChain = !token.symbol || token.decimals === undefined;
  const onChainLookup = useMemo(() => {
    if (!shouldResolveOnChain || !token.assetId?.includes('/erc20:')) {
      return undefined;
    }

    const { chain, assetReference } = parseCaipAssetType(
      token.assetId as `${string}:${string}/${string}:${string}`,
    );

    return {
      tokenAddress: assetReference as Hex,
      chainId: decimalToPrefixedHex(chain.reference),
    };
  }, [shouldResolveOnChain, token.assetId]);

  const onChainTokenDetails = useGetTokenStandardAndDetails(
    onChainLookup?.tokenAddress,
    onChainLookup?.chainId,
  );

  const resolvedToken = useMemo<TokenAmount>(
    () => ({
      ...token,
      symbol:
        token.symbol ??
        ('symbol' in onChainTokenDetails
          ? onChainTokenDetails.symbol
          : undefined),
      decimals: token.decimals ?? onChainTokenDetails.decimalsNumber,
    }),
    [token, onChainTokenDetails],
  );

  const humanAmount = useMemo(() => {
    if (!resolvedToken.amount) {
      return undefined;
    }
    try {
      return formatUnits(
        BigInt(resolvedToken.amount),
        resolvedToken.decimals ?? 0,
      );
    } catch {
      return resolvedToken.amount;
    }
  }, [resolvedToken.amount, resolvedToken.decimals]);

  const fiatValue = convertToFiat(resolvedToken);

  if (fiatValue !== undefined) {
    return <>{formatCurrencyWithMinThreshold(fiatValue, currentCurrency)}</>;
  }

  if (!humanAmount) {
    return null;
  }

  const tokenDisplay = resolvedToken.symbol
    ? formatToken(humanAmount as `${number}`, resolvedToken.symbol, {
        maximumFractionDigits,
      })
    : humanAmount;

  return <>{tokenDisplay}</>;
}
