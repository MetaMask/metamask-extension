import React, { useEffect } from 'react';
import { Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import { useTheme } from '../../../hooks/useTheme';
import { ThemeType } from '../../../../shared/constants/preferences';
import { useRiveWasmAnimation } from '../../../contexts/rive-wasm';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function WalletReadyAnimation() {
  const theme = useTheme();
  const { rive, RiveComponent, canRenderRive } = useRiveWasmAnimation({
    url: './images/riv_animations/wallet_ready.riv',
    riveParams: {
      stateMachines: 'OnboardingLoader',
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
      const inputs = rive.stateMachineInputs('OnboardingLoader');
      if (inputs) {
        const darkToggle = inputs.find((input) => input.name === 'Dark mode');
        if (darkToggle && theme === ThemeType.dark) {
          darkToggle.value = true;
        } else if (darkToggle) {
          darkToggle.value = false;
        }

        const endTrigger = inputs.find((input) => input.name === 'Only_End');
        if (endTrigger) {
          endTrigger.fire();
        }

        // Play the state machine
        rive.play();
      }
    }
  }, [rive, theme]);

  // Don't render Rive component until WASM and buffer are ready to avoid errors
  if (!canRenderRive) {
    return <Box className="riv-animation__wallet-ready-container"></Box>;
  }

  return (
    <Box className="riv-animation__wallet-ready-container">
      <RiveComponent className="riv-animation__canvas" />
    </Box>
  );
}
