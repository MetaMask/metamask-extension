import { useMemo } from 'react';
import { NameType } from '@metamask/name-controller';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import {
  useTrustSignal,
  TrustSignalDisplayState,
} from '../../../../hooks/useTrustSignals';
import { useI18nContext } from '../../../../hooks/useI18nContext';
// eslint-disable-next-line import/no-restricted-paths
import { isSecurityAlertsAPIEnabled } from '../../../../../app/scripts/lib/ppom/security-alerts-api';
import { useUnapprovedTransaction } from '../transactions/useUnapprovedTransaction';
import { useSignatureRequest } from '../signatures/useSignatureRequest';

export function useAddressTrustSignalAlerts(): Alert[] {
  const transactionMeta = useUnapprovedTransaction();
  const signatureRequest = useSignatureRequest();
  const t = useI18nContext();

  const addressToCheck = useMemo(() => {
    if (!transactionMeta && !signatureRequest) {
      return null;
    }

    // For transactions, check the 'to' address
    if (transactionMeta) {
      return transactionMeta.txParams.to;
    }

    // For signatures, check the verifying contract if available
    if (signatureRequest) {
      try {
        const data = signatureRequest?.msgParams?.data;
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        if (parsedData?.domain?.verifyingContract) {
          return parsedData.domain.verifyingContract;
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    return null;
  }, [transactionMeta, signatureRequest]);

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
        message: t('alertMessageAddressTrustSignalMalicious'),
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
