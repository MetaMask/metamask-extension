import { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';

import { getAddressSecurityAlertResponse } from '../../../selectors';
// eslint-disable-next-line import/no-restricted-paths
import { ResultType } from '../../../../app/scripts/lib/trust-signals/types';
import { useTransactionEventFragment } from '../../confirmations/hooks/useTransactionEventFragment';
import { useSignatureEventFragment } from '../../confirmations/hooks/useSignatureEventFragment';
import { useUnapprovedTransaction } from '../../confirmations/hooks/transactions/useUnapprovedTransaction';
import { useSignatureRequest } from '../../confirmations/hooks/signatures/useSignatureRequest';
import { SignatureRequestType } from '../../confirmations/types/confirm';

export type TrustSignalMetricsProperties = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  address_alert_response?: ResultType;
};

export type TrustSignalMetricsAnonProperties = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  address_label?: string;
};

// For transactions, this is the 'to' address. For signatures, this is the verifying contract.
function getTargetAddress(
  transactionMeta?: TransactionMeta,
  signatureRequest?: SignatureRequestType,
): string | null {
  if (!transactionMeta && !signatureRequest) {
    return null;
  }

  if (transactionMeta) {
    return transactionMeta.txParams?.to ?? null;
  }
  try {
    const data = signatureRequest?.msgParams?.data;
    const parsedData = typeof data === 'string' ? JSON.parse(data) : data;
    if (parsedData?.domain?.verifyingContract) {
      return parsedData.domain.verifyingContract;
    }
  } catch (e) {
    // do nothing
  }
  return null;
}

export function useTrustSignalMetrics() {
  const transactionMeta = useUnapprovedTransaction();
  const signatureRequest = useSignatureRequest();
  const { updateSignatureEventFragment } = useSignatureEventFragment();
  const { updateTransactionEventFragment } = useTransactionEventFragment();

  const addressToCheck = useMemo(
    () => getTargetAddress(transactionMeta, signatureRequest),
    [transactionMeta, signatureRequest],
  );

  const addressSecurityAlertResponse = useSelector((state) =>
    addressToCheck
      ? getAddressSecurityAlertResponse(state, addressToCheck)
      : undefined,
  );

  const { properties, anonymousProperties } = useMemo((): {
    properties: TrustSignalMetricsProperties;
    anonymousProperties: TrustSignalMetricsAnonProperties;
  } => {
    if (!addressSecurityAlertResponse) {
      return { properties: {}, anonymousProperties: {} };
    }

    return {
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        address_alert_response: addressSecurityAlertResponse.result_type,
      },
      anonymousProperties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        address_label: addressSecurityAlertResponse.label || undefined,
      },
    };
  }, [addressSecurityAlertResponse]);

  const updateTrustSignalMetrics = useCallback(() => {
    if (
      !addressSecurityAlertResponse ||
      (!transactionMeta && !signatureRequest)
    ) {
      return;
    }

    const ownerId = transactionMeta?.id ?? signatureRequest?.id ?? '';

    if (signatureRequest) {
      updateSignatureEventFragment({ properties });
      if (anonymousProperties.address_label) {
        updateSignatureEventFragment({
          sensitiveProperties: anonymousProperties,
        });
      }
    } else {
      updateTransactionEventFragment({ properties }, ownerId);
      if (anonymousProperties.address_label) {
        updateTransactionEventFragment(
          { sensitiveProperties: anonymousProperties },
          ownerId,
        );
      }
    }
  }, [
    addressSecurityAlertResponse,
    properties,
    anonymousProperties,
    signatureRequest,
    transactionMeta,
    updateSignatureEventFragment,
    updateTransactionEventFragment,
  ]);

  useEffect(() => {
    updateTrustSignalMetrics();
  }, [updateTrustSignalMetrics]);
}
