import React, { useEffect } from 'react';
import { Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import { useRiveWasmAnimation } from '../../../contexts/rive-wasm';

const ShieldIllustrationAnimation = ({
  containerClassName,
  canvasClassName,
}: {
  containerClassName?: string;
  canvasClassName?: string;
}) => {
  const { rive, RiveComponent } = useRiveWasmAnimation({
    url: './images/riv_animations/shield_illustration.riv',
    riveParams: {
      stateMachines: 'Shield_Illustration',
      autoplay: false,
      layout: new Layout({
        fit: Fit.Contain,
        alignment: Alignment.Center,
      }),
    },
  });

  // Trigger the animation start when rive is loaded
  useEffect(() => {
    if (rive) {
      const inputs = rive.stateMachineInputs('Shield_Illustration');
      if (inputs) {
        const startTrigger = inputs.find((input) => input.name === 'Start');
        if (startTrigger) {
          startTrigger.fire();
        }
        rive.play();
      }
    }
  }, [rive]);

  // Don't render Rive component until WASM and buffer are ready to avoid errors
  if (!rive) {
    return <Box className={containerClassName}></Box>;
  }

  return (
    <Box className={containerClassName}>
      <RiveComponent className={canvasClassName} />
    </Box>
  );
};

export default ShieldIllustrationAnimation;
