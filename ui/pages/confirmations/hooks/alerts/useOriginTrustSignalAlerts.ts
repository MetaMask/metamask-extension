import { useMemo } from 'react';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { TrustSignalDisplayState } from '../../../../hooks/useTrustSignals';
import { useOriginTrustSignals } from '../../../../hooks/useOriginTrustSignals';
import { useApprovalRequest } from '../useApprovalRequest';

export function useOriginTrustSignalAlerts(): Alert[] {
  const t = useI18nContext();
  const approvalRequest = useApprovalRequest();

  const origin = approvalRequest?.origin ?? '';

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
