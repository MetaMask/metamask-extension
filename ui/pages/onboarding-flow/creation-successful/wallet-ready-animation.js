import React, { useEffect } from 'react';
import { useRive, Layout, Fit, Alignment } from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function WalletReadyAnimation() {
  const { rive, RiveComponent } = useRive({
    src: './images/riv_animations/wallet_ready.riv',
    stateMachines: 'OnboardingLoader',
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
      const inputs = rive.stateMachineInputs('OnboardingLoader');

      if (inputs) {
        const startTrigger = inputs.find((input) => input.name === 'Start');
        if (startTrigger) {
          startTrigger.fire();
        }

        // Play the state machine
        rive.play();
      }
    }
  }, [rive]);

  // In test environments, skip animation entirely to avoid CDN network requests
  if (process.env.IN_TEST) {
    return <Box className="riv-animation__wallet-ready-container"></Box>;
  }

  return (
    <Box className="riv-animation__wallet-ready-container">
      <RiveComponent className="riv-animation__canvas" />
    </Box>
  );
}
