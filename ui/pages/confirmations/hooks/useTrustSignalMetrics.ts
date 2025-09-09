import { useCallback, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';

import { getAddressSecurityAlertResponse } from '../../../selectors';
import { useConfirmContext } from '../context/confirm';
import { updateEventFragment } from '../../../store/actions';
import { generateSignatureUniqueId } from '../../../helpers/utils/metrics';
import { isSignatureTransactionType } from '../utils';
import type { Confirmation, SignatureRequestType } from '../types/confirm';
import { ResultType } from '../../../../app/scripts/lib/trust-signals/types';

export type TrustSignalMetricsProperties = {
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  address_alert_response?: ResultType;

  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  anonymousProperties?: {
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
    // eslint-disable-next-line @typescript-eslint/naming-convention
    address_label?: string;
  };
};

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

function updateTransactionEventFragments(
  transactionId: string,
  properties: TrustSignalMetricsProperties,
): void {
  const addedFragmentId = `transaction-added-${transactionId}`;
  const submittedFragmentId = `transaction-submitted-${transactionId}`;

  updateEventFragment(addedFragmentId, { properties });
  updateEventFragment(submittedFragmentId, { properties });

  // Update anonymous events with sensitive properties (includes address_label)
  if (properties.anonymousProperties?.address_label) {
    updateEventFragment(addedFragmentId, {
      sensitiveProperties: properties,
    });
    updateEventFragment(submittedFragmentId, {
      sensitiveProperties: properties,
    });
  }
}

/**
 * Updates signature event fragments with trust signal metrics
 */
function updateSignatureEventFragments(
  confirmation: SignatureRequestType,
  properties: TrustSignalMetricsProperties,
): void {
  // TODO: Implement completely when adding signature support.
  // const requestId = confirmation?.msgParams?.requestId as number;
  // if (!requestId) {
  //   return;
  // }
  // const fragmentId = generateSignatureUniqueId(requestId);
  // updateEventFragment(fragmentId, { properties });
  // if (properties.anonymousProperties?.address_label) {
  //   updateEventFragment(fragmentId, {
  //     sensitiveProperties: properties,
  //   });
  // }
}

function updateConfirmationEventFragments(
  confirmation: Confirmation,
  properties: TrustSignalMetricsProperties,
): void {
  const confirmationId = confirmation?.id ?? '';

  if (isSignatureTransactionType(confirmation)) {
    updateSignatureEventFragments(
      confirmation as SignatureRequestType,
      properties,
    );
    return;
  }
  updateTransactionEventFragments(confirmationId, properties);
}

export function useTrustSignalMetrics() {
  const { currentConfirmation } = useConfirmContext();

  const addressToCheck = useMemo(
    () => getTargetAddress(currentConfirmation),
    [currentConfirmation],
  );

  const addressSecurityAlertResponse = useSelector((state) =>
    addressToCheck
      ? getAddressSecurityAlertResponse(state, addressToCheck)
      : undefined,
  );

  const properties = useMemo((): TrustSignalMetricsProperties => {
    if (!addressSecurityAlertResponse) {
      return {};
    }

    return {
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      address_alert_response: addressSecurityAlertResponse.result_type,
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
      // eslint-disable-next-line @typescript-eslint/naming-convention
      anonymousProperties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        address_label: addressSecurityAlertResponse.label || undefined,
      },
    };
  }, [addressToCheck, addressSecurityAlertResponse]);

  const updateTrustSignalMetrics = useCallback(() => {
    if (!addressSecurityAlertResponse || !currentConfirmation) {
      return;
    }

    updateConfirmationEventFragments(currentConfirmation, properties);
  }, [properties, currentConfirmation, addressSecurityAlertResponse]);

  useEffect(() => {
    updateTrustSignalMetrics();
  }, [updateTrustSignalMetrics]);
}
