import {
  isMusdToken,
  MUSD_DECIMALS,
  MUSD_TOKEN,
  MUSD_TOKEN_ASSET_ID_BY_CHAIN,
} from '@metamask/money-account-utils';
import { TransactionType } from '@metamask/transaction-controller';
import type {
  ActivityListItem,
  FiatAmount,
  MoneyAccountActivityKind,
  TokenAmount,
} from '../../../shared/lib/activity/types';
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

/**
 * Resolves the raw mUSD amount of a money-account deposit batch. The amount
 * is committed at approval into both the mUSD `requiredAssets` entry and the
 * nested approve calldata; the placeholder batch holds zero in both, in
 * which case no amount is shown yet.
 *
 * @param transaction - The deposit batch transaction.
 * @returns Raw mUSD amount in base units, or undefined when not committed.
 */
function getMoneyAccountDepositAmount(
  transaction: TransactionGroup['initialTransaction'],
): string | undefined {
  const requiredAmount = transaction.requiredAssets?.find(({ address }) =>
    isMusdToken(address),
  )?.amount;
  if (requiredAmount && BigInt(requiredAmount) > 0n) {
    return BigInt(requiredAmount).toString();
  }

  const approve = transaction.nestedTransactions?.find(
    (nested) => nested.type === TransactionType.tokenMethodApprove,
  );
  const approveAmount = approve?.data
    ? parseApprovalTransactionData(approve.data)?.amountOrTokenId?.toFixed(0)
    : undefined;

  return approveAmount && approveAmount !== '0' ? approveAmount : undefined;
}

/**
 * Resolves the raw mUSD amount of a money-account withdraw batch from the
 * nested mUSD transfer calldata. Empty while the batch is a placeholder —
 * the amount is only encoded at approval.
 *
 * @param transaction - The withdraw batch transaction.
 * @returns Raw mUSD amount in base units, or undefined when not committed.
 */
function getMoneyAccountWithdrawAmount(
  transaction: TransactionGroup['initialTransaction'],
): string | undefined {
  const transfer = transaction.nestedTransactions?.find(
    (nested) => nested.type === TransactionType.tokenMethodTransfer,
  );
  const parsed = transfer?.data
    ? parseStandardTokenTransactionData(transfer.data)
    : undefined;
  const parsedAmount = parsed?.args?._value ?? parsed?.args?.value;

  return parsedAmount === undefined || parsedAmount === null
    ? undefined
    : parsedAmount.toString();
}

/**
 * Converts a raw mUSD amount to the fiat amount activity rows display,
 * falling back to MM Pay's quoted target fiat. mUSD is pegged 1:1 to USD.
 *
 * @param amountRaw - Raw mUSD amount in base units.
 * @param transaction - The money-account transaction, for the Pay fallback.
 * @returns The fiat amount, or undefined when no amount is known yet.
 */
function toMusdFiat(
  amountRaw: string | undefined,
  transaction: TransactionGroup['initialTransaction'],
): FiatAmount | undefined {
  if (amountRaw) {
    return { amount: (Number(amountRaw) / 10 ** MUSD_DECIMALS).toString() };
  }

  const targetFiat = transaction.metamaskPay?.targetFiat;
  return targetFiat ? { amount: targetFiat } : undefined;
}

/**
 * Maps money-account deposit and withdraw batches to their dedicated
 * activity kinds. `mapLocalTransaction` only reads the top-level type, so
 * these EIP-7702 batches arrive as `contractInteraction`; the meaningful
 * type sits on a nested transaction. Rendered like the other MM Pay rows
 * (perps): a fiat amount against the Money account, mirroring mobile's
 * money activity rows.
 *
 * @param activity - Activity item from `mapLocalTransaction`.
 * @param transactionGroup - Source local transaction group.
 * @returns Activity item mapped to a money-account kind when applicable.
 */
function enrichMoneyAccountActivity(
  activity: ActivityListItem,
  transactionGroup: LocalActivitySource,
): ActivityListItem {
  const transaction = transactionGroup.initialTransaction;
  const isDeposit = hasTransactionType(transaction, [
    TransactionType.moneyAccountDeposit,
  ]);
  const isWithdraw =
    !isDeposit &&
    hasTransactionType(transaction, [TransactionType.moneyAccountWithdraw]);

  if (!isDeposit && !isWithdraw) {
    return activity;
  }

  const type: MoneyAccountActivityKind = isDeposit
    ? 'moneyAccountDeposit'
    : 'moneyAccountWithdraw';
  const amount = isDeposit
    ? getMoneyAccountDepositAmount(transaction)
    : getMoneyAccountWithdrawAmount(transaction);
  const { chainId } = transaction;
  const assetId = chainId ? MUSD_TOKEN_ASSET_ID_BY_CHAIN[chainId] : undefined;
  const token: TokenAmount = {
    direction: isDeposit ? 'in' : 'out',
    symbol: MUSD_TOKEN.symbol,
    decimals: MUSD_DECIMALS,
    ...(amount ? { amount } : {}),
    ...(assetId ? { assetId } : {}),
  };
  const fiat = toMusdFiat(amount, transaction);

  return {
    ...activity,
    type,
    data: {
      from: transaction.txParams?.from ?? '',
      ...(fiat ? { fiat } : {}),
      token,
    },
  };
}

export function enrichLocalActivity(
  activity: ActivityListItem,
  transactionGroup: LocalActivitySource,
): ActivityListItem {
  let next = activity;
  next = enrichMoneyAccountActivity(next, transactionGroup);
  next = enrichTokenTransferActivity(next, transactionGroup);
  next = enrichApprovalActivity(next, transactionGroup);
  next = enrichLocalMusdClaimActivity(next, transactionGroup);
  return next;
}
