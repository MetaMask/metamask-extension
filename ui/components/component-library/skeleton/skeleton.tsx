import React from 'react';
import classnames from 'classnames';

import {
  BackgroundColor,
  BorderRadius,
} from '../../../helpers/constants/design-system';
import { Box } from '../box';
import type { PolymorphicRef, BoxProps } from '../box';

import { SkeletonProps, SkeletonComponent } from './skeleton.types';

export const Skeleton: SkeletonComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'div'>(
    {
      className = '',
      height,
      width,
      children,
      hideChildren,
      ...props
    }: SkeletonProps<C>,
    ref?: PolymorphicRef<C>,
  ) => (
    <Box
      className={classnames(
        'mm-skeleton',
        {
          'mm-skeleton--hide-children': hideChildren,
        },
        className,
      )}
      backgroundColor={BackgroundColor.iconAlternative}
      borderRadius={BorderRadius.SM}
      ref={ref}
      {...(props as BoxProps<C>)}
      style={{ ...props?.style, height, width }}
    >
      {children}
    </Box>
  ),
);

export default Skeleton;
