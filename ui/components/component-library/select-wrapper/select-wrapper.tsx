import React, { useState } from 'react';
import classnames from 'classnames';
import type { PolymorphicRef, BoxProps } from '../box';
import { Box, Popover, PopoverPosition } from '..';
import {
  SelectWrapperComponent,
  SelectWrapperProps,
} from './select-wrapper.types';
import { SelectContext } from './select-wrapper.context';

export const SelectWrapper: SelectWrapperComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      className = '',
      defaultValue,
      value,
      onValueChange,
      placeholder,
      isDanger,
      isDisabled,
      isOpen,
      onOpenChange,
      isMultiSelect, // Prevents the uncontrolled open state from being toggled
      triggerComponent,
      popoverProps,
      children,
      onBlur, // Controlled onBlur prop
      ...props
    }: SelectWrapperProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = useState<any | null>();
    const [isUncontrolledOpen, setIsUncontrolledOpen] =
      useState<boolean>(false);
    const [referenceElement, setReferenceElement] =
      useState<HTMLElement | null>();

    const setBoxRef = (anchorRef: HTMLElement | null) => {
      setReferenceElement(anchorRef);
    };

    const toggleUncontrolledOpen = () => {
      setIsUncontrolledOpen(!isUncontrolledOpen);
    };

    const handleBlur = (e: any) => {
      const wrapper = e.currentTarget;
      const { relatedTarget } = e;

      if (!wrapper.contains(relatedTarget)) {
        // Close the popover only if the related target is not inside the wrapper
        setIsUncontrolledOpen(false);
        // If you have a controlled isOpen state, update it to close
        if (onOpenChange) {
          onOpenChange(false);
        }
        // Allow the dev to pass in a controlled onBlur prop
        if (onBlur) {
          onBlur(e);
        }
      }
    };

    return (
      <SelectContext.Provider
        value={{
          isOpen,
          onOpenChange,
          isUncontrolledOpen,
          setIsUncontrolledOpen,
          toggleUncontrolledOpen,
          isDisabled,
          isDanger,
          defaultValue,
          value,
          onValueChange,
          uncontrolledValue,
          setUncontrolledValue,
          placeholder,
          isMultiSelect,
        }}
      >
        <Box
          className={classnames('mm-select-wrapper', className)}
          onBlur={handleBlur} // This only works if the triggerComponent is a focusable element like a button so the onBlur event bubbles up
          ref={ref}
          {...(props as BoxProps<C>)}
        >
          {triggerComponent &&
            React.cloneElement(triggerComponent, {
              ref: setBoxRef,
            })}
          <Popover
            isOpen={isOpen || isUncontrolledOpen}
            position={PopoverPosition.Bottom}
            matchWidth
            referenceElement={referenceElement}
            padding={0}
            {...popoverProps}
            className={classnames(
              'mm-select-wrapper__popover',
              popoverProps?.className || '',
            )}
          >
            {children}
          </Popover>
        </Box>
      </SelectContext.Provider>
    );
  },
);
