import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { selectTransactionById } from '../../../selectors/transactionController';
import { getInternalAccountByAddress } from '../../../selectors/accounts';
import { getAccountGroupsByAddress } from '../../../selectors/multichain-accounts/account-tree';
import type { MultichainAccountsState } from '../../../selectors/multichain-accounts/account-tree.types';
import type { MetaMaskReduxState } from '../../../store/store';
import type {
  ActivityListItem,
  MoneyAccountActivityItem,
} from '../../../../shared/lib/activity/types';
import {
  clearMoneyAccountDepositIntent,
  getMoneyAccountDepositIntent,
  type MoneyAccountDepositIntent,
} from '../../../helpers/money/deposit-intent';
import { resolveMoneyDepositIntent } from '../../../helpers/money/money-transaction-guards';
import { moneyFormatUsd } from '../../../helpers/money/format';
import { getMoneyAccountWithdrawTransferDetails } from '../../../pages/confirmations/utils/money-account-withdraw';
import { shortenAddress } from '../../../helpers/utils/util';
import type { ToastStatus } from './shared';

type ToastLabel = { title: string; description?: string };
type TranslateFn = ReturnType<typeof useI18nContext>;

const NO_ACCOUNT_GROUPS: ReturnType<typeof getAccountGroupsByAddress> = [];

type DepositToastKeys = {
  inProgressTitle: string;
  inProgressDescription: string;
  successTitle: string;
  failedTitle: string;
  failedDescription: string;
};

const depositToastKeys: Record<MoneyAccountDepositIntent, DepositToastKeys> = {
  convert: {
    inProgressTitle: 'moneyToastDepositInProgressTitleConvert',
    inProgressDescription: 'moneyToastInProgressDescription',
    successTitle: 'moneyToastDepositSuccessTitleConvert',
    failedTitle: 'moneyToastDepositFailedTitleConvert',
    failedDescription: 'moneyToastDepositFailedDescriptionConvert',
  },
  addMusd: {
    inProgressTitle: 'moneyToastDepositInProgressTitleAddMusd',
    inProgressDescription: 'moneyToastInProgressDescription',
    successTitle: 'moneyToastDepositSuccessTitleAddMusd',
    failedTitle: 'moneyToastDepositFailedTitleAddMusd',
    failedDescription: 'moneyToastDepositFailedDescriptionAddMusd',
  },
  card: {
    inProgressTitle: 'moneyToastDepositInProgressTitleCard',
    inProgressDescription: 'moneyToastDepositInProgressDescriptionCard',
    successTitle: 'moneyToastDepositSuccessTitleCard',
    failedTitle: 'moneyToastDepositFailedTitleCard',
    failedDescription: 'moneyToastDepositFailedDescriptionAddMusd',
  },
};

function isMoneyAccountItem(
  item: ActivityListItem | undefined,
): item is MoneyAccountActivityItem {
  return (
    item?.type === 'moneyAccountDeposit' ||
    item?.type === 'moneyAccountWithdraw'
  );
}

function formatFiat(item: MoneyAccountActivityItem): string | undefined {
  const amount = item.data.fiat?.amount;
  return amount === undefined
    ? undefined
    : moneyFormatUsd(new BigNumber(amount)) || undefined;
}

function getDepositLabel(
  status: ToastStatus,
  item: MoneyAccountActivityItem,
  intent: MoneyAccountDepositIntent,
  t: TranslateFn,
): ToastLabel {
  const keys = depositToastKeys[intent];

  if (status === 'pending') {
    return {
      title: t(keys.inProgressTitle),
      description: t(keys.inProgressDescription),
    };
  }

  if (status === 'failed') {
    return {
      title: t(keys.failedTitle),
      description: t(keys.failedDescription),
    };
  }

  const amountFiat = formatFiat(item);
  return {
    title: t(keys.successTitle),
    description: amountFiat
      ? t('moneyToastDepositSuccessDescription', [amountFiat])
      : t('moneyToastDepositSuccessDescriptionNoAmount'),
  };
}

