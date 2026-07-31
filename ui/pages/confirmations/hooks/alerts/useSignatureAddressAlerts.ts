import { useMemo } from 'react';
import { NameType } from '@metamask/name-controller';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { shortenAddress } from '../../../../helpers/utils/util';
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
 * signature. Every address-typed field is scanned (recipients, tokens, order
 * makers, non-permit spenders, and so on); the top-level permit `spender` is
 * left to `useSpenderAlerts` to avoid a duplicate alert.
 *
 * @returns Alerts for any flagged address in the signature.
 */
export function useSignatureAddressAlerts(): Alert[] {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext();

  const {
    addresses: signatureAddresses,
    fields,
    overflow,
  } = useMemo(() => {
    const empty = {
      addresses: [] as string[],
      fields: {} as Record<string, string>,
      overflow: false,
    };

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
    signatureAddresses.map((value) => ({
      value,
      type: NameType.ETHEREUM_ADDRESS,
      chainId: currentConfirmation?.chainId,
    })),
  );

  return useMemo(() => {
    const alerts: Alert[] = [];

    // The message could not be fully scanned (too many addresses, or traversal
    // hit its depth or work limit), so surface a caution rather than failing
    // silently.
    if (overflow) {
      alerts.push({
        actions: [],
        field: RowAlertKey.InteractingWith,
        isBlocking: false,
        key: 'signatureAddressScanIncomplete',
        message: t('alertMessageSignatureAddressScanIncomplete'),
        reason: t('alertReasonSignatureAddressScanIncomplete'),
        severity: Severity.Warning,
      });
    }

    if (signatureAddresses.length === 0) {
      return alerts;
    }

    const maliciousIndex = trustSignals.findIndex(
      ({ state }) => state === TrustSignalDisplayState.Malicious,
    );
    const warningIndex = trustSignals.findIndex(
      ({ state }) => state === TrustSignalDisplayState.Warning,
    );

    // Name the flagged address and its field so the message is actionable; the
    // inline row anchor still shows the verifying contract.
    if (maliciousIndex !== -1) {
      const address = signatureAddresses[maliciousIndex];
      alerts.push({
        actions: [],
        field: RowAlertKey.InteractingWith,
        isBlocking: false,
        key: 'signatureAddressTrustSignalMalicious',
        message: t('alertMessageSignatureAddressMalicious', [
          fields[address],
          shortenAddress(address),
        ]),
        reason: t('nameModalTitleMalicious'),
        severity: Severity.Danger,
      });
    } else if (warningIndex !== -1) {
      const address = signatureAddresses[warningIndex];
      alerts.push({
        actions: [],
        field: RowAlertKey.InteractingWith,
        isBlocking: false,
        key: 'signatureAddressTrustSignalWarning',
        message: t('alertMessageSignatureAddressWarning', [
          fields[address],
          shortenAddress(address),
        ]),
        reason: t('nameModalTitleWarning'),
        severity: Severity.Warning,
      });
    }

    return alerts;
  }, [signatureAddresses, fields, overflow, trustSignals, t]);
}
