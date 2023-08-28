import React, { useState, useContext, createContext } from 'react';
import classnames from 'classnames';
import type { PolymorphicRef, BoxProps } from '../box';
import { Box, Popover, PopoverPosition } from '..';
import {
  SelectWrapperComponent,
  SelectWrapperProps,
} from './select-wrapper.types';

// Should go in the types file
type SelectContextType = {
  isOpen: boolean | undefined;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean | undefined>>; // Double check this is correct type
  isUncontrolledOpen: boolean;
  setIsUncontrolledOpen: React.Dispatch<React.SetStateAction<any | null>>;
  toggleUncontrolledOpen: () => void; // Function to quickly toggle the open state
  isDisabled: boolean;
  isMultiSelect: boolean;
  value: any | null;
  onValueChange?: any;
  uncontrolledValue: any | null;
  setUncontrolledValue: React.Dispatch<React.SetStateAction<any | null>>;
  defaultValue: any | null;
  placeholder: any;
  isDanger: boolean;
  // onBlur?: React.FocusEventHandler;
  // onFocus?: React.FocusEventHandler;
};

export const SelectContext = createContext<SelectContextType | undefined>(
  undefined,
);

export const useSelectContext = () => {
  const context = useContext(SelectContext);

  if (!context) {
    throw new Error('useSelectContext must be used within a SelectWrapper');
  }

  return context;
};

// Custom hook to access the uncontrolledValue
export function useUncontrolledValue() {
  const context = useContext(SelectContext);
  if (!context) {
    throw new Error('useUncontrolledValue must be used within a SelectWrapper');
  }
  return context.uncontrolledValue;
}

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
      isMultiSelect, // Prevents from the uncontrolled open state from being toggled
      triggerComponent,
      popoverProps,
      children,
      // To Do: Figure out the below props
      // onBlur,
      // onFocus,
      // onChange,
      ...props
    }: SelectWrapperProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const [uncontrolledValue, setUncontrolledValue] = useState<any | null>();
    const [isUncontrolledOpen, setIsUncontrolledOpen] =
      useState<boolean>(false);
    const [referenceElement, setReferenceElement] =
      useState<HTMLElement | null>();

    const setBoxRef = (popoverRef: HTMLElement | null) => {
      setReferenceElement(popoverRef);
    };

    const toggleUncontrolledOpen = () => {
      setIsUncontrolledOpen(!isUncontrolledOpen);
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
          // onBlur={onBlur}
          onChange={onValueChange}
          ref={ref}
          {...(props as BoxProps<C>)}
        >
          {React.cloneElement(triggerComponent, {
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
