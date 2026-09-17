import {
  parseCaipAssetType,
  type CaipAssetType,
  type CaipChainId,
} from '@metamask/utils';
import {
  calcNormalizedTokenAmount,
  getNativeAssetForChainId,
  isNativeAddress,
  type AmountsAndAsset,
  isSolanaChainId,
} from '@metamask/bridge-controller';
import { BigNumber } from 'bignumber.js';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import type { BridgeToken } from '../../../ducks/bridge/types';

const MINIMUM_NATIVE_RESERVE_BALANCE_PER_CHAIN: { [key: CaipChainId]: string } =
  {
    'eip155:143': '10',
    [MultichainNetworks.BITCOIN]: '0.00003',
  };

export const resolveMinimumReserveBalanceForCaipAssetId = (
  caipAssetId?: CaipAssetType,
): string => {
  if (!caipAssetId || !isNativeAddress(caipAssetId)) {
    return '0';
  }
  const { chainId } = parseCaipAssetType(caipAssetId);
  return MINIMUM_NATIVE_RESERVE_BALANCE_PER_CHAIN[chainId] ?? '0';
};

/**
 * Native amount that must be reserved on the source chain (e.g. Solana rent
 * exemption). Returns undefined for chains with no reserve requirement.
 *
 * @param srcChainId - The resolved source chain id
 * @param minimumBalanceForRentExemptionInLamports - The Solana rent-exemption reserve in lamports
 */
export const resolveMinimumBalanceToKeep = (
  srcChainId: Parameters<typeof isSolanaChainId>[0] | undefined,
  minimumBalanceForRentExemptionInLamports: string | null,
): AmountsAndAsset | undefined => {
  if (
    !srcChainId ||
    !isSolanaChainId(srcChainId) ||
    !minimumBalanceForRentExemptionInLamports
  ) {
    return undefined;
  }

  const nativeAsset = getNativeAssetForChainId(srcChainId);
  return {
    amount: minimumBalanceForRentExemptionInLamports,
    normalizedAmount: calcNormalizedTokenAmount(
      minimumBalanceForRentExemptionInLamports,
      nativeAsset.decimals,
    ),
    asset: nativeAsset,
  };
};

type InsufficientNativeReserveError = {
  minimumNativeBalanceToBeKeptInAccount: string;
  maxSwappableNativeBalance: string;
};

export const buildInsufficientNativeReserveError = ({
  fromToken,
  nativeBalance,
  validatedSrcAmount,
  minimumNativeBalanceToBeKeptInAccount,
  maxSwappableNativeBalance,
}: {
  fromToken: BridgeToken | null;
  nativeBalance: string | null;
  validatedSrcAmount?: string;
  minimumNativeBalanceToBeKeptInAccount: string;
  maxSwappableNativeBalance: BigNumber;
}): InsufficientNativeReserveError | undefined => {
  const normalizedMaxSwappableNativeBalance = BigNumber.max(
    maxSwappableNativeBalance,
    0,
  );

  return minimumNativeBalanceToBeKeptInAccount !== '0' &&
    nativeBalance &&
    validatedSrcAmount &&
    fromToken &&
    isNativeAddress(fromToken.assetId) &&
    normalizedMaxSwappableNativeBalance.lt(validatedSrcAmount)
    ? {
        minimumNativeBalanceToBeKeptInAccount,
        maxSwappableNativeBalance:
          normalizedMaxSwappableNativeBalance.toString(),
      }
    : undefined;
};
