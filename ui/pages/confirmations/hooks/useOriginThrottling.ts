import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { resetOriginThrottlingState } from '../../../store/actions';
import {
  NUMBER_OF_REJECTIONS_THRESHOLD,
  REJECTION_THRESHOLD_IN_MS,
} from '../../../../shared/constants/origin-throttling';

import { MetaMaskReduxState } from '../../../store/store';
import useCurrentConfirmation from './useCurrentConfirmation';

type ThrottledOrigin = {
  rejections: number;
  lastRejection: number;
};

type ThrottledOrigins = {
  [origin: string]: ThrottledOrigin;
};

const getThrottledOrigins = (state: MetaMaskReduxState): ThrottledOrigins =>
  state.metamask.throttledOrigins;

const willNextRejectionReachThreshold = (originState: ThrottledOrigin) => {
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

export default function useOriginThrottling() {
  const dispatch = useDispatch();
  const throttledOrigins = useSelector(getThrottledOrigins);
  const { currentConfirmation } = useCurrentConfirmation();
  const origin =
    currentConfirmation?.origin || currentConfirmation?.messageParams?.origin;
  const originState = throttledOrigins[origin];

  const resetOrigin = useCallback(async () => {
    await dispatch(resetOriginThrottlingState(origin));
  }, [dispatch, origin]);

  return {
    origin,
    resetOrigin,
    willNextRejectionReachThreshold:
      willNextRejectionReachThreshold(originState),
  };
}
