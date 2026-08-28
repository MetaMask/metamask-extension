import {
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { IconName } from '@metamask/design-system-react';
import { MUSD_TOKEN_ADDRESS } from '../../../components/app/musd/constants';
import type {
  MoneyActivityTitleKey,
  MoneyActivityTransactionMeta,
} from '../constants/mock-activity-data';

export type MoneyActivityStatus = 'pending' | 'confirmed' | 'failed';

export type MoneyActivityKind = 'deposited' | 'received' | 'converted' | 'sent';

export function getMoneyActivityStatus(
  tx: TransactionMeta,
): MoneyActivityStatus {
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

function resolveMoneyTransactionType(
  tx: TransactionMeta,
): TransactionType | undefined {
  if (tx.type === TransactionType.batch) {
    const nestedMoneyType = tx.nestedTransactions?.find(
      (nested) =>
        nested.type === TransactionType.moneyAccountDeposit ||
        nested.type === TransactionType.moneyAccountWithdraw,
    )?.type;
    if (nestedMoneyType) {
      return nestedMoneyType;
    }
  }
  return tx.type;
}

function isFiatDeposit(tx: TransactionMeta): boolean {
  return Boolean(tx.metamaskPay?.fiat);
}

function isMusdPayToken(tx: TransactionMeta): boolean {
  const tokenAddress = tx.metamaskPay?.tokenAddress;
  return (
    typeof tokenAddress === 'string' &&
    tokenAddress.toLowerCase() === MUSD_TOKEN_ADDRESS.toLowerCase()
  );
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
