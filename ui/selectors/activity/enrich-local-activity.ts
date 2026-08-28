import {
  MUSD_DECIMALS,
  MUSD_TOKEN,
  MUSD_TOKEN_ASSET_ID_BY_CHAIN,
} from '@metamask/money-account-utils';
import { TransactionType } from '@metamask/transaction-controller';
import { KnownCaipNamespace, toCaipChainId } from '@metamask/utils';
import type { ActivityListItem } from '../../../shared/lib/activity/types';
import { toAssetId } from '../../../shared/lib/asset-utils';
import type { TransactionGroup } from '../../../shared/lib/multichain/types';
import {
  parseApprovalTransactionData,
  parseStandardTokenTransactionData,
} from '../../../shared/lib/transaction.utils';
import { hasTransactionType } from '../../../shared/lib/transactions.utils';
import { enrichLocalMusdClaimActivity } from './enrich-local-musd-claim';

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

function enrichMoneyAccountWithdrawActivity(
  activity: ActivityListItem,
  transactionGroup: LocalActivitySource,
): ActivityListItem {
  const transaction = transactionGroup.initialTransaction;
  if (
    !hasTransactionType(transaction, [TransactionType.moneyAccountWithdraw])
  ) {
    return activity;
  }

  const transfer = transaction.nestedTransactions?.find(
    (nested) => nested.type === TransactionType.tokenMethodTransfer,
  );
  const parsed = transfer?.data
    ? parseStandardTokenTransactionData(transfer.data)
    : undefined;
  const recipient = parsed?.args?._to ?? parsed?.args?.to;
  if (typeof recipient !== 'string') {
    return activity;
  }

  const parsedAmount = parsed?.args?._value ?? parsed?.args?.value;
  const amount =
    parsedAmount === undefined || parsedAmount === null
      ? undefined
      : parsedAmount.toString();
  const tokenAddress = transfer?.to;
  const { chainId } = transaction;
  const assetId =
    (chainId ? MUSD_TOKEN_ASSET_ID_BY_CHAIN[chainId] : undefined) ??
    (tokenAddress && chainId
      ? toAssetId(
          tokenAddress,
          toCaipChainId(
            KnownCaipNamespace.Eip155,
            Number.parseInt(chainId, 16).toString(),
          ),
        )
      : undefined);

  return {
    ...activity,
    type: 'send',
    data: {
      from: transaction.txParams?.from ?? '',
      to: recipient,
      token: {
        direction: 'out',
        symbol: MUSD_TOKEN.symbol,
        decimals: MUSD_DECIMALS,
        ...(amount ? { amount } : {}),
        ...(assetId ? { assetId } : {}),
      },
    },
  };
}

export function enrichLocalActivity(
  activity: ActivityListItem,
  transactionGroup: LocalActivitySource,
): ActivityListItem {
  let next = activity;
  next = enrichMoneyAccountWithdrawActivity(next, transactionGroup);
  next = enrichTokenTransferActivity(next, transactionGroup);
  next = enrichApprovalActivity(next, transactionGroup);
  next = enrichLocalMusdClaimActivity(next, transactionGroup);
  return next;
}
