import { isMusdOnMoneyAccountChain } from '@metamask/money-account-utils';
import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { isMoneyAccountTx } from '../../../helpers/money/money-transaction-guards';
import { isEqualCaseInsensitive } from '../../../../shared/lib/string-utils';
import {
  isEphemeralFailedTransaction,
  resolveMoneyTransactionType,
} from './classify-money-activity';
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

function moneyPayTypeFromParent(
  parent: TransactionMeta,
): TransactionType.moneyAccountDeposit | TransactionType.moneyAccountWithdraw {
  return resolveMoneyTransactionType(parent) ===
    TransactionType.moneyAccountWithdraw
    ? TransactionType.moneyAccountWithdraw
    : TransactionType.moneyAccountDeposit;
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
 * Local RPC/relayer `failed` rows with no on-chain revert are hidden; a
 * later confirmed Pay tx is the one that should render.
 *
 * @param tx - Transaction to evaluate.
 * @param moneyAddress - Checksummed Money Account address, when known.
 * @returns Whether the transaction belongs on Money Home / Activity.
 */
export function isVisibleMoneyActivityTransaction(
  tx: TransactionMeta,
  moneyAddress: string | undefined,
): boolean {
  if (isMoneyAccountTx(tx)) {
    if (isEphemeralFailedTransaction(tx)) {
      return false;
    }
    return isMoneyAccountTxVisible(tx);
  }

  if (moneyAddress === undefined) {
    return false;
  }

  if (!hasVisibleStatus(tx) || isEphemeralFailedTransaction(tx)) {
    return false;
  }

  if (
    tx.metamaskPay &&
    isEqualCaseInsensitive(tx.txParams?.from ?? '', moneyAddress)
  ) {
    return true;
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
 * Presents a confirmed Pay child as its failed Money parent's row: the
 * parent's type, pay metadata and committed mUSD amount, the child's id,
 * hash, status and time.
 *
 * @param child - Confirmed required/batch child of the parent.
 * @param parent - Ephemerally failed Money Pay parent.
 * @returns The child re-typed as a Money deposit/withdraw row.
 */
function promoteChildToParentRow(
  child: TransactionMeta,
  parent: TransactionMeta,
): TransactionMeta {
  const promoted: TransactionMeta = {
    ...child,
    type: moneyPayTypeFromParent(parent),
  };
  const metamaskPay = parent.metamaskPay ?? child.metamaskPay;
  if (metamaskPay) {
    promoted.metamaskPay = metamaskPay;
  }
  const requiredAssets = parent.requiredAssets ?? child.requiredAssets;
  if (requiredAssets) {
    promoted.requiredAssets = requiredAssets;
  }
  return promoted;
}

/**
 * Filters and newest-first sorts Money activity transactions.
 *
 * When a Money Pay row failed locally (no on-chain revert) and Pay confirmed
 * its required source txs instead, the newest confirmed child is shown as a
 * single row with the parent's deposit/withdraw type and pay metadata so Home
 * renders one real deposit rather than a $0 "failed" placeholder or one row
 * per source leg.
 *
 * @param transactions - Non-replaced TransactionController rows.
 * @param moneyAddress - Checksummed Money Account address, when known.
 * @returns Visible Money transactions, newest first.
 */
export function filterMoneyAccountTransactions(
  transactions: TransactionMeta[],
  moneyAddress: string | undefined,
): TransactionMeta[] {
  const parentByRequiredId = new Map<string, TransactionMeta>();
  const parentByBatchId = new Map<string, TransactionMeta>();
  for (const parent of transactions) {
    if (!isMoneyAccountTx(parent) || !isEphemeralFailedTransaction(parent)) {
      continue;
    }
    for (const requiredId of parent.requiredTransactionIds ?? []) {
      parentByRequiredId.set(requiredId, parent);
    }
    if (parent.batchId) {
      parentByBatchId.set(parent.batchId.toLowerCase(), parent);
    }
  }

  const visible: TransactionMeta[] = [];
  const promotedChildByParentId = new Map<
    string,
    { child: TransactionMeta; parent: TransactionMeta }
  >();

  for (const tx of transactions) {
    if (isVisibleMoneyActivityTransaction(tx, moneyAddress)) {
      visible.push(tx);
      continue;
    }

    const parent =
      parentByRequiredId.get(tx.id) ??
      (tx.batchId ? parentByBatchId.get(tx.batchId.toLowerCase()) : undefined);
    if (
      !parent ||
      parent.id === tx.id ||
      !hasVisibleStatus(tx) ||
      isEphemeralFailedTransaction(tx)
    ) {
      continue;
    }

    const current = promotedChildByParentId.get(parent.id);
    if (!current || (tx.time ?? 0) > (current.child.time ?? 0)) {
      promotedChildByParentId.set(parent.id, { child: tx, parent });
    }
  }

  const promoted = [...promotedChildByParentId.values()].map(
    ({ child, parent }) => promoteChildToParentRow(child, parent),
  );

  return [...visible, ...promoted].sort(
    (left, right) => (right.time ?? 0) - (left.time ?? 0),
  );
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
