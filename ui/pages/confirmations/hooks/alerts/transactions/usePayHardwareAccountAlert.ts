import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { KeyringTypes } from '@metamask/keyring-controller';
import { hasTransactionType } from '../../../../../../shared/lib/transactions.utils';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { AlertsName } from '../constants';
import { getInternalAccountByAddress } from '../../../../../selectors/accounts';
import { isHardwareAccount } from '../../../../../components/app/rewards/utils/isHardwareAccount';
import { PAY_QR_HARDWARE_BLOCKED_TRANSACTION_TYPES } from '../../../constants/pay';
import { useIsPayHardwareBlocked } from '../../pay/useIsPayHardwareBlocked';
import { useTransactionMetadataRequestOptional } from '../../transactions/useTransactionMetadataRequest';
import { useTransactionPayingAccount } from '../../transactions/useTransactionPayingAccount';

/**
 * Blocking alert for a hardware account already funding a Pay flow
 * that forbids hardware wallets.
 *
 * Account-picker filtering and this backstop share
 * `useIsPayHardwareBlocked`, while the account lookup follows the effective
 * payer (`accountOverride ?? txParams.from`).
 *
 * @returns The blocking alert, or an empty array.
 */
export function usePayHardwareAccountAlert(): Alert[] {
  const t = useI18nContext();
  const transactionMeta = useTransactionMetadataRequestOptional();
  const isHardwareBlocked = useIsPayHardwareBlocked();
  const payingAccount = useTransactionPayingAccount();

  const account = useSelector((state) =>
    payingAccount
      ? getInternalAccountByAddress(state, payingAccount)
      : undefined,
  );

  const isHardwareWallet = account ? isHardwareAccount(account) : false;
  const isQrWallet = account?.metadata?.keyring?.type === KeyringTypes.qr;
  const isQrHardwareBlocked = hasTransactionType(
    transactionMeta,
    PAY_QR_HARDWARE_BLOCKED_TRANSACTION_TYPES,
  );
  const shouldAlert =
    isHardwareWallet &&
    (isHardwareBlocked || (isQrWallet && isQrHardwareBlocked));

  return useMemo(() => {
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
  }, [shouldAlert, t]);
}
