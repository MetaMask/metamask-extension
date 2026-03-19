import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import type { ThrottledOrigin } from '../../../../shared/types/origin-throttling';
import { updateThrottledOriginState } from '../../../store/actions';

import { selectThrottledOrigins } from '../../../selectors';
import { useTransactionMetadataRequestOptional } from './useTransactionMetadataRequest';
import { useSignatureRequestOptional } from './useSignatureRequest';

const NUMBER_OF_REJECTIONS_THRESHOLD = 3;
const REJECTION_THRESHOLD_IN_MS = 30000;

const willNextRejectionReachThreshold = (
  originState?: ThrottledOrigin,
): boolean => {
  if (!originState) {
    return false;
  }
  const currentTime = Date.now();
  const { rejections, lastRejection } = originState;
  return (
    rejections + 1 >= NUMBER_OF_REJECTIONS_THRESHOLD &&
    currentTime - lastRejection <= REJECTION_THRESHOLD_IN_MS
  );
};

export function useOriginThrottling() {
  const dispatch = useDispatch();
  const throttledOrigins = useSelector(selectThrottledOrigins);

  const transactionMetadata = useTransactionMetadataRequestOptional();
  const signatureRequest = useSignatureRequestOptional();
  const currentConfirmation = transactionMetadata ?? signatureRequest;
  const currentConfirmationWithOrigin = currentConfirmation as
    | {
        origin?: string;
        messageParams?: {
          origin?: string;
        };
      }
    | undefined;

  const origin =
    currentConfirmationWithOrigin?.origin ||
    currentConfirmationWithOrigin?.messageParams?.origin;
  const originState = origin ? throttledOrigins[origin] : undefined;
  const shouldThrottleOrigin = willNextRejectionReachThreshold(originState);

  const resetOrigin = useCallback(() => {
    if (origin) {
      dispatch(
        updateThrottledOriginState(origin, {
          rejections: 0,
          lastRejection: 0,
        }),
      );
    }
  }, [dispatch, origin]);

  return {
    origin,
    resetOrigin,
    shouldThrottleOrigin,
  };
}
