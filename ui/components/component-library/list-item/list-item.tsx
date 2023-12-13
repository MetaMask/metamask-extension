import React from 'react';
import classnames from 'classnames';
import type { PolymorphicRef, BoxProps } from '../box';
import { Box } from '..';

import { Display } from '../../../helpers/constants/design-system';
import { ListItemProps, ListItemComponent } from './list-item.types';

export const ListItem: ListItemComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      className = '',
      isDisabled,
      disabled,
      children,
      ...props
    }: ListItemProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    return (
      <Box
        className={classnames(
          'mm-list-item',
          {
            'mm-list-item--disabled': Boolean(isDisabled) || Boolean(disabled),
          },
          className,
        )}
        disabled={isDisabled || disabled}
        display={Display.Block}
        padding={4}
        ref={ref}
        {...(props as BoxProps<C>)}
      >
        {children}
      </Box>
    );
  },
);
