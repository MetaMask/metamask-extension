import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { getNativeTokenAddress } from '@metamask/assets-controllers';
import type { MetamaskPayMetadata } from '@metamask/transaction-controller';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import type { Hex } from '@metamask/utils';
import { getTokenMetadataFromKnownToken } from '../../../../shared/lib/activity/adapters/helpers';
import { toAssetId } from '../../../../shared/lib/asset-utils';
import {
  getNativeTokenInfo,
  getUSDConversionRateByChainId,
} from '../../../selectors';
import { isEqualCaseInsensitive as equalsIgnoreCase } from '../../../../shared/lib/string-utils';

// This should be common helper
function getNativeToken(chainId: Hex) {
  return {
    address: getNativeTokenAddress(chainId),
    ...getNativeTokenInfo({}, chainId),
  };
}

// Builds the "You received" token amount from `metamaskPay`
// Converts targetFiat → token
export function useDestinationToken(
  metamaskPay: MetamaskPayMetadata | undefined,
) {
  const { chainId, targetFiat, tokenAddress } = metamaskPay ?? {};
  const fiatUsd = Number.parseFloat(targetFiat || '');

  const nativeTokenUsdRate = useSelector((state) =>
    chainId ? getUSDConversionRateByChainId(chainId)(state) : undefined,
  );

  return useMemo(() => {
    if (!targetFiat || !tokenAddress || !chainId) {
      return undefined;
    }

    if (!Number.isFinite(fiatUsd) || fiatUsd <= 0) {
      return undefined;
    }

    const knownToken = getTokenMetadataFromKnownToken(
      tokenAddress,
      'in',
      toEvmCaipChainId(chainId),
    );

    const nativeToken = getNativeToken(chainId);
    const isNative = equalsIgnoreCase(tokenAddress, nativeToken.address);

    let amount: string | undefined;

    if (isNative) {
      if (!nativeTokenUsdRate) {
        return undefined;
      }

      const tokenAmount = fiatUsd / nativeTokenUsdRate;

      amount =
        tokenAmount >= 1 ? tokenAmount.toFixed(2) : tokenAmount.toPrecision(4);
    } else {
      amount = targetFiat;
    }

    return {
      amount,
      direction: 'in' as const,
      decimals: knownToken?.decimals ?? 18,
      assetId: toAssetId(tokenAddress as Hex, chainId),
      symbol: isNative ? nativeToken.symbol : knownToken?.symbol,
    };
  }, [chainId, targetFiat, tokenAddress, nativeTokenUsdRate]);
}
