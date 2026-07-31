import { useMemo } from 'react';
import { NameType } from '@metamask/name-controller';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../context/confirm';
import { isSignatureTransactionType } from '../../utils';
import { SignatureRequestType } from '../../types/confirm';
import { parseTypedDataMessage } from '../../../../../shared/lib/transaction.utils';
import { extractSignatureAddresses } from '../../../../../shared/lib/trust-signals';
import { PRIMARY_TYPES_PERMIT } from '../../../../../shared/constants/signatures';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { Severity } from '../../../../helpers/constants/design-system';
import {
  useTrustSignals,
  TrustSignalDisplayState,
} from '../../../../hooks/useTrustSignals';
// eslint-disable-next-line import-x/no-restricted-paths
import { isSecurityAlertsAPIEnabled } from '../../../../../app/scripts/lib/ppom/security-alerts-api';

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

  const { addresses: recipientAddresses, overflow } = useMemo(() => {
    const empty = { addresses: [] as string[], overflow: false };

    if (
      !currentConfirmation ||
      !isSignatureTransactionType(currentConfirmation) ||
      currentConfirmation.type !== 'eth_signTypedData' ||
      !isSecurityAlertsAPIEnabled()
    ) {
      return empty;
    }

    const signatureRequest = currentConfirmation as SignatureRequestType;
    const msgData = signatureRequest.msgParams?.data as string;
    if (!msgData) {
      return empty;
    }

    try {
      const parsed = parseTypedDataMessage(msgData);
      const signer = signatureRequest.msgParams?.from as string | undefined;
      // `useSpenderAlerts` covers the top-level `spender` only for permit
      // types, so exclude it here only in that same case to avoid a duplicate
      // alert while still scanning `spender` fields it does not cover.
      const isPermit = PRIMARY_TYPES_PERMIT.some(
        (type) => type === parsed.primaryType,
      );
      return extractSignatureAddresses(parsed, {
        exclude: signer ? [signer] : [],
        excludeFields: isPermit ? ['spender'] : [],
      });
    } catch {
      return empty;
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
    const alerts: Alert[] = [];

    // The signature references more addresses than can be checked, so some were
    // not scanned. Surface a caution rather than failing silently.
    if (overflow) {
      alerts.push({
        actions: [],
        field: RowAlertKey.InteractingWith,
        isBlocking: false,
        key: 'signatureRecipientAddressCount',
        message: t('alertMessageSignatureAddressCount'),
        reason: t('alertReasonSignatureAddressCount'),
        severity: Severity.Warning,
      });
    }

    if (recipientAddresses.length === 0) {
      return alerts;
    }

    const hasMalicious = trustSignals.some(
      ({ state }) => state === TrustSignalDisplayState.Malicious,
    );
    const hasWarning = trustSignals.some(
      ({ state }) => state === TrustSignalDisplayState.Warning,
    );

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
  }, [recipientAddresses, overflow, trustSignals, t]);
}
