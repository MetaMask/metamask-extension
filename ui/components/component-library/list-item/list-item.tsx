import React from 'react';
import classnames from 'classnames';
import type { PolymorphicRef } from '../box';
import { Text } from '..';
import type { TextProps } from '../text';

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
      <Text
        className={classnames(
          'mm-list-item',
          {
            'mm-list-item--disabled': Boolean(isDisabled) || Boolean(disabled),
          },
          className,
        )}
        as="div"
        disabled={isDisabled || disabled}
        display={Display.Block}
        padding={4}
        ref={ref}
        {...(props as TextProps<C>)}
      >
        {children}
      </Text>
    );
  },
);
