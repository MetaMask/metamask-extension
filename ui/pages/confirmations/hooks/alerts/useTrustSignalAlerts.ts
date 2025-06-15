import { useMemo } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { NameType } from '@metamask/name-controller';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { Severity } from '../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { useConfirmContext } from '../../context/confirm';
import {
  useTrustSignals,
  TrustSignalDisplayState,
} from '../../../../hooks/useTrustSignals';
import { SignatureRequestType } from '../../types/confirm';

export function useTrustSignalAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  // Get the address to check based on confirmation type
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

  const chainId = currentConfirmation?.chainId as string;

  const { state: trustSignalDisplayState, trustLabel } = useTrustSignals(
    addressToCheck || '',
    NameType.ETHEREUM_ADDRESS,
    chainId,
    true, // Always check trust signals for alerts
  );

  return useMemo(() => {
    if (!addressToCheck || !currentConfirmation) {
      return [];
    }

    const alerts: Alert[] = [];

    if (trustSignalDisplayState === TrustSignalDisplayState.Malicious) {
      alerts.push({
        actions: [],
        field: RowAlertKey.InteractingWith,
        isBlocking: false,
        key: 'trustSignalMalicious',
        message:
          trustLabel ||
          'If you confirm this request, you will probably lose your assets to a scammer. ',
        reason: 'Malicious address',
        severity: Severity.Danger,
      });
    } else if (trustSignalDisplayState === TrustSignalDisplayState.Warning) {
      alerts.push({
        actions: [],
        field: RowAlertKey.InteractingWith,
        isBlocking: false,
        key: 'trustSignalWarning',
        message:
          trustLabel ||
          'If you interact with this address, your assets might be at risk.',
        reason: 'Suspicious address',
        severity: Severity.Warning,
      });
    }

    return alerts;
  }, [
    addressToCheck,
    currentConfirmation,
    trustSignalDisplayState,
    trustLabel,
    t,
  ]);
}
