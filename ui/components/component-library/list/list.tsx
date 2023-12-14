import React from 'react';
import classnames from 'classnames';
import type { PolymorphicRef, BoxProps } from '../box';
import { Box } from '..';
import { ListProps, ListComponent } from './list.types';

export const List: ListComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    { className = '', isDisabled, disabled, children, ...props }: ListProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    return (
      <Box
        className={classnames('mm-list', className)}
        as="ul"
        ref={ref}
        {...(props as BoxProps<C>)}
      >
        {children}
      </Box>
    );
  },
);
