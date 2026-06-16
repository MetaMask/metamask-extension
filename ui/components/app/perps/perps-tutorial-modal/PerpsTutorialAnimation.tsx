import React, { Suspense } from 'react';
import { Box } from '@metamask/design-system-react';
import type { Alignment, Fit } from '@rive-app/react-canvas';
import { mmLazy } from '../../../../helpers/utils/mm-lazy';
import { getEnvironmentType } from '../../../../../shared/lib/environment-type';
import { getPerpsTutorialAnimationLayout } from './PerpsTutorialAnimation.utils';

type PerpsTutorialAnimationProps = {
  artboardName: string;
  className?: string;
  fit?: Fit;
  alignment?: Alignment;
};

const PerpsTutorialAnimationContent = mmLazy(
  // eslint-disable-next-line import-x/extensions -- needed for mmLazy
  () => import('./PerpsTutorialAnimationContent.tsx'),
);

const PerpsTutorialAnimation = ({
  artboardName,
  className,
  fit: fitProp,
  alignment,
}: PerpsTutorialAnimationProps) => {
  const environmentType = getEnvironmentType();
  const { containerStyle } = getPerpsTutorialAnimationLayout(environmentType);

  return (
    <Suspense
      fallback={
        <Box
          className={className}
          style={containerStyle}
          data-testid="perps-tutorial-animation-loading"
        />
      }
    >
      <PerpsTutorialAnimationContent
        artboardName={artboardName}
        className={className}
        fit={fitProp}
        alignment={alignment}
      />
    </Suspense>
  );
};

export default PerpsTutorialAnimation;
