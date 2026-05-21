import React, { useEffect, useMemo } from 'react';
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
// eslint-disable-next-line import-x/no-restricted-paths
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import {
  getPerpsTutorialAnimationLayout,
  RIVE_COMPONENT_STYLE,
} from './PerpsTutorialAnimation.utils';

type PerpsTutorialAnimationProps = {
  artboardName: string;
  className?: string;
  fit?: Fit;
  alignment?: Alignment;
};

const PerpsTutorialAnimation: React.FC<PerpsTutorialAnimationProps> = ({
  artboardName,
  className,
  fit: fitProp,
  alignment = Alignment.Center,
}) => {
  const theme = useTheme();
  const isDarkTheme = theme === ThemeType.dark;
  const environmentType = getEnvironmentType();

  // Get viewport-specific container style and fit mode
  const { containerStyle, defaultFit } = useMemo(
    () => getPerpsTutorialAnimationLayout(environmentType),
    [environmentType],
  );
  const fit = fitProp ?? defaultFit;

  const riveUrl = isDarkTheme
    ? './images/riv_animations/perps-onboarding-carousel-dark.riv'
    : './images/riv_animations/perps-onboarding-carousel-light.riv';

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

  const layout = useMemo(
    () =>
      new Layout({
        fit,
        alignment,
      }),
    [fit, alignment],
  );

  const { rive, RiveComponent } = useRive({
    riveFile: riveFile ?? undefined,
    artboard: riveFile ? artboardName : undefined,
    autoplay: false,
    layout,
  });

  useEffect(() => {
    if (rive && isWasmReady && !bufferLoading && buffer) {
      rive.play();
    }
  }, [rive, isWasmReady, bufferLoading, buffer]);

  // Cleanup Rive animation resources on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (rive) {
        rive.cleanup();
      }
    };
  }, [rive]);

  if (
    !isWasmReady ||
    bufferLoading ||
    !buffer ||
    status === 'loading' ||
    status === 'failed'
  ) {
    return (
      <Box
        className={className}
        style={containerStyle}
        data-testid="perps-tutorial-animation-loading"
      />
    );
  }

  return (
    <Box
      className={className}
      style={containerStyle}
      data-testid="perps-tutorial-animation"
    >
      <RiveComponent style={RIVE_COMPONENT_STYLE} />
    </Box>
  );
};

export default PerpsTutorialAnimation;
