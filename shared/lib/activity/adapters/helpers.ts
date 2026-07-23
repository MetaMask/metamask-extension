import type { V1TransactionByHashResponse } from '@metamask/core-backend';
import type { CaipChainId } from '@metamask/utils';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import type { Hex } from 'viem';
import {
  BRIDGE_CHAINID_COMMON_TOKEN_PAIR,
  BRIDGE_CHAINID_TO_DEFAULT_FROM_TOKEN,
} from '../../../constants/bridge';
import { CHAIN_IDS } from '../../../constants/network';
import {
  IN_PROGRESS_TRANSACTION_STATUSES,
  NATIVE_TOKEN_ADDRESS,
  SmartTransactionStatus,
  TransactionGroupStatus,
} from '../../../constants/transaction';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../constants/tokens';
import { toAssetId } from '../../asset-utils';
import { isEqualCaseInsensitive as equalsIgnoreCase } from '../../string-utils';
import type { TransactionGroup } from '../../multichain/types';
import type { ActivityFee, Status, TokenAmount } from '../types';

export type ValueTransfer = NonNullable<
  V1TransactionByHashResponse['valueTransfers']
>[number];

export function isNftStandard(value?: string) {
  return value === 'erc721' || value === 'erc1155';
}

export function getNftPaymentTransfer({
  side,
  sentTransfer,
  receivedTransfer,
  sentNativeTransfer,
  nftCounterparty,
  transactionFrom,
  subjectAddress,
}: {
  side: 'buy' | 'sell';
  sentTransfer?: ValueTransfer;
  receivedTransfer?: ValueTransfer;
  sentNativeTransfer?: ValueTransfer;
  nftCounterparty: string;
  transactionFrom?: string;
  subjectAddress: string;
}) {
  const isFungible = (transfer?: ValueTransfer) =>
    Boolean(transfer && !isNftStandard(transfer.transferType));

  if (side === 'buy') {
    for (const transfer of [sentNativeTransfer, sentTransfer]) {
      if (!transfer || !isFungible(transfer)) {
        continue;
      }

      if (
        equalsIgnoreCase(transfer.to, nftCounterparty) ||
        transfer.transferType === 'normal'
      ) {
        return transfer;
      }
    }

    return undefined;
  }

  if (!receivedTransfer || !isFungible(receivedTransfer)) {
    return undefined;
  }

  if (
    equalsIgnoreCase(receivedTransfer.from, nftCounterparty) ||
    (transactionFrom &&
      !equalsIgnoreCase(transactionFrom, subjectAddress) &&
      equalsIgnoreCase(receivedTransfer.from, transactionFrom))
  ) {
    return receivedTransfer;
  }

  return undefined;
}

/**
 * Looks up the native asset for a chain, returning `undefined` instead of
 * throwing when the chain is outside the bridge swaps registry
 *
 * @param chainId - Hex, numeric, or CAIP chain id.
 * @returns The native asset metadata, or `undefined` if unsupported.
 */
export function getNativeAssetSafe(chainId: string | number) {
  try {
    return getNativeAssetForChainId(chainId);
  } catch {
    return undefined;
  }
}

const nativeTokenDecimals = 18;

function toNetworkFeeAmount(
  gasUsed: string | number | undefined,
  gasPrice: string | number | undefined,
): string | undefined {
  if (gasUsed === undefined || gasPrice === undefined) {
    return undefined;
  }

  try {
    return String(BigInt(gasUsed) * BigInt(gasPrice));
  } catch {
    return undefined;
  }
}

/**
 * Adds L1 / operator fee (hex wei) onto an L2 network fee (decimal wei string).
 * Prefers `layer1GasFee` (L1 data fee + operator fee from TransactionController)
 * over raw receipt `l1Fee` so Mantle operator fee is included when available.
 *
 * @param networkFeeAmount - L2 network fee amount in decimal wei.
 * @param layer1GasFee - Optional hex wei L1 + operator fee from TransactionMeta.
 * @param receiptL1Fee - Optional hex wei L1 fee from the transaction receipt.
 * @returns Combined fee amount in decimal wei, or the original L2 amount on failure.
 */
function addLayer1FeeToNetworkFeeAmount(
  networkFeeAmount: string,
  layer1GasFee: string | undefined,
  receiptL1Fee: string | undefined,
): string {
  const layer1OrL1Fee = layer1GasFee ?? receiptL1Fee;
  if (!layer1OrL1Fee) {
    return networkFeeAmount;
  }

  try {
    return String(BigInt(networkFeeAmount) + BigInt(layer1OrL1Fee));
  } catch {
    return networkFeeAmount;
  }
}

function buildBaseNetworkFee(
  amount: string,
  chainId: string | number,
): ActivityFee {
  const nativeAsset = getNativeAssetSafe(chainId);

  return {
    type: 'base',
    amount,
    ...(nativeAsset?.decimals === undefined
      ? { decimals: nativeTokenDecimals }
      : { decimals: nativeAsset.decimals }),
    ...(nativeAsset?.symbol ? { symbol: nativeAsset.symbol } : {}),
    ...(nativeAsset?.assetId ? { assetId: nativeAsset.assetId } : {}),
  };
}

