import { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';

import { getAddressSecurityAlertResponse } from '../../../selectors';
import { useConfirmContext } from '../context/confirm';
import { isSignatureTransactionType } from '../utils';
import type { Confirmation, SignatureRequestType } from '../types/confirm';
// eslint-disable-next-line import/no-restricted-paths
import { ResultType } from '../../../../app/scripts/lib/trust-signals/types';
import { useTransactionEventFragment } from './useTransactionEventFragment';
import { useSignatureEventFragment } from './useSignatureEventFragment';

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
function getTargetAddress(confirmation: Confirmation): string | null {
  if (!isSignatureTransactionType(confirmation)) {
    const txMeta = confirmation as TransactionMeta;
    return txMeta.txParams.to ?? null;
  }
  try {
    const data = (confirmation as SignatureRequestType)?.msgParams?.data;
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
  const { currentConfirmation } = useConfirmContext();
  const { updateSignatureEventFragment } = useSignatureEventFragment();
  const { updateTransactionEventFragment } = useTransactionEventFragment();

  const addressToCheck = useMemo(
    () => getTargetAddress(currentConfirmation),
    [currentConfirmation],
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
    if (!addressSecurityAlertResponse || !currentConfirmation) {
      return;
    }

    const ownerId = currentConfirmation?.id ?? '';

    if (isSignatureTransactionType(currentConfirmation)) {
      console.log('updateSignatureEventFragment called');
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
    currentConfirmation,
    properties,
    anonymousProperties,
    updateSignatureEventFragment,
    updateTransactionEventFragment,
  ]);

  useEffect(() => {
    updateTrustSignalMetrics();
  }, [updateTrustSignalMetrics]);
}
