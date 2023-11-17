import React, { useContext } from 'react';
import classnames from 'classnames';
import type { PolymorphicRef, BoxProps } from '../box';
import { Box } from '..';
import { SelectContext } from '../select-wrapper';
import { Display } from '../../../helpers/constants/design-system';
import {
  SelectOptionProps,
  SelectOptionComponent,
} from './select-option.types';

export const SelectOption: SelectOptionComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    { className = '', value, children, ...props }: SelectOptionProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const selectContext = useContext(SelectContext);

    if (!selectContext) {
      throw new Error('SelectOption must be used within a SelectWrapper.');
    }

    const {
      setUncontrolledValue,
      onValueChange,
      isMultiSelect,
      isOpen,
      onOpenChange,
      toggleUncontrolledOpen,
    } = selectContext;

    const handleClick = () => {
      // if there is an onValueChange prop, use that to set the value
      if (onValueChange) {
        onValueChange(value);
      } else {
        setUncontrolledValue(value);
      }

      // When not a multiselect, close the popover on click
      if (!isMultiSelect && isOpen) {
        onOpenChange(!isOpen);
      } else if (!isMultiSelect) {
        toggleUncontrolledOpen();
      }
    };

    return (
      <Box
        className={classnames('mm-select-option', className)}
        ref={ref}
        onClick={handleClick}
        as="button"
        display={Display.Block}
        {...(props as BoxProps<C>)}
      >
        {children}
      </Box>
    );
  },
);
