import { useRef } from 'react';
import { isEqual } from 'lodash';

import { useGasFeeEstimates } from './useGasFeeEstimates';

export function useShouldAnimateGasEstimations() {
  const { isGasEstimatesLoading, gasFeeEstimates } = useGasFeeEstimates();

  // Do the animation only when gas prices have changed...
  const lastGasEstimates = useRef(gasFeeEstimates);
  const gasEstimatesChanged = !isEqual(
    lastGasEstimates.current,
    gasFeeEstimates,
  );

  // ... and only if gas didn't just load
  // Removing this line will cause the initial loading screen to stay empty
  const gasJustLoaded = isEqual(lastGasEstimates.current, {});

  if (gasEstimatesChanged) {
    lastGasEstimates.current = gasFeeEstimates;
  }

  const showLoadingAnimation =
    isGasEstimatesLoading || (gasEstimatesChanged && !gasJustLoaded);

  return showLoadingAnimation;
}
