import { useCallback } from 'react';
import { generateSignatureUniqueId } from '../../../helpers/utils/metrics';
import { updateEventFragment } from '../../../store/actions';
import { SignatureRequestType } from '../types/confirm';
import { isSignatureTransactionType } from '../utils';
import type { MetaMetricsEventFragment } from '../../../../shared/constants/metametrics';
import { useSignatureRequestOptional } from './useSignatureRequest';
import { useTransactionMetadataRequestOptional } from './useTransactionMetadataRequest';

/**
 * When a signature has been requested, there should be an event fragment created for it in
 * {@see {@link app/scripts/lib/createRPCMethodTrackingMiddleware.js}.
 * This hook method is used to update an existing signature event fragment for a signature confirmation.
 */
export const useSignatureEventFragment = () => {
  const transactionMetadata = useTransactionMetadataRequestOptional();
  const signatureRequest = useSignatureRequestOptional();
  const currentConfirmation = transactionMetadata ?? signatureRequest;

  const requestId =
    isSignatureTransactionType(currentConfirmation) &&
    ((currentConfirmation as SignatureRequestType)?.msgParams
      ?.requestId as number);
  const fragmentId = requestId ? generateSignatureUniqueId(requestId) : null;

  const updateSignatureEventFragment = useCallback(
    async (fragmentPayload: Partial<MetaMetricsEventFragment>) => {
      if (!fragmentId) {
        return;
      }

      updateEventFragment(fragmentId, fragmentPayload);
    },
    [fragmentId],
  );

  return { updateSignatureEventFragment };
};
