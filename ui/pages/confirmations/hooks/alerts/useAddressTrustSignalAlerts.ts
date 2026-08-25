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
// eslint-disable-next-line import-x/no-restricted-paths
import { isSecurityAlertsAPIEnabled } from '../../../../../app/scripts/lib/ppom/security-alerts-api';
import {
  buildFalsePositiveReportUrl,
  SecurityProvider,
} from '../../../../../shared/constants/security-provider';

function buildTrustSignalAlertFields(requestId: string | undefined): {
  provider?: SecurityProvider;
  reportUrl?: string;
  alertDetails?: string[];
} {
  if (!requestId) {
    return {};
  }
  return {
    provider: SecurityProvider.Blockaid,
    reportUrl: buildFalsePositiveReportUrl({ requestId }),
  };
}

export function useAddressTrustSignalAlerts(): Alert[] {
  const { currentConfirmation } = useConfirmContext();
  const t = useI18nContext();

  const addressToCheck = useMemo(() => {
    if (!currentConfirmation) {
      return null;
    }

    // For transactions, check the original 'to' address before container
    // wrapping replaces it with the delegation manager address.
    const transactionMeta = currentConfirmation as TransactionMeta;
    const transactionAddress =
      transactionMeta?.txParamsOriginal?.to ?? transactionMeta?.txParams?.to;
    if (transactionAddress) {
      return transactionAddress;
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

  const { state: trustSignalDisplayState, requestId } = useTrustSignal(
    addressToCheck || '',
    NameType.ETHEREUM_ADDRESS,
    currentConfirmation?.chainId,
  );

  return useMemo(() => {
    if (!addressToCheck || !isSecurityAlertsAPIEnabled()) {
      return [];
    }

    const reportFields = buildTrustSignalAlertFields(requestId);
    const alerts: Alert[] = [];

    if (trustSignalDisplayState === TrustSignalDisplayState.Malicious) {
      const message = t('alertMessageAddressTrustSignalMalicious');
      alerts.push({
        actions: [],
        field: RowAlertKey.InteractingWith,
        isBlocking: false,
        key: 'trustSignalMalicious',
        message,
        reason: t('nameModalTitleMalicious'),
        severity: Severity.Danger,
        alertDetails: [message],
        ...reportFields,
      });
    } else if (trustSignalDisplayState === TrustSignalDisplayState.Warning) {
      const message = t('alertMessageAddressTrustSignal');
      alerts.push({
        actions: [],
        field: RowAlertKey.InteractingWith,
        isBlocking: false,
        key: 'trustSignalWarning',
        message,
        reason: t('nameModalTitleWarning'),
        severity: Severity.Warning,
        alertDetails: [message],
        ...reportFields,
      });
    }

    return alerts;
  }, [addressToCheck, trustSignalDisplayState, requestId, t]);
}