function getWithdrawLabel(
  status: ToastStatus,
  item: MoneyAccountActivityItem,
  destination: string | undefined,
  t: TranslateFn,
): ToastLabel {
  if (status === 'pending') {
    return {
      title: t('moneyToastWithdrawInProgressTitle'),
      description: t('moneyToastInProgressDescription'),
    };
  }

  if (status === 'failed') {
    return {
      title: t('moneyToastWithdrawFailedTitle'),
      description: t('moneyToastWithdrawFailedDescription'),
    };
  }

  const amountFiat = formatFiat(item);
  const resolvedDestination =
    destination ?? t('moneyToastWithdrawFallbackDestination');
  return {
    title: t('moneyToastWithdrawSuccessTitle'),
    description: amountFiat
      ? t('moneyToastWithdrawSuccessDescription', [
          amountFiat,
          resolvedDestination,
        ])
      : t('moneyToastWithdrawSuccessDescriptionNoAmount', [
          resolvedDestination,
        ]),
  };
}

function useWithdrawDestination(
  recipient: string | undefined,
): string | undefined {
  const account = useSelector((state: MetaMaskReduxState) =>
    recipient ? getInternalAccountByAddress(state, recipient) : undefined,
  );
  const groups = useSelector((state: MultichainAccountsState) =>
    recipient && account
      ? getAccountGroupsByAddress(state, [recipient])
      : NO_ACCOUNT_GROUPS,
  );

  if (!recipient) {
    return undefined;
  }
  if (!account) {
    return shortenAddress(recipient);
  }
  return (
    groups[0]?.metadata?.name?.trim() ||
    account.metadata?.name?.trim() ||
    undefined
  );
}

function useDepositIntent(
  isDeposit: boolean,
  status: ToastStatus,
  transactionMeta: TransactionMeta | undefined,
): MoneyAccountDepositIntent {
  const batchId = transactionMeta?.batchId;

  // Memoised so the terminal toast keeps the recorded intent after the effect
  // below clears it; the fallback derivation only applies to later updates.
  const intent = useMemo(() => {
    if (!isDeposit) {
      return 'convert';
    }
    return (
      getMoneyAccountDepositIntent(batchId) ??
      (transactionMeta ? resolveMoneyDepositIntent(transactionMeta) : 'convert')
    );
  }, [isDeposit, batchId, transactionMeta]);

  useEffect(() => {
    if (isDeposit && status !== 'pending') {
      clearMoneyAccountDepositIntent(batchId);
    }
  }, [isDeposit, status, batchId]);

  return intent;
}

/**
 * Toast copy for money account deposits and withdrawals, mirroring mobile's
 * money toasts. Returns undefined for every other activity item.
 *
 * @param status - Toast status.
 * @param item - Activity item resolved for the toast's transaction.
 * @param transactionId - Transaction id the toast was raised for.
 */
export function useMoneyAccountToastLabel(
  status: ToastStatus,
  item: ActivityListItem | undefined,
  transactionId: string | undefined,
): ToastLabel | undefined {
  const t = useI18nContext();
  const moneyItem = isMoneyAccountItem(item) ? item : undefined;
  const transactionMeta = useSelector((state: MetaMaskReduxState) =>
    moneyItem ? selectTransactionById(state, transactionId) : undefined,
  );

  const isDeposit = moneyItem?.type === 'moneyAccountDeposit';
  const intent = useDepositIntent(isDeposit, status, transactionMeta);
  const destination = useWithdrawDestination(
    moneyItem && !isDeposit
      ? getMoneyAccountWithdrawTransferDetails(transactionMeta).recipient
      : undefined,
  );

  if (!moneyItem) {
    return undefined;
  }
  return isDeposit
    ? getDepositLabel(status, moneyItem, intent, t)
    : getWithdrawLabel(status, moneyItem, destination, t);
}
