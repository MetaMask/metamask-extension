/* eslint-disable react-hooks/rules-of-hooks */
import React, { useRef, useEffect } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import { useTheme } from '../../../hooks/useTheme';
import { ThemeType } from '../../../../shared/constants/preferences';

type MetamaskWordMarkAnimationProps = {
  setIsAnimationComplete: (isAnimationComplete: boolean) => void;
  isAnimationComplete: boolean;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function MetamaskWordMarkAnimation({
  setIsAnimationComplete,
  isAnimationComplete,
}: MetamaskWordMarkAnimationProps) {
  const isTestEnvironment = process.env.IN_TEST;

  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const theme = useTheme();

  const { rive, RiveComponent } = useRive({
    src: isTestEnvironment
      ? ''
      : './images/riv_animations/metamask_wordmark.riv',
    stateMachines: 'WordmarkBuildUp',
    enableRiveAssetCDN: !isTestEnvironment,
    autoplay: false,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
    onStateChange: (event) => {
      // The event.data contains an array of state names
      if (event.data && Array.isArray(event.data)) {
        // Clear any existing timeout to avoid multiple triggers
        if (animationTimeoutRef.current) {
          clearTimeout(animationTimeoutRef.current);
        }

        // Set a timeout after state change to detect animation completion
        // Adjust this timeout to match your animation's actual duration
        animationTimeoutRef.current = setTimeout(() => {
          if (!isAnimationComplete) {
            setIsAnimationComplete(true);
          }
        }, 2500); // Adjust this based on your animation duration (in milliseconds)
      }
    },
  });

  // Trigger the animation start when rive is loaded
  useEffect(() => {
    if (rive) {
      // Get the state machine inputs
      const inputs = rive.stateMachineInputs('WordmarkBuildUp');

      if (inputs) {
        // Set the Dark toggle based on system preference or default to true (dark mode)
        const darkToggle = inputs.find((input) => input.name === 'Dark');
        if (darkToggle && theme === ThemeType.dark) {
          darkToggle.value = true;
        }

        // Fire the Start trigger to begin the animation
        const startTrigger = inputs.find((input) => input.name === 'Start');
        if (startTrigger) {
          startTrigger.fire();

          // Play the state machine
          rive.play();
        }
      }
    }

    // Cleanup timeout on unmount
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, [rive, theme]);

  // In test environments, skip animation entirely and show buttons immediately
  // This prevents any Rive initialization and CDN network requests
  useEffect(() => {
    if (isTestEnvironment) {
      console.log('Test environment detected, skipping Rive animation');
      setIsAnimationComplete(true);
    }
  }, [isTestEnvironment, setIsAnimationComplete]);

  if (isTestEnvironment) {
    return (
      <Box
        className={`riv-animation__wordmark-container riv-animation__wordmark-container--complete`}
      />
    );
  }

  return (
    <Box
      className={`riv-animation__wordmark-container ${
        isAnimationComplete ? 'riv-animation__wordmark-container--complete' : ''
      }`}
    >
      <RiveComponent className="riv-animation__canvas" />
    </Box>
  );
}
