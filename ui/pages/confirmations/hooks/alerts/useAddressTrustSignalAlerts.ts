import { useMemo } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { NameType } from '@metamask/name-controller';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { useConfirmContext } from '../../context/confirm';
import {
  useTrustSignal,
  TrustSignalDisplayState,
} from '../../../../hooks/useTrustSignals';
import { SignatureRequestType } from '../../types/confirm';
import { useI18nContext } from '../../../../hooks/useI18nContext';
// eslint-disable-next-line import/no-restricted-paths
import { isSecurityAlertsAPIEnabled } from '../../../../../app/scripts/lib/ppom/security-alerts-api';

export function useAddressTrustSignalAlerts(): Alert[] {
  const { currentConfirmation } = useConfirmContext();
  const t = useI18nContext();

  const addressToCheck = useMemo(() => {
    if (!currentConfirmation) {
      return null;
    }

    // For transactions, check the 'to' address
    if ((currentConfirmation as TransactionMeta)?.txParams?.to) {
      return (currentConfirmation as TransactionMeta).txParams.to;
    }

    // For signatures, check the verifying contract if available
    if ((currentConfirmation as SignatureRequestType)?.msgParams?.data) {
      try {
        const data = (currentConfirmation as SignatureRequestType)?.msgParams
          ?.data;
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        if (parsedData?.domain?.verifyingContract) {
          return parsedData.domain.verifyingContract;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    return null;
  }, [currentConfirmation]);

  const { state: trustSignalDisplayState } = useTrustSignal(
    addressToCheck || '',
    NameType.ETHEREUM_ADDRESS,
  );

  return useMemo(() => {
    if (!addressToCheck || !isSecurityAlertsAPIEnabled()) {
      return [];
    }

    const alerts: Alert[] = [];

    if (trustSignalDisplayState === TrustSignalDisplayState.Malicious) {
      alerts.push({
        actions: [],
        field: RowAlertKey.InteractingWith,
        isBlocking: false,
        key: 'trustSignalMalicious',
        message: t('alertMessageAddressTrustSignal'),
        reason: t('nameModalTitleMalicious'),
        severity: Severity.Danger,
      });
    } else if (trustSignalDisplayState === TrustSignalDisplayState.Warning) {
      alerts.push({
        actions: [],
        field: RowAlertKey.InteractingWith,
        isBlocking: false,
        key: 'trustSignalWarning',
        message: t('alertMessageAddressTrustSignal'),
        reason: t('nameModalTitleWarning'),
        severity: Severity.Warning,
      });
    }

    return alerts;
  }, [addressToCheck, trustSignalDisplayState, t]);
}
