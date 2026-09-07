import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { IconName } from '@metamask/design-system-react';
import { isMusdToken } from '../../../components/app/musd/constants';
import type {
  MoneyActivityTitleKey,
  MoneyActivityTransactionMeta,
} from '../constants/mock-activity-data';

export type MoneyActivityStatus = 'pending' | 'confirmed' | 'failed';

export type MoneyActivityKind = 'deposited' | 'received' | 'converted' | 'sent';

const ON_CHAIN_REVERT_RECEIPT_STATUS = '0x0';
const ON_CHAIN_SUCCESS_RECEIPT_STATUSES = new Set(['0x1', '0x01']);

function receiptStatus(tx: TransactionMeta): string | undefined {
  const status = tx.txReceipt?.status;
  return typeof status === 'string' || typeof status === 'number'
    ? String(status)
    : undefined;
}

/**
 * True when the transaction reverted on-chain. Wallet activity uses the same
 * `txReceipt.status === '0x0'` check; TransactionController `failed` alone
 * can also mean a local RPC/relayer error that never consumed a nonce.
 *
 * @param tx - Transaction metadata.
 * @returns Whether the receipt reports an on-chain revert.
 */
export function isOnChainRevertedTransaction(tx: TransactionMeta): boolean {
  return receiptStatus(tx) === ON_CHAIN_REVERT_RECEIPT_STATUS;
}

/**
 * True when TransactionController marked the tx `failed` without an on-chain
 * revert or successful receipt. These are local-only failures; a later
 * confirmed Pay/7702 tx often reuses the nonce and is the row to show.
 *
 * @param tx - Transaction metadata.
 * @returns Whether this is an off-chain failure that should not surface.
 */
export function isEphemeralFailedTransaction(tx: TransactionMeta): boolean {
  if (tx.status !== TransactionStatus.failed) {
    return false;
  }
  const status = receiptStatus(tx);
  if (status === ON_CHAIN_REVERT_RECEIPT_STATUS) {
    return false;
  }
  if (status && ON_CHAIN_SUCCESS_RECEIPT_STATUSES.has(status)) {
    return false;
  }
  return true;
}

export function getMoneyActivityStatus(
  tx: TransactionMeta,
): MoneyActivityStatus {
  if (isOnChainRevertedTransaction(tx)) {
    return 'failed';
  }
  const status = receiptStatus(tx);
  if (status && ON_CHAIN_SUCCESS_RECEIPT_STATUSES.has(status)) {
    return 'confirmed';
  }

  switch (tx.status) {
    case TransactionStatus.unapproved:
    case TransactionStatus.approved:
    case TransactionStatus.signed:
    case TransactionStatus.submitted:
      return 'pending';
    case TransactionStatus.failed:
    case TransactionStatus.dropped:
    case TransactionStatus.rejected:
    case TransactionStatus.cancelled:
      return 'failed';
    case TransactionStatus.confirmed:
      return 'confirmed';
    default:
      return 'pending';
  }
}

const TITLE_KEY_TO_KIND: Record<MoneyActivityTitleKey, MoneyActivityKind> = {
  deposited: 'deposited',
  received: 'received',
  converted: 'converted',
  sent: 'sent',
};

/**
 * Effective Money Pay type, unwrapping EIP-7702 / contract-interaction
 * parents whose deposit or withdraw lives on a nested call.
 *
 * @param tx - Transaction metadata.
 * @returns Nested money type when present, otherwise the top-level type.
 */
export function resolveMoneyTransactionType(
  tx: TransactionMeta,
): TransactionType | undefined {
  const nestedMoneyType = tx.nestedTransactions?.find(
    (nested) =>
      nested.type === TransactionType.moneyAccountDeposit ||
      nested.type === TransactionType.moneyAccountWithdraw,
  )?.type;
  if (nestedMoneyType) {
    return nestedMoneyType;
  }
  return tx.type;
}

function isFiatDeposit(tx: TransactionMeta): boolean {
  return Boolean(tx.metamaskPay?.fiat);
}

function isMusdPayToken(tx: TransactionMeta): boolean {
  return isMusdToken(tx.metamaskPay?.tokenAddress);
}

export function classifyMoneyActivity(tx: TransactionMeta): MoneyActivityKind {
  const { moneyActivityTitleKey } = tx as MoneyActivityTransactionMeta;
  if (moneyActivityTitleKey) {
    return TITLE_KEY_TO_KIND[moneyActivityTitleKey] ?? 'received';
  }

  const type = resolveMoneyTransactionType(tx);
  if (!type) {
    return 'deposited';
  }

  switch (type) {
    case TransactionType.moneyAccountDeposit:
      if (isFiatDeposit(tx) || isMusdPayToken(tx)) {
        return 'deposited';
      }
      return 'converted';
    case TransactionType.incoming:
    case TransactionType.tokenMethodTransfer:
    case TransactionType.tokenMethodTransferFrom:
      return 'received';
    case TransactionType.moneyAccountWithdraw:
    case TransactionType.simpleSend:
      return 'sent';
    default:
      return 'received';
  }
}

const KIND_LABEL_KEY: Record<MoneyActivityKind, string> = {
  deposited: 'moneyActivityDeposited',
  received: 'moneyActivityReceived',
  converted: 'moneyActivityConverted',
  sent: 'moneyActivitySent',
};

const KIND_PENDING_LABEL_KEY: Partial<Record<MoneyActivityKind, string>> = {
  deposited: 'moneyActivityDepositing',
  converted: 'moneyActivityConverting',
  sent: 'moneyActivitySending',
  received: 'moneyActivityReceiving',
};

const KIND_FAILED_LABEL_KEY: Partial<Record<MoneyActivityKind, string>> = {
  deposited: 'moneyActivityDepositFailed',
  converted: 'moneyActivityConversionFailed',
  sent: 'moneyActivitySendFailed',
};

export function moneyActivityLabelKey(
  kind: MoneyActivityKind,
  status: MoneyActivityStatus,
): string {
  if (status === 'pending') {
    return KIND_PENDING_LABEL_KEY[kind] ?? KIND_LABEL_KEY[kind];
  }
  if (status === 'failed') {
    return KIND_FAILED_LABEL_KEY[kind] ?? KIND_LABEL_KEY[kind];
  }
  return KIND_LABEL_KEY[kind];
}

export function moneyActivityKindToIcon(kind: MoneyActivityKind): IconName {
  switch (kind) {
    case 'deposited':
      return IconName.Add;
    case 'received':
      return IconName.Arrow2Down;
    case 'converted':
      return IconName.Refresh;
    case 'sent':
      return IconName.SwapHorizontal;
    default:
      return IconName.Arrow2Down;
  }
}

export function isIncomingMoneyActivityKind(kind: MoneyActivityKind): boolean {
  return kind !== 'sent';
}
