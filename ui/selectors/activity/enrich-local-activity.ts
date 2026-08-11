import { TransactionType } from '@metamask/transaction-controller';
import type {
  ActivityListItem,
  TokenAmount,
} from '../../../shared/lib/activity/types';
import type { TransactionGroup } from '../../../shared/lib/multichain/types';
import { getFallbackNativeAssetId } from '../../../shared/lib/asset-utils';
import {
  parseApprovalTransactionData,
  parseStandardTokenTransactionData,
} from '../../../shared/lib/transaction.utils';
import { enrichLocalMusdClaimActivity } from './enrich-local-musd-claim';

// Token-bearing fields across the ActivityItem union (shared/lib/activity/types.ts).
const TOKEN_FIELDS = [
  'token',
  'sourceToken',
  'destinationToken',
  'paymentToken',
] as const;

/**
 * Backfills a missing native `assetId` using the activity's `chainId`. The
 * upstream mapper resolves native `assetId` via a SLIP44-by-symbol lookup
 * that misses many custom networks, even though `assetType: 'native'` is
 * still set correctly.
 *
 * @param activity - The activity item to backfill.
 * @returns The activity, patched (or the same reference if unchanged).
 */
function enrichNativeAssetIds(activity: ActivityListItem): ActivityListItem {
  const data = activity.data as Record<string, TokenAmount | undefined>;
  let changed = false;
  const patchedData: Record<string, TokenAmount> = {};

  for (const field of TOKEN_FIELDS) {
    const token = data[field];
    if (token && !token.assetId && token.assetType === 'native') {
      const assetId = getFallbackNativeAssetId(activity.chainId);
      if (assetId) {
        patchedData[field] = { ...token, assetId };
        changed = true;
      }
    }
  }

  if (!changed) {
    return activity;
  }

  return {
    ...activity,
    data: { ...activity.data, ...patchedData },
  } as ActivityListItem;
}

const TOKEN_TRANSFER_TYPES = new Set<TransactionType>([
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
  TransactionType.tokenMethodSafeTransferFrom,
]);

type LocalActivitySource = TransactionGroup & {
  contractTokenMetadata?: { symbol?: string; decimals?: number };
};

function enrichTokenTransferActivity(
  activity: ActivityListItem,
  transactionGroup: LocalActivitySource,
): ActivityListItem {
  if (activity.type !== 'send') {
    return activity;
  }

  const { type, txParams, transferInformation } =
    transactionGroup.initialTransaction;
  const data = txParams?.data;

  if (!type || !TOKEN_TRANSFER_TYPES.has(type) || !data) {
    return activity;
  }

  const transactionData = parseStandardTokenTransactionData(data);
  const recipient = transactionData?.args?._to ?? transactionData?.args?.to;
  const parsedAmount =
    transactionData?.args?._value ?? transactionData?.args?.value;
  let amount: string | undefined;
  if (
    transferInformation?.amount !== undefined &&
    transferInformation.amount !== null
  ) {
    amount = String(transferInformation.amount);
  } else if (parsedAmount !== undefined && parsedAmount !== null) {
    amount = parsedAmount.toString();
  }
  const symbol =
    transferInformation?.symbol ??
    transactionGroup.contractTokenMetadata?.symbol ??
    activity.data.token?.symbol;
  const decimals =
    transferInformation?.decimals ??
    transactionGroup.contractTokenMetadata?.decimals ??
    activity.data.token?.decimals;

  const nextTo =
    typeof recipient === 'string' && recipient !== activity.data.to
      ? recipient
      : activity.data.to;

  if (
    nextTo === activity.data.to &&
    amount === activity.data.token?.amount &&
    symbol === activity.data.token?.symbol &&
    decimals === activity.data.token?.decimals
  ) {
    return activity;
  }

  return {
    ...activity,
    data: {
      ...activity.data,
      to: nextTo,
      token: {
        direction: activity.data.token?.direction ?? 'out',
        ...(activity.data.token?.assetId
          ? { assetId: activity.data.token.assetId }
          : {}),
        ...(symbol ? { symbol } : {}),
        ...(decimals === undefined ? {} : { decimals }),
        ...(amount ? { amount } : {}),
      },
    },
  };
}

function enrichApprovalActivity(
  activity: ActivityListItem,
  transactionGroup: TransactionGroup,
): ActivityListItem {
  if (activity.type !== 'approveSpendingCap') {
    return activity;
  }

  const data = transactionGroup.initialTransaction.txParams?.data;
  if (!data) {
    return activity;
  }

  const approveData = parseApprovalTransactionData(data as `0x${string}`);
  const approveAmount = approveData?.amountOrTokenId?.toFixed(0);

  if (approveAmount !== '0') {
    return activity;
  }

  return {
    ...activity,
    type: 'revokeSpendingCap',
  };
}

export function enrichLocalActivity(
  activity: ActivityListItem,
  transactionGroup: LocalActivitySource,
): ActivityListItem {
  let next = activity;
  next = enrichTokenTransferActivity(next, transactionGroup);
  next = enrichApprovalActivity(next, transactionGroup);
  next = enrichLocalMusdClaimActivity(next, transactionGroup);
  next = enrichNativeAssetIds(next);
  return next;
}
