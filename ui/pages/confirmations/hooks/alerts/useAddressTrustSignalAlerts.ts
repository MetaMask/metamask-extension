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
import { SignatureRequestType } from '../../types/confirm';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { shortenAddress } from '../../../../helpers/utils/util';
// eslint-disable-next-line import-x/no-restricted-paths
import { isSecurityAlertsAPIEnabled } from '../../../../../app/scripts/lib/ppom/security-alerts-api';

export function useAddressTrustSignalAlerts(): Alert[] {
  const { currentConfirmation } = useConfirmContext();
  const t = useI18nContext();

  const addressesToCheck = useMemo(() => {
    if (!currentConfirmation) {
      return [];
    }

    const addresses: {
      address: string;
      nestedTransactionIndex?: number;
    }[] = [];

    // For transactions, check the original 'to' address before container
    // wrapping replaces it with the delegation manager address.
    const transactionMeta = currentConfirmation as TransactionMeta;
    const transactionAddress =
      transactionMeta?.txParamsOriginal?.to ?? transactionMeta?.txParams?.to;
    if (transactionAddress) {
      addresses.push({ address: transactionAddress });
    }

    transactionMeta?.nestedTransactions?.forEach((nested, index) => {
      if (nested.to) {
        addresses.push({
          address: nested.to,
          nestedTransactionIndex: index,
        });
      }
    });

    // For signatures, check the verifying contract if available
    if ((currentConfirmation as SignatureRequestType)?.msgParams?.data) {
      try {
        const data = (currentConfirmation as SignatureRequestType)?.msgParams
          ?.data;
        const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
        if (parsedData?.domain?.verifyingContract) {
          addresses.push({ address: parsedData.domain.verifyingContract });
        }
      } catch (e) {
        // Ignore parsing errors
      }
    }

    return addresses;
  }, [currentConfirmation]);

  const trustSignalsRequests = useMemo(() => {
    return addressesToCheck.map(({ address }) => ({
      value: address,
      type: NameType.ETHEREUM_ADDRESS,
      chainId: currentConfirmation?.chainId as Hex | undefined,
    }));
  }, [addressesToCheck, currentConfirmation?.chainId]);

  const trustSignals = useTrustSignals(trustSignalsRequests);

  return useMemo(() => {
    if (addressesToCheck.length === 0 || !isSecurityAlertsAPIEnabled()) {
      return [];
    }

    const alerts: Alert[] = [];

    trustSignals.forEach((signal, index) => {
      const { address, nestedTransactionIndex } = addressesToCheck[index];
      const isNested = nestedTransactionIndex !== undefined;
      const field = isNested
        ? `${RowAlertKey.InteractingWith}-${nestedTransactionIndex}`
        : RowAlertKey.InteractingWith;

      if (signal.state === TrustSignalDisplayState.Malicious) {
        alerts.push({
          actions: [],
          field,
          isBlocking: false,
          key: isNested
            ? `trustSignalMalicious-${nestedTransactionIndex}`
            : 'trustSignalMalicious',
          message: t(
            isNested
              ? 'alertMessageNestedAddressTrustSignalMaliciousWithAddress'
              : 'alertMessageAddressTrustSignalMaliciousWithAddress',
            [shortenAddress(address)],
          ),
          reason: t(
            isNested
              ? 'alertReasonNestedAddressTrustSignalMalicious'
              : 'alertReasonAddressTrustSignalMalicious',
          ),
          severity: Severity.Danger,
        });
      } else if (signal.state === TrustSignalDisplayState.Warning) {
        alerts.push({
          actions: [],
          field,
          isBlocking: false,
          key: isNested
            ? `trustSignalWarning-${nestedTransactionIndex}`
            : 'trustSignalWarning',
          message: t(
            isNested
              ? 'alertMessageNestedAddressTrustSignalWarningWithAddress'
              : 'alertMessageAddressTrustSignalWarningWithAddress',
            [shortenAddress(address)],
          ),
          reason: t(
            isNested
              ? 'alertReasonNestedAddressTrustSignalWarning'
              : 'alertReasonAddressTrustSignalWarning',
          ),
          severity: Severity.Warning,
        });
      }
    });

    return alerts;
  }, [addressesToCheck, trustSignals, t]);
}
