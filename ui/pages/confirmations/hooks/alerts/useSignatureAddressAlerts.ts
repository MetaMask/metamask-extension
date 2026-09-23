import { useMemo } from 'react';
import { NameType } from '@metamask/name-controller';
import { extractSignatureAddresses } from '@metamask/phishing-controller';
import { SignatureRequestType } from '@metamask/signature-controller';
import type { Hex } from '@metamask/utils';

import { useI18nContext } from '../../../../hooks/useI18nContext';
import { shortenAddress } from '../../../../helpers/utils/util';
import { parseTypedDataMessage } from '../../../../../shared/lib/transaction.utils';
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
import { useSignatureRequestOptional } from '../signatures/useSignatureRequest';

/**
 * Generate trust-signal alerts for the address fields of a typed-data
 * signature. Every address-typed field is scanned; the top-level permit
 * `spender` is left to `useSpenderAlerts` to avoid a duplicate alert.
 */
export function useSignatureAddressAlerts(): Alert[] {
  const t = useI18nContext();
  const signatureRequest = useSignatureRequestOptional();

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
      !signatureRequest ||
      signatureRequest.type !== SignatureRequestType.TypedSign ||
      !isSecurityAlertsAPIEnabled()
    ) {
      return empty;
    }

    const msgData = signatureRequest.messageParams?.data;
    // V1 typed-data is an array of { name, type, value } and is not scanned.
    // V3/V4 may arrive as a JSON string or as an already-parsed object.
    if (msgData == null || Array.isArray(msgData)) {
      return empty;
    }

    try {
      // Stringify objects first so parseTypedDataMessage mutates a copy.
      // Passing the live messageParams.data object rewrites message.value
      // on the stored signature request.
      const parsed = parseTypedDataMessage(
        typeof msgData === 'string' ? msgData : JSON.stringify(msgData),
      );
      const signer = signatureRequest.messageParams?.from;
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
  }, [signatureRequest]);

  const trustSignals = useTrustSignals(
    signatureAddresses.map((value) => ({
      value,
      type: NameType.ETHEREUM_ADDRESS,
      chainId: signatureRequest?.chainId as Hex | undefined,
    })),
  );

  return useMemo(() => {
    const alerts: Alert[] = [];

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

    trustSignals.forEach(({ state }, index) => {
      const address = signatureAddresses[index];

      if (state === TrustSignalDisplayState.Malicious) {
        alerts.push({
          actions: [],
          field: RowAlertKey.InteractingWith,
          isBlocking: false,
          key: `signatureAddressTrustSignalMalicious_${address}`,
          message: t('alertMessageSignatureAddressMalicious', [
            fields[address],
            shortenAddress(address),
          ]),
          reason: t('nameModalTitleMalicious'),
          severity: Severity.Danger,
        });
      } else if (state === TrustSignalDisplayState.Warning) {
        alerts.push({
          actions: [],
          field: RowAlertKey.InteractingWith,
          isBlocking: false,
          key: `signatureAddressTrustSignalWarning_${address}`,
          message: t('alertMessageSignatureAddressWarning', [
            fields[address],
            shortenAddress(address),
          ]),
          reason: t('nameModalTitleWarning'),
          severity: Severity.Warning,
        });
      }
    });

    return alerts;
  }, [signatureAddresses, fields, overflow, trustSignals, t]);
}
