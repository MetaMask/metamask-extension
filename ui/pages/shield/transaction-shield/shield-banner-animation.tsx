import React, { Suspense } from 'react';
import { Box } from '@metamask/design-system-react';
import { mmLazy } from '../../../helpers/utils/mm-lazy';

const ShieldBannerAnimationContent = mmLazy(
  () => import('./shield-banner-animation-content.js'),
);

const ShieldBannerAnimation = ({
  containerClassName,
  canvasClassName,
  isInactive = false,
}: {
  containerClassName?: string;
  canvasClassName?: string;
  isInactive?: boolean;
}) => {
  return (
    <Suspense fallback={<Box className={containerClassName}></Box>}>
      <ShieldBannerAnimationContent
        containerClassName={containerClassName}
        canvasClassName={canvasClassName}
        isInactive={isInactive}
      />
    </Suspense>
  );
};

export default ShieldBannerAnimation;
