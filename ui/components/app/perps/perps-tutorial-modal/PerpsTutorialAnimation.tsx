import React, { useEffect } from 'react';
import {
  useRive,
  useRiveFile,
  Layout,
  Fit,
  Alignment,
} from '@rive-app/react-canvas';
import { Box } from '@metamask/design-system-react';
import {
  useRiveWasmContext,
  useRiveWasmFile,
} from '../../../../contexts/rive-wasm';
import { useTheme } from '../../../../hooks/useTheme';
import { ThemeType } from '../../../../../shared/constants/preferences';

type PerpsTutorialAnimationProps = {
  artboardName: string;
  className?: string;
  fit?: Fit;
  alignment?: Alignment;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function PerpsTutorialAnimation({
  artboardName,
  className = 'w-full h-[240px]',
  fit = Fit.FitWidth,
  alignment = Alignment.Center,
}: PerpsTutorialAnimationProps) {
  const theme = useTheme();
  const isDarkTheme = theme === ThemeType.dark;

  const riveUrl = isDarkTheme
    ? './images/riv_animations/perps_tutorial_dark.riv'
    : './images/riv_animations/perps_tutorial_light.riv';

  const context = useRiveWasmContext();
  const { isWasmReady, error: wasmError } = context;
  const {
    buffer,
    error: bufferError,
    loading: bufferLoading,
  } = useRiveWasmFile(riveUrl);

  useEffect(() => {
    if (wasmError) {
      console.error(
        '[Rive - PerpsTutorialAnimation] Failed to load WASM:',
        wasmError,
      );
    }
    if (bufferError) {
      console.error(
        '[Rive - PerpsTutorialAnimation] Failed to load buffer:',
        bufferError,
      );
    }
  }, [wasmError, bufferError]);

  const { riveFile, status } = useRiveFile({
    buffer,
  });

  const { rive, RiveComponent } = useRive({
    riveFile: riveFile ?? undefined,
    artboard: riveFile ? artboardName : undefined,
    autoplay: false,
    layout: new Layout({
      fit,
      alignment,
    }),
  });

  useEffect(() => {
    if (rive && isWasmReady && !bufferLoading && buffer) {
      rive.play();
    }
  }, [rive, isWasmReady, bufferLoading, buffer]);

  if (
    !isWasmReady ||
    bufferLoading ||
    !buffer ||
    status === 'loading' ||
    status === 'failed'
  ) {
    return (
      <Box
        className={`${className} flex items-center justify-center`}
        data-testid="perps-tutorial-animation-loading"
      />
    );
  }

  return (
    <Box className={className} data-testid="perps-tutorial-animation">
      <RiveComponent
        className="w-full h-full"
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </Box>
  );
}
