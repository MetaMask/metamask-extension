import React, { Suspense } from 'react';
import { Box } from '@metamask/design-system-react';
import { mmLazy } from '../../../helpers/utils/mm-lazy';

const ShieldIllustrationAnimationContent = mmLazy(
  // eslint-disable-next-line import-x/extensions -- needed for mmLazy
  () => import('./shield-illustration-animation-content.tsx'),
);

const ShieldIllustrationAnimation = ({
  containerClassName,
  canvasClassName,
}: {
  containerClassName?: string;
  canvasClassName?: string;
}) => {
  return (
    <Suspense fallback={<Box className={containerClassName}></Box>}>
      <ShieldIllustrationAnimationContent
        containerClassName={containerClassName}
        canvasClassName={canvasClassName}
      />
    </Suspense>
  );
};

export default ShieldIllustrationAnimation;
