import React, { useCallback, useEffect, useRef } from 'react';
import {
  Layout,
  Fit,
  Alignment,
  StateMachineInput,
} from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import { useRiveWasmAnimation } from '../../../contexts/rive-wasm';

// State machine and input names as constants
const STATE_MACHINE_NAME = 'shield_banner_illustration';
const INPUT_NAMES = {
  DARK: 'Dark',
  START: 'Start',
} as const;

const ShieldBannerAnimation = ({
  containerClassName,
  canvasClassName,
  isInactive = false,
}: {
  containerClassName?: string;
  canvasClassName?: string;
  isInactive?: boolean;
}) => {
  const { rive, RiveComponent, canRenderRive } = useRiveWasmAnimation({
    url: './images/riv_animations/shield_banner.riv',
    riveParams: {
      stateMachines: STATE_MACHINE_NAME,
      autoplay: false,
      layout: new Layout({
        fit: Fit.Contain,
        alignment: Alignment.Center,
      }),
    },
  });

  const inputsRef = useRef<{
    dark?: StateMachineInput;
    start?: StateMachineInput;
  }>({});

  // Track if animation has been initialized (using ref to avoid triggering watcher effects)
  const isInitializedRef = useRef(false);

  // Cache and initialize state machine inputs
  const cacheInputs = useCallback(() => {
    if (!rive) {
      return false;
    }
    const inputs = rive.stateMachineInputs(STATE_MACHINE_NAME);
    if (!inputs) {
      return false;
    }
    inputsRef.current = {
      dark: inputs.find((input) => input.name === INPUT_NAMES.DARK),
      start: inputs.find((input) => input.name === INPUT_NAMES.START),
    };
    return true;
  }, [rive]);

  // Trigger the animation start when rive is loaded
  useEffect(() => {
    const shouldInitialize = rive && !isInitializedRef.current;
    if (shouldInitialize && cacheInputs()) {
      const { dark, start } = inputsRef.current;

      // Set the Dark toggle based on current theme
      if (dark) {
        dark.value = isInactive;
      }

      if (start) {
        start.fire();
      }

      rive.play();
      isInitializedRef.current = true;
    }
    // it's intended to trigger the animation when the rive is loaded
  }, [rive, cacheInputs]);

  // Watch for changes to isInactive and update the dark toggle
  useEffect(() => {
    // Skip if not initialized yet (initialization effect handles the first trigger)
    if (!isInitializedRef.current || !rive) {
      return;
    }

    const { dark, start } = inputsRef.current;
    if (dark) {
      dark.value = isInactive;
    }
    if (start) {
      start.fire();
    }
    // it's intended to trigger the animation when the isInactive changes
  }, [isInactive]);

  // Stop animation on unmount or when rive instance changes
  useEffect(() => {
    return () => {
      isInitializedRef.current = false;
    };
    // it's intended to stop the animation when the component unmounts
  }, []);

  // Don't render Rive component until WASM and buffer are ready to avoid errors
  if (!canRenderRive) {
    return <Box className={containerClassName}></Box>;
  }

  return (
    <Box className={containerClassName}>
      <RiveComponent className={canvasClassName} />
    </Box>
  );
};

export default ShieldBannerAnimation;
