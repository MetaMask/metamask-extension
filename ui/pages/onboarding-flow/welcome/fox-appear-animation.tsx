import React, { Suspense } from 'react';
import { Box } from '@metamask/design-system-react';
import classnames from 'clsx';
import { mmLazy } from '../../../helpers/utils/mm-lazy';

type FoxAppearAnimationProps = {
  isLoader?: boolean;
  skipTransition?: boolean;
};

const FoxAppearAnimationContent = mmLazy(
  // eslint-disable-next-line import-x/extensions -- needed for mmLazy
  () => import('./fox-appear-animation-content.tsx'),
);

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function FoxAppearAnimation({
  isLoader = false,
  skipTransition = false,
}: FoxAppearAnimationProps) {
  const containerClassName = classnames({
    'riv-animation__fox-container--loader': isLoader,
    'riv-animation__fox-container': !isLoader,
  });
  const context = useRiveWasmContext();
  const { isWasmReady, error: wasmError } = context;
  const {
    buffer,
    error: bufferError,
    loading: bufferLoading,
  } = useRiveWasmFile('./images/riv_animations/fox_appear.riv');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (wasmError) {
      console.error(
        '[Rive - FoxAppearAnimation] Failed to load WASM:',
        wasmError,
      );
    }
    if (bufferError) {
      console.error(
        '[Rive - FoxAppearAnimation] Failed to load buffer:',
        bufferError,
      );
    }
  }, [wasmError, bufferError]);

  // Use the buffer parameter instead of src
  const { riveFile, status } = useRiveFile({
    buffer,
  });

  // Only initialize Rive after WASM is ready and riveFile is loaded
  const { rive, RiveComponent } = useRive({
    riveFile: riveFile ?? undefined,
    stateMachines: riveFile ? 'FoxRaiseUp' : undefined,
    autoplay: false,
    layout: new Layout({
      fit: Fit.Contain,
      alignment: isLoader ? Alignment.Center : Alignment.BottomCenter,
    }),

  return (
    <Suspense
      fallback={
        <Box className={containerClassName}>
          {isLoader && (
            <img
              data-testid="loading-indicator"
              className="riv-animation__spinner"
              src="./images/spinner.gif"
              alt=""
            />
          )}
        </Box>
      }
    >
      <FoxAppearAnimationContent
        isLoader={isLoader}
        skipTransition={skipTransition}
      />
    </Suspense>
  );
}
