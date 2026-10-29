import { useMemo } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import type { Hex } from '@metamask/utils';
import { Alert } from '../../../../ducks/confirm-alerts/confirm-alerts';
import { RowAlertKey } from '../../../../components/app/confirm/info/row/constants';
import { useConfirmContext } from '../../context/confirm';
import { useTrustSignals } from '../../../../hooks/useTrustSignals';
import { SignatureRequestType } from '../../types/confirm';
import { useI18nContext } from '../../../../hooks/useI18nContext';
// eslint-disable-next-line import-x/no-restricted-paths
import { isSecurityAlertsAPIEnabled } from '../../../../../app/scripts/lib/ppom/security-alerts-api';
import {
  buildTrustSignalAlerts,
  buildTrustSignalRequests,
  TrustSignalAlertTarget,
} from './utils';

export function useAddressTrustSignalAlerts(): Alert[] {
  const { currentConfirmation } = useConfirmContext();
  const t = useI18nContext();

  const addressesToCheck = useMemo(() => {
    if (!currentConfirmation) {
      return [];
    }

    const addresses: TrustSignalAlertTarget[] = [];

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
    return buildTrustSignalRequests(
      addressesToCheck,
      currentConfirmation?.chainId as Hex | undefined,
    );
  }, [addressesToCheck, currentConfirmation?.chainId]);

  const trustSignals = useTrustSignals(trustSignalsRequests);

  return useMemo(() => {
    if (addressesToCheck.length === 0 || !isSecurityAlertsAPIEnabled()) {
      return [];
    }

    return buildTrustSignalAlerts({
      targets: addressesToCheck,
      trustSignals,
      field: RowAlertKey.InteractingWith,
      keyPrefix: 'trustSignal',
      t,
    });
  }, [addressesToCheck, trustSignals, t]);
}
