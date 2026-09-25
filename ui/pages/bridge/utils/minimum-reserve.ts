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
  type QuoteResponse,
  isSolanaChainId,
  sumAmounts,
} from '@metamask/bridge-controller';
import { BigNumber } from 'bignumber.js';
import { MultichainNetworks } from '../../../../shared/constants/multichain/networks';
import type { BridgeToken } from '../../../ducks/bridge/types';
import { isArcTokenUSDC } from '../../../components/app/assets/enablement/arc';

const isNativeOrArcUsdc = (assetId: CaipAssetType) =>
  isNativeAddress(assetId) || isArcTokenUSDC(assetId);

const MINIMUM_NATIVE_RESERVE_BALANCE_PER_CHAIN: { [key: CaipChainId]: string } =
  {
    'eip155:143': '10',
    'eip155:5042': '0.05',
    [MultichainNetworks.BITCOIN]: '0.00003',
  };

export const resolveMinimumReserveBalanceForCaipAssetId = (
  caipAssetId?: CaipAssetType,
): string => {
  if (!caipAssetId || !isNativeOrArcUsdc(caipAssetId)) {
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

/**
 * Minimum native balance to pass to `hasSufficientGasForQuote`.
 *
 * Native source: the quote reserve is shown by the "use max" reserve banner,
 * which is hidden while the gas error is set, so it stays out of the gas check.
 * Token source: there is no max to apply to the token amount, so a native
 * balance short of fee + quote reserve surfaces as the "buy more" gas error.
 *
 * @param quote - The quote being validated
 * @param minimumBalanceToKeep - Chain reserve (e.g. Solana rent exemption)
 */
export const resolveGasCheckMinimumBalance = (
  quote: QuoteResponse,
  minimumBalanceToKeep?: AmountsAndAsset,
): AmountsAndAsset | undefined =>
  isNativeAddress(quote.quote.src.asset.assetId)
    ? minimumBalanceToKeep
    : (sumAmounts([minimumBalanceToKeep], quote.quote.feeData.reserve) as
        | AmountsAndAsset
        | undefined);

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
    isNativeOrArcUsdc(fromToken.assetId) &&
    normalizedMaxSwappableNativeBalance.lt(validatedSrcAmount)
    ? {
        minimumNativeBalanceToBeKeptInAccount,
        maxSwappableNativeBalance:
          normalizedMaxSwappableNativeBalance.toString(),
      }
    : undefined;
};
