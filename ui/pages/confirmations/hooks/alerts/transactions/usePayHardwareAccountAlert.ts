'use no memo';

import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { AlertsName } from '../constants';
import { useConfirmContext } from '../../../context/confirm';
import { isHardwareWallet as isHardwareWalletSelector } from '../../../../../selectors';

export function usePayHardwareAccountAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const isHardwareWalletAccount = useSelector(isHardwareWalletSelector);
  const hasConfirmation = Boolean(currentConfirmation?.txParams?.from);

  return useMemo(() => {
    if (!hasConfirmation || !isHardwareWalletAccount) {
      return [];
    }

    return [
      {
        key: AlertsName.PayHardwareAccount,
        field: RowAlertKey.PayWith,
        reason: t('alertPayHardwareAccountTitle'),
        message: t('alertPayHardwareAccountMessage'),
        severity: Severity.Warning,
        isBlocking: false,
      },
    ];
  }, [hasConfirmation, isHardwareWalletAccount, t]);
}
