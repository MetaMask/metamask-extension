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
import { hasTransactionType } from '../../../../../../shared/lib/transactions.utils';
import { selectIsPayHardwareEnabled } from '../../../selectors/feature-flags';

const PAY_HARDWARE_ALERT_TRANSACTION_TYPES: TransactionType[] = [
  TransactionType.perpsDeposit,
  TransactionType.perpsWithdraw,
  TransactionType.predictDeposit,
  TransactionType.predictWithdraw,
];

const PAY_HARDWARE_FLAG_GATED_TYPES: TransactionType[] = [
  TransactionType.musdConversion,
];

export function usePayHardwareAccountAlert(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const isPayHardwareEnabled = useSelector(selectIsPayHardwareEnabled);
  const fromAddress = currentConfirmation?.txParams?.from as Hex | undefined;

  const account = useSelector((state) =>
    fromAddress ? getInternalAccountByAddress(state, fromAddress) : undefined,
  );

  const isHardwareWallet = account ? isHardwareAccount(account) : false;

  const isAlwaysBlockedType = hasTransactionType(
    currentConfirmation,
    PAY_HARDWARE_ALERT_TRANSACTION_TYPES,
  );

  const isFlagGatedType = hasTransactionType(
    currentConfirmation,
    PAY_HARDWARE_FLAG_GATED_TYPES,
  );

  return useMemo(() => {
    if (!isHardwareWallet) {
      return [];
    }

    const shouldAlert =
      isAlwaysBlockedType || (isFlagGatedType && !isPayHardwareEnabled);

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
    isAlwaysBlockedType,
    isFlagGatedType,
    isPayHardwareEnabled,
    t,
  ]);
}
