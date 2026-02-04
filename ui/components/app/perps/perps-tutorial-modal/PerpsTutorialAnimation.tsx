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
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../../../shared/constants/app';

type PerpsTutorialAnimationProps = {
  artboardName: string;
  className?: string;
  fit?: Fit;
  alignment?: Alignment;
};

/**
 * Get container styles based on viewport type.
 * Side panel (~320px) works perfectly with Fit.Cover.
 * For wider viewports, we constrain max-width to prevent over-scaling.
 */
const getContainerStyle = (
  environmentType: string,
): { style: React.CSSProperties; fit: Fit } => {
  const baseStyle: React.CSSProperties = {
    height: '300px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  if (environmentType === ENVIRONMENT_TYPE_SIDEPANEL) {
    // Side panel: Fit.Cover works perfectly at this width
    return { style: baseStyle, fit: Fit.Cover };
  }

  if (environmentType === ENVIRONMENT_TYPE_POPUP) {
    // Popup: Constrain width slightly to reduce scaling
    return {
      style: { ...baseStyle, maxWidth: '340px' },
      fit: Fit.Cover,
    };
  }

  // Fullscreen: Constrain to side panel width for consistent display
  return {
    style: { ...baseStyle, maxWidth: '320px' },
    fit: Fit.Cover,
  };
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function PerpsTutorialAnimation({
  artboardName,
  className,
  fit: fitProp,
  alignment = Alignment.Center,
}: PerpsTutorialAnimationProps) {
  const theme = useTheme();
  const isDarkTheme = theme === ThemeType.dark;

  // Get viewport-specific container style and fit mode
  const environmentType = getEnvironmentType();
  const { style: containerStyle, fit: defaultFit } = useMemo(
    () => getContainerStyle(environmentType),
    [environmentType],
  );
  const fit = fitProp ?? defaultFit;

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
      <RiveComponent style={{ width: '100%', height: '100%' }} />
    </Box>
  );
}
