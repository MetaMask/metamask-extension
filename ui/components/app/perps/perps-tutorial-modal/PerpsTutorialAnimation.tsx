import React, { Suspense } from 'react';
import { Box } from '@metamask/design-system-react';
import type { Alignment, Fit } from '@rive-app/react-canvas';
import { mmLazy } from '../../../../helpers/utils/mm-lazy';

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

const BASE_CONTAINER_STYLE: React.CSSProperties = {
  height: '280px',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
};

const PerpsTutorialAnimationContent = mmLazy(
  () => import('./PerpsTutorialAnimationContent.tsx'),
);

const PerpsTutorialAnimation: React.FC<PerpsTutorialAnimationProps> = ({
  artboardName,
  className,
  fit: fitProp,
  alignment,
}) => {
  return (
    <Suspense
      fallback={
        <Box
          className={className}
          style={BASE_CONTAINER_STYLE}
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
