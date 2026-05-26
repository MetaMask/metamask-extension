'use no memo';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { TransactionType } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { AlertsName } from '../constants';
import { useConfirmContext } from '../../../context/confirm';
import { getInternalAccountByAddress } from '../../../../../selectors/accounts';
import { isHardwareAccount } from '../../../../../components/app/rewards/utils/isHardwareAccount';

const PAY_HARDWARE_ALERT_TRANSACTION_TYPES: TransactionType[] = [
  TransactionType.musdConversion,
  TransactionType.perpsDeposit,
  TransactionType.perpsWithdraw,
  TransactionType.predictDeposit,
  TransactionType.predictWithdraw,
];

export function usePayHardwareAccountAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const transactionType = currentConfirmation?.type;
  const fromAddress = currentConfirmation?.txParams?.from as Hex | undefined;

  const account = useSelector((state) =>
    fromAddress ? getInternalAccountByAddress(state, fromAddress) : undefined,
  );

  const isHardwareWallet = account ? isHardwareAccount(account) : false;

  const isApplicableType =
    transactionType !== undefined &&
    PAY_HARDWARE_ALERT_TRANSACTION_TYPES.includes(transactionType);

  return useMemo(() => {
    if (!isApplicableType || !isHardwareWallet) {
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
  }, [isApplicableType, isHardwareWallet, t]);
}
