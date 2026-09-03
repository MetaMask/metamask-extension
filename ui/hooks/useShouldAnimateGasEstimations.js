import { useRef, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { isEqual } from 'lodash';

import {
  getGasLoadingAnimationIsShowing,
  toggleGasLoadingAnimation,
} from '../ducks/app/app';
import { useDispatch } from '../store/hooks';
import { useGasFeeEstimates } from './useGasFeeEstimates';

export function useShouldAnimateGasEstimations() {
  const { isGasEstimatesLoading, gasFeeEstimates } = useGasFeeEstimates();
  const dispatch = useDispatch();

  const isGasLoadingAnimationActive = useSelector(
    getGasLoadingAnimationIsShowing,
  );

  // Do the animation only when gas prices have changed...
  const [lastGasEstimates, setLastGasEstimates] = useState(gasFeeEstimates);
  const gasEstimatesChanged = !isEqual(lastGasEstimates, gasFeeEstimates);

  // ... and only if gas didn't just load
  // Removing this line will cause the initial loading screen to stay empty
  const gasJustLoaded = isEqual(lastGasEstimates, {});

  if (gasEstimatesChanged) {
    setLastGasEstimates(gasFeeEstimates);
  }

  const showLoadingAnimation =
    isGasEstimatesLoading || (gasEstimatesChanged && !gasJustLoaded);

  const hideAnimationTimerRef = useRef(undefined);

  useEffect(() => {
    if (
      isGasLoadingAnimationActive === false &&
      showLoadingAnimation === true
    ) {
      dispatch(toggleGasLoadingAnimation(true));
    }
  }, [dispatch, isGasLoadingAnimationActive, showLoadingAnimation]);

  useEffect(() => {
    if (isGasLoadingAnimationActive && !showLoadingAnimation) {
      hideAnimationTimerRef.current = setTimeout(() => {
        dispatch(toggleGasLoadingAnimation(false));
      }, 2000);
    }

    return () => {
      if (hideAnimationTimerRef.current) {
        clearTimeout(hideAnimationTimerRef.current);
        hideAnimationTimerRef.current = undefined;
      }
    };
  }, [dispatch, isGasLoadingAnimationActive, showLoadingAnimation]);
}
