import React, { useRef, useEffect } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import Spinner from '../../../components/ui/spinner';

type FoxAppearAnimationProps = {
  isLoader: boolean;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function FoxAppearAnimation({
  isLoader = false,
}: FoxAppearAnimationProps) {
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const { rive, RiveComponent } = useRive({
    src: './images/riv_animations/fox_appear.riv',
    stateMachines: 'FoxRaiseUp',
    enableRiveAssetCDN: true,
    autoplay: false,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  // Trigger the animation start when rive is loaded
  useEffect(() => {
    if (rive) {
      // Get the state machine inputs
      const inputs = rive.stateMachineInputs('FoxRaiseUp');

      console.log('inputs', inputs);

      if (inputs) {
        // Fire the Start trigger to begin the animation
        // (Fox raises up from bottom of the artboard)
        const startTrigger = inputs.find((input) => input.name === 'Start');
        if (startTrigger) {
          startTrigger.fire();
        }

        // Fire the Loader trigger to show loading animation
        // (Fox moves to center and looks left/right with blinks)
        if (isLoader) {
          const loaderTrigger = inputs.find((input) => input.name === 'Loader');
          if (loaderTrigger) {
            loaderTrigger.fire();
          }
        }

        // Play the state machine
        rive.play();
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [rive]);

  return (
    <Box
      className={`${isLoader ? 'riv-animation__fox-container--loader' : 'riv-animation__fox-container'}`}
    >
      <RiveComponent className="riv-animation__canvas" />
      {isLoader && <Spinner className="riv-animation__spinner" />}
    </Box>
  );
}
