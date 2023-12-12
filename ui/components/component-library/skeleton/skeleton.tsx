import React from 'react';
import classnames from 'classnames';
import type { PolymorphicRef, BoxProps } from '../box';
import { Box } from '..';
import { Display } from '../../../helpers/constants/design-system';
import { SkeletonProps, SkeletonComponent } from './skeleton.types';

export const Skeleton: SkeletonComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    { className = '', children, ...props }: SkeletonProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    return (
      <Box
        className={classnames('mm-skeleton', className)}
        ref={ref}
        display={Display.Block}
        {...(props as BoxProps<C>)}
      />
    );
  },
);
