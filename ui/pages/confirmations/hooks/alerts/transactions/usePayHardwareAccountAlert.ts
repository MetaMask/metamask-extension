import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { KeyringTypes } from '@metamask/keyring-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionType } from '@metamask/transaction-controller';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { AlertsName } from '../constants';
import { useConfirmContext } from '../../../context/confirm';
import { getInternalAccountByAddress } from '../../../../../selectors/accounts';
import { isHardwareAccount } from '../../../../../components/app/rewards/utils/isHardwareAccount';
import { hasTransactionType } from '../../../../../../shared/lib/transactions.utils';
import { useIsPayHardwareEnabled } from '../../pay/useIsPayHardwareEnabled';
import { useTransactionPayingAccount } from '../../transactions/useTransactionPayingAccount';

const PAY_HARDWARE_ALERT_TRANSACTION_TYPES: TransactionType[] = [
  TransactionType.moneyAccountWithdraw,
  TransactionType.perpsDeposit,
  TransactionType.perpsWithdraw,
  TransactionType.predictDeposit,
  TransactionType.predictWithdraw,
];

const PAY_HARDWARE_FLAG_GATED_TYPES: TransactionType[] = [
  TransactionType.moneyAccountDeposit,
  TransactionType.musdConversion,
];

export function usePayHardwareAccountAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const isPayHardwareEnabled = useIsPayHardwareEnabled();
  const payingAccount = useTransactionPayingAccount();

  const account = useSelector((state) =>
    payingAccount
      ? getInternalAccountByAddress(state, payingAccount)
      : undefined,
  );

  const isHardwareWallet = account ? isHardwareAccount(account) : false;
  const isQrWallet = account?.metadata?.keyring?.type === KeyringTypes.qr;

  const isAlwaysBlockedType = hasTransactionType(
    currentConfirmation,
    PAY_HARDWARE_ALERT_TRANSACTION_TYPES,
  );

  const isFlagGatedType = hasTransactionType(
    currentConfirmation,
    PAY_HARDWARE_FLAG_GATED_TYPES,
  );

  const isMoneyAccountDeposit = hasTransactionType(currentConfirmation, [
    TransactionType.moneyAccountDeposit,
  ]);

  return useMemo(() => {
    if (!isHardwareWallet) {
      return [];
    }

    // QR payers stay blocked for deposits: the relay funding legs are signed
    // in the background and cannot drive the interactive scan loop.
    const isBlockedQrDeposit = isMoneyAccountDeposit && isQrWallet;

    const shouldAlert =
      isAlwaysBlockedType ||
      isBlockedQrDeposit ||
      (isFlagGatedType && !isPayHardwareEnabled);

    if (!shouldAlert) {
      return [];
    }

    return [
      {
        key: AlertsName.PayHardwareAccount,
        field: RowAlertKey.PayWith,
        reason: t('alertPayHardwareAccountTitle'),
        message: t('alertPayHardwareAccountMessage'),
        severity: Severity.Danger,
        isBlocking: true,
      },
    ];
  }, [
    isHardwareWallet,
    isQrWallet,
    isAlwaysBlockedType,
    isFlagGatedType,
    isMoneyAccountDeposit,
    isPayHardwareEnabled,
    t,
  ]);
}