function getNetworkFee(
  transaction: V1TransactionByHashResponse,
  chainId: string,
): ActivityFee | undefined {
  const amount = toNetworkFeeAmount(
    transaction.gasUsed,
    transaction.effectiveGasPrice,
  );

  return amount ? buildBaseNetworkFee(amount, chainId) : undefined;
}

export function getFees(
  transaction: V1TransactionByHashResponse,
  chainId: string,
): ActivityFee[] | undefined {
  const networkFee = getNetworkFee(transaction, chainId);

  return networkFee ? [networkFee] : undefined;
}

/**
 * Builds the base network fee (in the chain's native token) for a local
 * transaction from its receipt (`gasUsed × effectiveGasPrice`), plus any
 * L1 / operator fee from `layer1GasFee` or receipt `l1Fee`. Falls back to
 * `txParams.gasPrice` while pending.
 *
 * @param transactionGroup - Transaction group with the primary transaction.
 * @returns Activity fee list with a single base network fee, or undefined.
 */
export function getLocalTransactionFees(
  transactionGroup: Pick<TransactionGroup, 'primaryTransaction'>,
): ActivityFee[] | undefined {
  const { primaryTransaction } = transactionGroup;
  const l2Amount = toNetworkFeeAmount(
    primaryTransaction.txReceipt?.gasUsed,
    primaryTransaction.txReceipt?.effectiveGasPrice ??
      primaryTransaction.txParams?.gasPrice,
  );

  if (!l2Amount) {
    return undefined;
  }

  const amount = addLayer1FeeToNetworkFeeAmount(
    l2Amount,
    primaryTransaction.layer1GasFee,
    primaryTransaction.txReceipt?.l1Fee,
  );

  return [buildBaseNetworkFee(amount, primaryTransaction.chainId)];
}

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
    [
      ...Object.values(BRIDGE_CHAINID_TO_DEFAULT_FROM_TOKEN),
      ...Object.values(BRIDGE_CHAINID_COMMON_TOKEN_PAIR),
    ].find((token) => token?.assetId === assetId);

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

/**
 * Resolves the user's primary send and receive legs from indexed value transfers.
 * Prefers a receive whose symbol differs from the sent leg so dust does not win.
 *
 * @param valueTransfers - Indexed value transfers from the Accounts API.
 * @param subjectAddress - The account address to match transfers against.
 * @returns The primary sent and received transfers for the account.
 */
export function parseValueTransfers(
  valueTransfers: ValueTransfer[] | undefined,
  subjectAddress: string,
): {
  sentTransfer: ValueTransfer | undefined;
  receivedTransfer: ValueTransfer | undefined;
  sentNativeTransfer: ValueTransfer | undefined;
  sentNftTransfer: ValueTransfer | undefined;
  receivedNftTransfer: ValueTransfer | undefined;
} {
  const sent = valueTransfers?.filter(({ from }) =>
    equalsIgnoreCase(from, subjectAddress),
  );
  const received = valueTransfers?.filter(({ to }) =>
    equalsIgnoreCase(to, subjectAddress),
  );

  const sentTransfer = sent?.[0];

  const receivedTransfer =
    received?.find(({ symbol }) => symbol !== sentTransfer?.symbol) ??
    received?.[0];

  const sentNativeTransfer = sent?.find(
    ({ transferType }) => transferType === 'normal',
  );

  const sentNftTransfer = sent?.find(({ transferType }) =>
    isNftStandard(transferType),
  );
  const receivedNftTransfer = received?.find(({ transferType }) =>
    isNftStandard(transferType),
  );

  return {
    sentTransfer,
    receivedTransfer,
    sentNativeTransfer,
    sentNftTransfer,
    receivedNftTransfer,
  };
}

export function getTokenAmountFromTransfer(
  transfer: ValueTransfer | undefined,
  direction: TokenAmount['direction'],
  chainId: CaipChainId,
) {
  if (!transfer) {
    return undefined;
  }

  const { transferType, amount } = transfer;
  const isNftTransfer = isNftStandard(transferType);
  const symbol = isNftTransfer
    ? transfer.name || transfer.symbol
    : transfer.symbol;

  if (!symbol && amount === undefined) {
    return undefined;
  }

  const assetId =
    transfer && !isNftTransfer
      ? resolveAssetId(chainId, {
          contractAddress: transfer.contractAddress,
          transferType: transfer.transferType,
        })
      : undefined;

  const hasTransferAmount =
    !isNftTransfer && amount !== null && amount !== undefined;

  return {
    direction,
    ...(hasTransferAmount ? { amount: String(amount) } : {}),
    ...(transfer.decimal === undefined ? {} : { decimals: transfer.decimal }),
    ...(symbol ? { symbol } : {}),
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
