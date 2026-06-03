import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import type { CaipChainId } from '@metamask/utils';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { Hex } from 'viem';
import { BRIDGE_CHAINID_COMMON_TOKEN_PAIR } from '../../../constants/bridge';
import { CHAIN_IDS } from '../../../constants/network';
import {
  IN_PROGRESS_TRANSACTION_STATUSES,
  NATIVE_TOKEN_ADDRESS,
  SmartTransactionStatus,
  TransactionGroupStatus,
} from '../../../constants/transaction';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../constants/tokens';
import { toAssetId } from '../../asset-utils';
import type { TransactionGroup } from '../../multichain/types';
import type { Status, TokenAmount } from '../types';

export type ValueTransfer = NonNullable<
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

  if (transferType === 'normal' || transferType === 'internal') {
    return toAssetId(NATIVE_TOKEN_ADDRESS, chainId);
  }

  return undefined;
};

function getTransactionStatusKey(
  transaction: TransactionGroup['primaryTransaction'],
): string {
  const {
    txReceipt: { status: receiptStatus } = {},
    type,
    status,
  } = transaction;

  if (receiptStatus === '0x0') {
    return TransactionStatus.failed;
  }

  if (
    status === TransactionStatus.confirmed &&
    type === TransactionType.cancel
  ) {
    return TransactionGroupStatus.cancelled;
  }

  return transaction.status;
}

export function getLocalTransactionStatus({
  primaryTransaction,
  initialTransaction,
}: {
  primaryTransaction: TransactionGroup['primaryTransaction'];
  initialTransaction: TransactionGroup['initialTransaction'];
}): Status {
  if (initialTransaction.isSmartTransaction) {
    const smartStatus = initialTransaction.status as string | undefined;

    if (smartStatus === SmartTransactionStatus.pending) {
      return 'pending';
    }

    if (smartStatus === SmartTransactionStatus.success) {
      return 'success';
    }

    if (smartStatus === SmartTransactionStatus.cancelled) {
      return 'failed';
    }

    return 'pending';
  }

  const statusKey = getTransactionStatusKey(primaryTransaction);

  if (statusKey === TransactionStatus.confirmed) {
    return 'success';
  }

  if (
    statusKey === TransactionStatus.cancelled ||
    statusKey === TransactionGroupStatus.cancelled ||
    statusKey === TransactionStatus.dropped ||
    statusKey === TransactionStatus.failed ||
    statusKey === TransactionStatus.rejected
  ) {
    return 'failed';
  }

  if (
    IN_PROGRESS_TRANSACTION_STATUSES.includes(
      statusKey as (typeof IN_PROGRESS_TRANSACTION_STATUSES)[number],
    )
  ) {
    return 'pending';
  }

  return 'pending';
}

export function getKnownTokenMetadata(
  chainId: CaipChainId | Hex,
  contractAddress?: string,
) {
  if (contractAddress === undefined) {
    return undefined;
  }

  const assetId = toAssetId(contractAddress, chainId);
  const tokenMetadata =
    (chainId === CHAIN_IDS.MAINNET || assetId?.startsWith('eip155:1/')
      ? STATIC_MAINNET_TOKEN_LIST[contractAddress.toLowerCase()]
      : undefined) ??
    Object.values(BRIDGE_CHAINID_COMMON_TOKEN_PAIR).find(
      (token) => token?.assetId === assetId,
    );

  return tokenMetadata
    ? { ...tokenMetadata, ...(assetId ? { assetId } : {}) }
    : undefined;
}

export function getTokenMetadataFromKnownToken(
  contractAddress: string | undefined,
  direction: TokenAmount['direction'],
  chainId: CaipChainId | Hex,
) {
  const tokenMetadata = getKnownTokenMetadata(chainId, contractAddress);

  if (!tokenMetadata) {
    return undefined;
  }

  return {
    direction,
    ...(tokenMetadata.symbol ? { symbol: tokenMetadata.symbol } : {}),
    ...(tokenMetadata.decimals === undefined
      ? {}
      : { decimals: tokenMetadata.decimals }),
    ...(tokenMetadata.assetId ? { assetId: tokenMetadata.assetId } : {}),
  };
}

export function getTokenAmountFromTransfer(
  transfer: ValueTransfer | undefined,
  direction: TokenAmount['direction'],
  chainId: CaipChainId,
) {
  if (!transfer?.symbol && transfer?.amount === undefined) {
    return undefined;
  }

  const isNftTransfer =
    transfer?.transferType === 'erc721' || transfer?.transferType === 'erc1155';

  const assetId =
    transfer && !isNftTransfer
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
