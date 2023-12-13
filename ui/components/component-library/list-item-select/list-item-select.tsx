import React from 'react';
import classnames from 'classnames';
import type { PolymorphicRef } from '../box';
import { ListItem } from '..';
import type { ListItemProps } from '../list-item/list-item.types';

import { Display } from '../../../helpers/constants/design-system';
import {
  ListItemSelectProps,
  ListItemSelectComponent,
} from './list-item-select.types';

export const ListItemSelect: ListItemSelectComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      className = '',
      isDisabled,
      disabled,
      isSelected,
      ...props
    }: ListItemSelectProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    return (
      <ListItem
        className={classnames(
          'mm-list-item-select',
          {
            'mm-list-item-select--selected': Boolean(isSelected),
            'mm-list-item-select--disabled':
              Boolean(isDisabled) || Boolean(disabled),
          },
          className,
        )}
        display={Display.Block}
        padding={4}
        ref={ref}
        {...(props as ListItemProps<C>)}
      />
    );
  },
);
