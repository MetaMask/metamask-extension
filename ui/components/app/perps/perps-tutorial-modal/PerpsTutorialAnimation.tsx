import React, { Suspense } from 'react';
import { Box } from '@metamask/design-system-react';
import type { Alignment, Fit } from '@rive-app/react-canvas';
import { mmLazy } from '../../../../helpers/utils/mm-lazy';
// eslint-disable-next-line import-x/no-restricted-paths
import { getEnvironmentType } from '../../../../../app/scripts/lib/util';
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

const PerpsTutorialAnimation: React.FC<PerpsTutorialAnimationProps> = ({
  artboardName,
  className,
  fit: fitProp,
  alignment,
}) => {
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
