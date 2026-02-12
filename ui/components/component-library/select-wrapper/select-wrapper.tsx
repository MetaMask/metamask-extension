import React, { useState, useRef } from 'react';
import classnames from 'classnames';
import { Box, type PolymorphicRef, BoxProps } from '../box';
import { Popover, PopoverPosition } from '../popover';
import {
  SelectWrapperComponent,
  SelectWrapperProps,
} from './select-wrapper.types';
import { SelectContext } from './select-wrapper.context';

export const SelectWrapper: SelectWrapperComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
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
    // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
      if (isUncontrolledOpen && onBlur) {
        onBlur();
      }
      setIsUncontrolledOpen(!isUncontrolledOpen);
    };

    const handleClickOutside = () => {
      setIsUncontrolledOpen(false);
      if (onOpenChange) {
        onOpenChange(false);
      }
      if (onBlur) {
        onBlur();
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
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
            // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
            isOpen={isOpen || isUncontrolledOpen}
            position={PopoverPosition.Bottom}
            onClickOutside={handleClickOutside}
            matchWidth
            referenceElement={referenceElement}
            referenceHidden={false}
            padding={0}
            ref={popoverRef}
            {...popoverProps}
            className={classnames(
              'mm-select-wrapper__popover',
              // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
              // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
