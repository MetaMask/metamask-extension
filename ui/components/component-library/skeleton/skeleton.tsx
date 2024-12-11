import React from 'react';
import classnames from 'classnames';

import {
  BackgroundColor,
  BorderRadius,
} from '../../../helpers/constants/design-system';
import { Box } from '..';
import type { PolymorphicRef, BoxProps } from '../box';

import { SkeletonProps, SkeletonComponent } from './skeleton.types';

export const Skeleton: SkeletonComponent = React.forwardRef(
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
      backgroundColor={BackgroundColor.iconMuted}
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
