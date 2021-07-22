import { useEffect, useRef } from 'react';
import { isEqual } from 'lodash';

import { useGasFeeEstimates } from './useGasFeeEstimates';

const LOADING_CLASS = 'transaction-detail--loading';

export function useShouldAnimateGasEstimations(containerNode) {
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

  // When the loading animation completes, remove the className to reveal contents
  useEffect(() => {
    const eventName = 'transitionend';
    const node = containerNode?.current;
    const eventHandler = () => {
      node?.classList.remove(LOADING_CLASS);
    };

    node?.addEventListener(eventName, eventHandler);
    return () => {
      node?.removeEventListener(eventName, eventHandler);
    };
  }, [containerNode]);

  console.log("shouldAnimate?  ", showLoadingAnimation)

  return showLoadingAnimation ? LOADING_CLASS : null;
}
