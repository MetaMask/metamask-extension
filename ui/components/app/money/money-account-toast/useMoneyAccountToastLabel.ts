import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { BigNumber } from 'bignumber.js';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { selectTransactionById } from '../../../../selectors/transactionController';
import { getInternalAccountByAddress } from '../../../../selectors/accounts';
import { getAccountGroupsByAddress } from '../../../../selectors/multichain-accounts/account-tree';
import type { MultichainAccountsState } from '../../../../selectors/multichain-accounts/account-tree.types';
import { getMoneyAccountFiatAmount } from '../../../../selectors/activity/enrich-local-activity';
import type { MetaMaskReduxState } from '../../../../store/store';
import type { MoneyAccountDepositIntent } from '../../../../helpers/money/deposit-intent';
import {
  isMoneyDepositTx,
  isMoneyWithdrawTx,
  resolveMoneyDepositIntent,
} from '../../../../helpers/money/money-transaction-guards';
import { moneyFormatUsd } from '../../../../helpers/money/format';
import { getMoneyAccountWithdrawTransferDetails } from '../../../../pages/confirmations/utils/money-account-withdraw';
import { shortenAddress } from '../../../../helpers/utils/util';
import type { ToastStatus } from '../../toast-listener/shared';

export type ToastLabel = { title: string; description?: string };
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
    failedDescription: 'moneyToastDepositFailedBodyConvert',
  },
  addMusd: {
    inProgressTitle: 'moneyToastDepositInProgressTitleAddMusd',
    inProgressDescription: 'moneyToastInProgressDescription',
    successTitle: 'moneyToastDepositSuccessTitleAddMusd',
    failedTitle: 'moneyToastDepositFailedTitleAddMusd',
    failedDescription: 'moneyToastDepositFailedBody',
  },
  card: {
    inProgressTitle: 'moneyToastDepositInProgressTitleCard',
    inProgressDescription: 'moneyToastDepositInProgressDescriptionCard',
    successTitle: 'moneyToastDepositSuccessTitleCard',
    failedTitle: 'moneyToastDepositFailedTitle',
    failedDescription: 'moneyToastDepositFailedBody',
  },
};

function formatFiat(
  transactionMeta: TransactionMeta,
  isDeposit: boolean,
): string | undefined {
  const amount = getMoneyAccountFiatAmount(transactionMeta, isDeposit);
  return amount === undefined
    ? undefined
    : moneyFormatUsd(new BigNumber(amount)) || undefined;
}

function getDepositLabel(
  status: ToastStatus,
  transactionMeta: TransactionMeta,
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

  const amountFiat = formatFiat(transactionMeta, true);
  return {
    title: t(keys.successTitle),
    description: amountFiat
      ? t('moneyToastDepositSuccessDescription', [amountFiat])
      : t('moneyToastDepositSuccessDescriptionNoAmount'),
  };
}

function getWithdrawLabel(
  status: ToastStatus,
  transactionMeta: TransactionMeta,
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
      description: t('moneyToastWithdrawFailedBody'),
    };
  }

  const amountFiat = formatFiat(transactionMeta, false);
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

/**
 * Toast copy for money account deposits and withdrawals, mirroring mobile's
 * money toasts. Classified from the transaction itself rather than the
 * activity list, which filters by selected account. Returns undefined for
 * every other transaction.
 *
 * @param status - Toast status.
 * @param transactionId - Transaction id the toast was raised for.
 * @param recordedIntent - Deposit intent recorded when the deposit was
 * initiated, captured by the caller when the toast was raised. Falls back to
 * deriving the intent from the transaction's payment method.
 */
export function useMoneyAccountToastLabel(
  status: ToastStatus,
  transactionId: string | undefined,
  recordedIntent?: MoneyAccountDepositIntent,
): ToastLabel | undefined {
  const t = useI18nContext();
  const transactionMeta = useSelector((state: MetaMaskReduxState) =>
    selectTransactionById(state, transactionId),
  );

  const isDeposit = Boolean(
    transactionMeta && isMoneyDepositTx(transactionMeta),
  );
  const isWithdraw =
    !isDeposit &&
    Boolean(transactionMeta && isMoneyWithdrawTx(transactionMeta));
  const destination = useWithdrawDestination(
    isWithdraw
      ? getMoneyAccountWithdrawTransferDetails(transactionMeta).recipient
      : undefined,
  );

  if (!transactionMeta) {
    return undefined;
  }
  if (isDeposit) {
    const intent = recordedIntent ?? resolveMoneyDepositIntent(transactionMeta);
    return getDepositLabel(status, transactionMeta, intent, t);
  }
  if (isWithdraw) {
    return getWithdrawLabel(status, transactionMeta, destination, t);
  }
  return undefined;
}
