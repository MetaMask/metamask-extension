import { isMusdOnMoneyAccountChain } from '@metamask/money-account-utils';
import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { isEqualCaseInsensitive } from '../../../../shared/lib/string-utils';
import {
  isMoneyActivityDeposit,
  isMoneyActivityTransfer,
  isMusdErc20Transfer,
} from './money-activity-filters';
import { decodeErc20Transfer } from './erc20-transfer';

const VISIBLE_ACTIVITY_STATUSES: TransactionStatus[] = [
  TransactionStatus.confirmed,
  TransactionStatus.submitted,
  TransactionStatus.failed,
];

const PAY_HELD_STATUSES: TransactionStatus[] = [
  TransactionStatus.approved,
  TransactionStatus.signed,
];

function hasVisibleStatus(tx: TransactionMeta): boolean {
  return VISIBLE_ACTIVITY_STATUSES.includes(tx.status);
}

function isMoneyAccountTxVisible(tx: TransactionMeta): boolean {
  return hasVisibleStatus(tx) || PAY_HELD_STATUSES.includes(tx.status);
}

function isMoneyAccountTxType(tx: TransactionMeta): boolean {
  if (
    tx.type === TransactionType.moneyAccountDeposit ||
    tx.type === TransactionType.moneyAccountWithdraw
  ) {
    return true;
  }

  return (
    tx.nestedTransactions?.some(
      (nested) =>
        nested.type === TransactionType.moneyAccountDeposit ||
        nested.type === TransactionType.moneyAccountWithdraw,
    ) ?? false
  );
}

/**
 * Extracts the call's recipient from ERC-20 `transfer`/`transferFrom` calldata.
 * For both types, `txParams.to` is the token contract, not the recipient.
 *
 * @param tx - The transaction to inspect.
 * @returns The decoded recipient, or undefined when calldata is incomplete.
 */
function getErc20TransferRecipient(tx: TransactionMeta): string | undefined {
  return decodeErc20Transfer(tx.txParams?.data, tx.type)?.recipient;
}

/**
 * Whether a TransactionController row should appear in Money activity.
 *
 * Direct and nested Money Pay transactions surface as soon as they are
 * user-confirmed (`approved`/`signed` plus submitted/confirmed/failed).
 * Incoming mUSD and locally-signed ERC-20 transfers require a settled
 * visible status so mid-compose and aborted rows do not render as received.
 *
 * @param tx - Transaction to evaluate.
 * @param moneyAddress - Checksummed Money Account address, when known.
 * @returns Whether the transaction belongs on Money Home / Activity.
 */
export function isVisibleMoneyActivityTransaction(
  tx: TransactionMeta,
  moneyAddress: string | undefined,
): boolean {
  if (isMoneyAccountTxType(tx)) {
    return isMoneyAccountTxVisible(tx);
  }

  if (moneyAddress === undefined) {
    return false;
  }

  if (!hasVisibleStatus(tx)) {
    return false;
  }

  if (
    tx.type === TransactionType.incoming &&
    isMusdOnMoneyAccountChain(
      tx.transferInformation?.contractAddress,
      tx.chainId,
    ) &&
    isEqualCaseInsensitive(tx.txParams?.to ?? '', moneyAddress)
  ) {
    return true;
  }

  if (isMusdErc20Transfer(tx)) {
    const recipient = getErc20TransferRecipient(tx);
    if (
      recipient !== undefined &&
      isEqualCaseInsensitive(recipient, moneyAddress)
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Filters and newest-first sorts Money activity transactions.
 *
 * @param transactions - Non-replaced TransactionController rows.
 * @param moneyAddress - Checksummed Money Account address, when known.
 * @returns Visible Money transactions, newest first.
 */
export function filterMoneyAccountTransactions(
  transactions: TransactionMeta[],
  moneyAddress: string | undefined,
): TransactionMeta[] {
  return transactions
    .filter((tx) => isVisibleMoneyActivityTransaction(tx, moneyAddress))
    .sort((left, right) => (right.time ?? 0) - (left.time ?? 0));
}

export function splitMoneyAccountTransactions(
  transactions: TransactionMeta[],
): {
  deposits: TransactionMeta[];
  transfers: TransactionMeta[];
} {
  return {
    deposits: transactions.filter(isMoneyActivityDeposit),
    transfers: transactions.filter(isMoneyActivityTransfer),
  };
}
