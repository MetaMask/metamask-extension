import {
  type TransactionMeta,
  TransactionType,
} from '@metamask/transaction-controller';
import { isMusdOnMoneyAccountChain } from '@metamask/money-account-utils';
import {
  isMoneyDepositTx,
  isMoneyWithdrawTx,
} from '../../../helpers/money/money-transaction-guards';
import {
  isOnchainMoneyActivityItem,
  type MoneyActivityItem,
} from '../types/money-activity';

/**
 * Filter chips on the Money Activity page. Values match mobile; the
 * transfers chip is labeled "Sends".
 */
export enum MoneyActivityFilter {
  All = 'all',
  Deposits = 'deposits',
  Transfers = 'transfers',
}

export type MoneyActivityBuckets = Record<
  MoneyActivityFilter,
  MoneyActivityItem[]
>;

export const ERC20_TRANSFER_TYPES: TransactionType[] = [
  TransactionType.tokenMethodTransfer,
  TransactionType.tokenMethodTransferFrom,
];

/**
 * True when the transaction is an ERC-20 transfer of mUSD on a chain where
 * the Money Account is active. `transferInformation` is only populated by
 * incoming-transaction polling; for locally-signed sends we fall back to
 * `txParams.to`, which for ERC-20 transfer types is the token contract.
 *
 * @param tx - Transaction to inspect.
 * @returns Whether the row is an mUSD ERC-20 transfer on a Money Account chain.
 */
export function isMusdErc20Transfer(tx: TransactionMeta): boolean {
  if (!tx.type || !ERC20_TRANSFER_TYPES.includes(tx.type)) {
    return false;
  }
  return (
    isMusdOnMoneyAccountChain(
      tx.transferInformation?.contractAddress,
      tx.chainId,
    ) || isMusdOnMoneyAccountChain(tx.txParams?.to, tx.chainId)
  );
}

export function isMoneyActivityDeposit(tx: TransactionMeta): boolean {
  return (
    isMoneyDepositTx(tx) ||
    tx.type === TransactionType.incoming ||
    // Same received types as classifyMoneyActivity, so ERC-20 receives
    // stay in All / Deposits instead of vanishing off the Activity page.
    (tx.type !== undefined && ERC20_TRANSFER_TYPES.includes(tx.type))
  );
}

export function isMoneyActivityTransfer(tx: TransactionMeta): boolean {
  return isMoneyWithdrawTx(tx) || tx.type === TransactionType.simpleSend;
}

/**
 * Splits on-chain activity into All / Deposits / Sends buckets.
 *
 * `items` is already visibility-filtered (Money Pay deposits, sends, and
 * incoming mUSD, plus any Accounts API rows). All keeps that full list.
 * Deposits and Sends are on-chain-only chips; a confirmed Pay tx from the
 * Money Account can be visible without matching either chip type, and must
 * still appear on Home / All.
 *
 * @param items - Newest-first activity items.
 * @returns Filter buckets.
 */
export function buildMoneyActivityBuckets(
  items: MoneyActivityItem[],
): MoneyActivityBuckets {
  return {
    [MoneyActivityFilter.All]: items,
    [MoneyActivityFilter.Deposits]: items.filter(
      (item) =>
        isOnchainMoneyActivityItem(item) && isMoneyActivityDeposit(item.tx),
    ),
    [MoneyActivityFilter.Transfers]: items.filter(
      (item) =>
        isOnchainMoneyActivityItem(item) && isMoneyActivityTransfer(item.tx),
    ),
  };
}

export const EMPTY_MONEY_ACTIVITY_BUCKETS: MoneyActivityBuckets = {
  [MoneyActivityFilter.All]: [],
  [MoneyActivityFilter.Deposits]: [],
  [MoneyActivityFilter.Transfers]: [],
};
