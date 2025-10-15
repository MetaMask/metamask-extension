import React, { useEffect } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import { useTheme } from '../../../hooks/useTheme';
import { ThemeType } from '../../../../shared/constants/preferences';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function WalletReadyAnimation() {
  const theme = useTheme();
  const isTestEnvironment = Boolean(process.env.IN_TEST);

  const { rive, RiveComponent } = useRive({
    src: isTestEnvironment ? '' : './images/riv_animations/wallet_ready.riv',
    stateMachines: 'OnboardingLoader',
    enableRiveAssetCDN: !isTestEnvironment,
    autoplay: false,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: Alignment.Center,
    }),
  });

  // Trigger the animation start when rive is loaded
  useEffect(() => {
    if (rive) {
      const inputs = rive.stateMachineInputs('OnboardingLoader');
      if (inputs) {
        const startTrigger = inputs.find((input) => input.name === 'Start');
        if (startTrigger) {
          startTrigger.fire();
        }

        const darkToggle = inputs.find((input) => input.name === 'Dark mode');
        if (darkToggle && theme === ThemeType.dark) {
          darkToggle.value = true;
        } else if (darkToggle) {
          darkToggle.value = false;
        }

        const endTrigger = inputs.find((input) => input.name === 'End');
        setTimeout(() => {
          if (endTrigger) {
            endTrigger.fire();
          }
        }, 1000);

        // Play the state machine
        rive.play();
      }
    }
  }, [rive, theme]);

  // In test environments, skip animation entirely to avoid CDN network requests
  if (process.env.IN_TEST) {
    return <Box className="riv-animation__fox-container"></Box>;
  }

  return (
    <Box className="riv-animation__wallet-ready-container">
      <RiveComponent className="riv-animation__canvas" />
    </Box>
  );
}
