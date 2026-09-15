import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { Alert } from '../../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../../components/app/confirm/info/row/constants';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { AlertsName } from '../constants';
import { getInternalAccountByAddress } from '../../../../../selectors/accounts';
import { isHardwareAccount } from '../../../../../components/app/rewards/utils/isHardwareAccount';
import { useIsPayHardwareBlocked } from '../../pay/useIsPayHardwareBlocked';
import { useTransactionMetadataRequestOptional } from '../../transactions/useTransactionMetadataRequest';

/**
 * Blocking alert for a hardware account that is already funding a Pay flow
 * that forbids hardware wallets.
 *
 * The account picker hides hardware accounts for these flows, so this is a
 * backstop for the addresses the picker never vetted: `txParams.from` seeded
 * at initiation from the globally selected account, deep links, and any other
 * entry point that sets the funding account directly.
 *
 * @returns The blocking alert, or an empty array.
 */
export function usePayHardwareAccountAlert(): Alert[] {
  const t = useI18nContext();
  const transactionMeta = useTransactionMetadataRequestOptional();

  const isHardwareBlocked = useIsPayHardwareBlocked();
  const fromAddress = transactionMeta?.txParams?.from as Hex | undefined;

  const account = useSelector((state) =>
    fromAddress ? getInternalAccountByAddress(state, fromAddress) : undefined,
  );

  const isHardwareWallet = account ? isHardwareAccount(account) : false;

  return useMemo(() => {
    if (!isHardwareWallet || !isHardwareBlocked) {
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
  }, [isHardwareWallet, isHardwareBlocked, t]);
}
