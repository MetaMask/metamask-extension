import { useMemo } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import { NameType } from '@metamask/name-controller';
import type { Hex } from '@metamask/utils';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { Severity } from '../../../../helpers/constants/design-system';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { useConfirmContext } from '../../context/confirm';
import {
  useTrustSignals,
  TrustSignalDisplayState,
} from '../../../../hooks/useTrustSignals';
import { useI18nContext } from '../../../../hooks/useI18nContext';
// eslint-disable-next-line import-x/no-restricted-paths
import { isSecurityAlertsAPIEnabled } from '../../../../../app/scripts/lib/ppom/security-alerts-api';
import {
  useNestedTransactionTransferRecipients,
  useTransferRecipient,
} from '../../components/confirm/info/hooks/useTransferRecipient';

/**
 * Page-level trust-signal alerts for decoded token-transfer payees.
 *
 * Complements {@link useAddressTrustSignalAlerts}, which keys off
 * `txParams.to` (the executed contract). For ERC-20/721/1155 transfers that
 * address is the token contract, so a malicious payee would otherwise only
 * get a row badge. Recipients that equal `txParams.to` are skipped so native
 * sends are not double-alerted.
 *
 * @returns Alerts for decoded transfer recipients.
 */
export function useTransferRecipientAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();
  const transferRecipient = useTransferRecipient();
  const nestedRecipients = useNestedTransactionTransferRecipients();

  const transactionMeta = currentConfirmation as TransactionMeta | undefined;
  const interactingWith =
    transactionMeta?.txParamsOriginal?.to ?? transactionMeta?.txParams?.to;

  const recipientAddresses = useMemo(() => {
    const unique = new Set<string>();
    for (const address of [transferRecipient, ...nestedRecipients]) {
      if (address && address.toLowerCase() !== interactingWith?.toLowerCase()) {
        unique.add(address);
      }
    }
    return [...unique];
  }, [transferRecipient, nestedRecipients, interactingWith]);

  const trustSignalRequests = useMemo(
    () =>
      recipientAddresses.map((value) => ({
        value,
        type: NameType.ETHEREUM_ADDRESS,
        chainId: currentConfirmation?.chainId as Hex | undefined,
      })),
    [recipientAddresses, currentConfirmation?.chainId],
  );

  const trustSignalResults = useTrustSignals(trustSignalRequests);

  return useMemo(() => {
    if (!recipientAddresses.length || !isSecurityAlertsAPIEnabled()) {
      return [];
    }

    const alerts: Alert[] = [];

    trustSignalResults.forEach((result, index) => {
      const address = recipientAddresses[index];
      if (!address) {
        return;
      }

      if (result.state === TrustSignalDisplayState.Malicious) {
        alerts.push({
          actions: [],
          field: RowAlertKey.InteractingWith,
          isBlocking: false,
          key: `transferRecipientTrustSignalMalicious-${address.toLowerCase()}`,
          message: t('alertMessageAddressTrustSignalMalicious'),
          reason: t('alertReasonAddressTrustSignalMalicious'),
          severity: Severity.Danger,
        });
      } else if (result.state === TrustSignalDisplayState.Warning) {
        alerts.push({
          actions: [],
          field: RowAlertKey.InteractingWith,
          isBlocking: false,
          key: `transferRecipientTrustSignalWarning-${address.toLowerCase()}`,
          message: t('alertMessageAddressTrustSignal'),
          reason: t('alertReasonAddressTrustSignalWarning'),
          severity: Severity.Warning,
        });
      }
    });

    return alerts;
  }, [recipientAddresses, trustSignalResults, t]);
}
