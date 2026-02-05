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

const RIVE_COMPONENT_STYLE: React.CSSProperties = {
  width: '100%',
  height: '100%',
};

/**
 * Get container styles based on viewport type.
 * New RIV files have 280px artboard height.
 * Side panel uses Fit.Contain to prevent horizontal cutoff on wider animations.
 * Wider viewports use Fit.Cover with max-width constraints.
 *
 * @param environmentType
 */
const getContainerStyle = (
  environmentType: string,
): { style: React.CSSProperties; fit: Fit } => {
  const baseStyle: React.CSSProperties = {
    height: '280px',
    width: '100%',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };

  if (environmentType === ENVIRONMENT_TYPE_SIDEPANEL) {
    // Side panel: Use Fit.Contain to prevent horizontal cutoff on steps 3 & 4
    return { style: baseStyle, fit: Fit.Contain };
  }

  if (environmentType === ENVIRONMENT_TYPE_POPUP) {
    // Popup: Constrain width slightly to reduce scaling
    return {
      style: { ...baseStyle, maxWidth: '340px' },
      fit: Fit.Cover,
    };
  }

  // Fullscreen: Constrain narrower to prevent cutoff on steps with more text
  return {
    style: { ...baseStyle, maxWidth: '280px' },
    fit: Fit.Cover,
  };
};

const PerpsTutorialAnimation: React.FC<PerpsTutorialAnimationProps> = ({
  artboardName,
  className,
  fit: fitProp,
  alignment = Alignment.Center,
}) => {
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
