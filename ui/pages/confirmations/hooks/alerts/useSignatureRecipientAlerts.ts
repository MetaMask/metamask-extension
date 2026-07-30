import { useMemo } from 'react';
import { NameType } from '@metamask/name-controller';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../context/confirm';
import { isSignatureTransactionType } from '../../utils';
import { SignatureRequestType } from '../../types/confirm';
import { parseTypedDataMessage } from '../../../../../shared/lib/transaction.utils';
import { extractSignatureAddresses } from '../../../../../shared/lib/trust-signals';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../helpers/constants/design-system';
import {
  useTrustSignals,
  TrustSignalDisplayState,
} from '../../../../hooks/useTrustSignals';

// `spender` is handled by `useSpenderAlerts`; exclude it here to avoid a
// duplicate alert.
const EXCLUDED_ALERT_FIELDS = ['spender'];

/**
 * Generate trust-signal alerts for the address fields of a typed-data
 * signature. `useSpenderAlerts` only covers the permit `spender`, so addresses
 * in other fields are surfaced here using the same alert template.
 *
 * @returns Alerts for any flagged address in the signature.
 */
export function useSignatureRecipientAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  const recipientAddresses = useMemo(() => {
    if (
      !currentConfirmation ||
      !isSignatureTransactionType(currentConfirmation) ||
      currentConfirmation.type !== 'eth_signTypedData'
    ) {
      return [];
    }

    const signatureRequest = currentConfirmation as SignatureRequestType;
    const msgData = signatureRequest.msgParams?.data as string;
    if (!msgData) {
      return [];
    }

    try {
      const parsed = parseTypedDataMessage(msgData);
      const signer = signatureRequest.msgParams?.from as string | undefined;
      return extractSignatureAddresses(parsed, {
        exclude: signer ? [signer] : [],
        excludeFields: EXCLUDED_ALERT_FIELDS,
      });
    } catch {
      return [];
    }
  }, [currentConfirmation]);

  const trustSignals = useTrustSignals(
    recipientAddresses.map((value) => ({
      value,
      type: NameType.ETHEREUM_ADDRESS,
      chainId: currentConfirmation?.chainId,
    })),
  );

  return useMemo(() => {
    if (recipientAddresses.length === 0) {
      return [];
    }

    const hasMalicious = trustSignals.some(
      ({ state }) => state === TrustSignalDisplayState.Malicious,
    );
    const hasWarning = trustSignals.some(
      ({ state }) => state === TrustSignalDisplayState.Warning,
    );

    const alerts: Alert[] = [];

    if (hasMalicious) {
      alerts.push({
        actions: [],
        field: RowAlertKey.InteractingWith,
        isBlocking: false,
        key: 'signatureRecipientTrustSignalMalicious',
        message: t('alertMessageAddressTrustSignalMalicious'),
        reason: t('nameModalTitleMalicious'),
        severity: Severity.Danger,
      });
    } else if (hasWarning) {
      alerts.push({
        actions: [],
        field: RowAlertKey.InteractingWith,
        isBlocking: false,
        key: 'signatureRecipientTrustSignalWarning',
        message: t('alertMessageAddressTrustSignal'),
        reason: t('nameModalTitleWarning'),
        severity: Severity.Warning,
      });
    }

    return alerts;
  }, [recipientAddresses, trustSignals, t]);
}
