import React, { Suspense } from 'react';
import { Box } from '@metamask/design-system-react';
import { mmLazy } from '../../../helpers/utils/mm-lazy';

type FoxAppearAnimationProps = {
  isLoader?: boolean;
  skipTransition?: boolean;
};

const FoxAppearAnimationContent = mmLazy(
  () => import('./fox-appear-animation-content'),
);

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function FoxAppearAnimation({
  isLoader = false,
  skipTransition = false,
}: FoxAppearAnimationProps) {
  return (
    <Suspense
      fallback={
        <Box
          className={`${isLoader ? 'riv-animation__fox-container--loader' : 'riv-animation__fox-container'}`}
        >
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
