import React, { useState, useRef } from 'react';
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
      isMultiSelect,
      triggerComponent,
      popoverProps,
      children,
      onBlur,
      ...props
    }: SelectWrapperProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = useState<any | null>();
    const [isUncontrolledOpen, setIsUncontrolledOpen] =
      useState<boolean>(false);
    const [referenceElement, setReferenceElement] =
      useState<HTMLElement | null>();
    const popoverRef = useRef<HTMLDivElement | null>(null);
    const wrapperRef = useRef<HTMLDivElement | null>(null);

    const setBoxRef = (anchorRef: HTMLElement | null) => {
      setReferenceElement(anchorRef);
    };

    const toggleUncontrolledOpen = () => {
      setIsUncontrolledOpen(!isUncontrolledOpen);
    };

    const handleClickOutside = () => {
      setIsUncontrolledOpen(false);
      if (onOpenChange) {
        onOpenChange(false);
      }
    };

    const handleBlur = (e: any) => {
      const wrapper = wrapperRef.current;
      const { relatedTarget } = e;

      if (
        wrapper &&
        !wrapper.contains(relatedTarget) &&
        !popoverRef.current?.contains(relatedTarget)
      ) {
        console.log('the if in handleBlur ran');
        setIsUncontrolledOpen(false);
        if (onOpenChange) {
          onOpenChange(false);
        }
      }
      if (onBlur) {
        onBlur(e);
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
          ref={wrapperRef && ref}
          {...(props as BoxProps<C>)}
        >
          {triggerComponent &&
            React.cloneElement(triggerComponent, {
              ref: setBoxRef,
            })}
          <Popover
            isOpen={isOpen || isUncontrolledOpen}
            position={PopoverPosition.Bottom}
            onClickOutside={handleClickOutside}
            matchWidth
            referenceElement={referenceElement}
            padding={0}
            ref={popoverRef}
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
