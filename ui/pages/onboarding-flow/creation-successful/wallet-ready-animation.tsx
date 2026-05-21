import React, { Suspense } from 'react';
import { Box } from '@metamask/design-system-react';
import { mmLazy } from '../../../helpers/utils/mm-lazy';

const WalletReadyAnimationContent = mmLazy(
  () => import('./wallet-ready-animation-content.tsx'),
);

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function WalletReadyAnimation() {
  return (
    <Suspense
      fallback={<Box className="riv-animation__wallet-ready-container" />}
    >
      <WalletReadyAnimationContent />
    </Suspense>
  );
}
