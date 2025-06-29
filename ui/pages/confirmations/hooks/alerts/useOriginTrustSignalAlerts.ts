import { useMemo } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../context/confirm';
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import { useOriginTrustSignals } from '../../../../hooks/useOriginTrustSignals';
import { SignatureRequestType } from '../../types/confirm';

export function useOriginTrustSignalAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  const origin =
    (currentConfirmation as TransactionMeta)?.origin ??
    (currentConfirmation as SignatureRequestType)?.msgParams?.origin ??
    '';

  const { state: trustSignalState } = useOriginTrustSignals(origin);

  return useMemo(() => {
    if (!origin) {
      return [];
    }

    const alerts: Alert[] = [];

    if (trustSignalState === TrustSignalDisplayState.Malicious) {
      alerts.push({
        key: 'originTrustSignalMalicious',
        reason: t('alertReasonOriginTrustSignalMalicious'),
        field: RowAlertKey.RequestFrom,
        severity: Severity.Danger,
        message: t('alertMessageOriginTrustSignalMalicious'),
      });
    } else if (trustSignalState === TrustSignalDisplayState.Warning) {
      alerts.push({
        key: 'originTrustSignalWarning',
        reason: t('alertReasonOriginTrustSignalWarning'),
        field: RowAlertKey.RequestFrom,
        severity: Severity.Warning,
        message: t('alertMessageOriginTrustSignalWarning'),
      });
    }

    return alerts;
  }, [origin, trustSignalState, t]);
}
