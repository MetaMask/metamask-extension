import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import type { CaipChainId } from '@metamask/utils';
import { NATIVE_TOKEN_ADDRESS } from '../../../constants/transaction';
import { toAssetId } from '../../asset-utils';
import type { TokenAmount } from '../types';

type ValueTransfer = NonNullable<
  V1TransactionByHashResponse['valueTransfers']
>[number];

const resolveAssetId = (
  chainId: CaipChainId,
  {
    contractAddress,
    transferType,
  }: {
    contractAddress?: string;
    transferType?: string;
  },
): string | undefined => {
  if (contractAddress) {
    return toAssetId(contractAddress, chainId);
  }

  if (transferType === 'normal') {
    return toAssetId(NATIVE_TOKEN_ADDRESS, chainId);
  }

  return undefined;
};

export function getTokenAmountFromTransfer(
  transfer: ValueTransfer | undefined,
  direction: TokenAmount['direction'],
  chainId: CaipChainId,
) {
  if (!transfer?.symbol && transfer?.amount === undefined) {
    return undefined;
  }

  const assetId = transfer
    ? resolveAssetId(chainId, {
        contractAddress: transfer.contractAddress,
        transferType: transfer.transferType,
      })
    : undefined;

  return {
    direction,
    ...(transfer.amount === null || transfer.amount === undefined
      ? {}
      : { amount: String(transfer.amount) }),
    ...(transfer.decimal === undefined ? {} : { decimals: transfer.decimal }),
    ...(transfer.symbol ? { symbol: transfer.symbol } : {}),
    ...(assetId ? { assetId } : {}),
  };
}

/**
 * When the transfer omits contractAddress, fall back to the indexed tx `to` field.
 *
 * @param token - Parsed token amount from the value transfer.
 * @param fallbackContractAddress - Indexed transaction `to` address used as ERC-20 fallback.
 * @param transferType - Value transfer type; native (`normal`) transfers skip the fallback.
 * @param chainId - CAIP-2 chain id for asset id encoding.
 * @returns Token amount with `assetId` set when a fallback address applies.
 */
export function withFallbackTokenAssetId(
  token: TokenAmount | undefined,
  fallbackContractAddress: string | undefined,
  transferType: string | undefined,
  chainId: CaipChainId,
): TokenAmount | undefined {
  if (
    !token ||
    token.assetId ||
    transferType === 'normal' ||
    !fallbackContractAddress
  ) {
    return token;
  }

  const assetId = toAssetId(fallbackContractAddress, chainId);
  if (!assetId) {
    return token;
  }

  return { ...token, assetId };
}
