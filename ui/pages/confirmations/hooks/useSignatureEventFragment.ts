import { useCallback } from 'react';
import { generateSignatureUniqueId } from '../../../helpers/utils/metrics';
import { updateEventFragment } from '../../../store/actions';

import type { MetaMetricsEventFragment } from '../../../../shared/constants/metametrics';
import { useSignatureRequest } from './signatures/useSignatureRequest';

/**
 * When a signature has been requested, there should be an event fragment created for it in
 * {@see {@link app/scripts/lib/createRPCMethodTrackingMiddleware.js}.
 * This hook method is used to update an existing signature event fragment for a signature confirmation.
 */
export const useSignatureEventFragment = () => {
  const currentConfirmation = useSignatureRequest();

  const requestId = currentConfirmation?.msgParams?.requestId;
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
