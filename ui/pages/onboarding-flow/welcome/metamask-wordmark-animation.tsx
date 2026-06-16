import React, { Suspense } from 'react';
import { Box } from '@metamask/design-system-react';
import { mmLazy } from '../../../helpers/utils/mm-lazy';

type MetamaskWordMarkAnimationProps = {
  setIsAnimationComplete: (isAnimationComplete: boolean) => void;
  isAnimationComplete?: boolean;
  skipTransition?: boolean;
};

const MetamaskWordMarkAnimationContent = mmLazy(
  // eslint-disable-next-line import-x/extensions -- needed for mmLazy
  () => import('./metamask-wordmark-animation-content.tsx'),
);

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function MetamaskWordMarkAnimation({
  setIsAnimationComplete,
  isAnimationComplete = false,
  skipTransition = false,
}: MetamaskWordMarkAnimationProps) {
  return (
    <Suspense fallback={<Box className="riv-animation__wordmark-container" />}>
      <MetamaskWordMarkAnimationContent
        setIsAnimationComplete={setIsAnimationComplete}
        isAnimationComplete={isAnimationComplete}
        skipTransition={skipTransition}
      />
    </Suspense>
  );
}
