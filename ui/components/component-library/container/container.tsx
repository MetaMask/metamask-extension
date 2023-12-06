import React from 'react';
import classnames from 'classnames';
import type { PolymorphicRef, BoxProps } from '../box';
import { Box } from '..';

import { ContainerProps, ContainerComponent } from './container.types';

export const Container: ContainerComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    { className = '', ...props }: ContainerProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    return (
      <Box
        className={classnames('mm-container', className)}
        ref={ref}
        {...(props as BoxProps<C>)}
      >
        Container
      </Box>
    );
  },
);
