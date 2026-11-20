import React from 'react';
import { Alignment, Fit, Layout, useRive } from '@rive-app/react-canvas';
import { Box, BoxAlignItems } from '@metamask/design-system-react';
import { useRiveFileLavamoat } from '../../../../hooks/useRiveFileLavamoat';

const SOURCE = './images/riv_animations/loading_mm_fox.riv';
const ARTBOARD = 'Loading';
const STATE_MACHINE = 'State Machine 1';
const LAYOUT = new Layout({
  fit: Fit.Contain,
  alignment: Alignment.Center,
});

const LoadingFoxAnimation = () => {
  const { riveFile, status } = useRiveFileLavamoat({ src: SOURCE });
  const { RiveComponent } = useRive({
    riveFile: riveFile ?? undefined,
    artboard: riveFile ? ARTBOARD : undefined,
    stateMachines: riveFile ? STATE_MACHINE : undefined,
    autoplay: true,
    layout: LAYOUT,
  });

  return (
    <Box
      alignItems={BoxAlignItems.Center}
      className="relative h-[144px] w-[144px] justify-center"
      data-testid="qr-sync-loading-indicator"
    >
      {status === 'success' ? (
        <RiveComponent
          className="absolute left-1/2 top-1/2 h-[104px] w-[104px] -translate-x-1/2 -translate-y-1/2"
          data-testid="qr-sync-loading-fox-animation"
        />
      ) : null}
    </Box>
  );
};

export default LoadingFoxAnimation;
