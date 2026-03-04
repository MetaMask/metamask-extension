import React, { useState, useRef, useEffect } from 'react';
import classnames from 'clsx';

import {
  Input as DsInput,
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxBorderColor,
  BoxFlexDirection,
} from '@metamask/design-system-react';

import { BackgroundColor } from '../../../helpers/constants/design-system';
import type { PolymorphicRef } from '../box';
import {
  TextFieldComponent,
  TextFieldProps,
  TextFieldSize,
  TextFieldType,
} from './text-field.types';

export const TextField: TextFieldComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'div'>(
    {
      autoComplete,
      autoFocus,
      className = '',
      defaultValue,
      disabled,
      error,
      id,
      inputProps,
      inputRef,
      startAccessory,
      endAccessory,
      maxLength,
      name,
      onBlur,
      onChange,
      onClick,
      onFocus,
      onKeyPress,
      placeholder,
      readOnly,
      required,
      size = TextFieldSize.Md,
      testId,
      type = TextFieldType.Text,
      truncate = true,
      value,
      InputComponent = DsInput as TextFieldProps<C>['InputComponent'],
      ...props
    }: TextFieldProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const internalInputRef = useRef<HTMLInputElement | null>(null);
    const [focused, setFocused] = useState(false);

    useEffect(() => {
      // The blur won't fire when the disabled state is set on a focused input.
      // We need to set the focused state manually.
      if (disabled) {
        setFocused(false);
      }
    }, [disabled]);

    const handleClick = (event: React.MouseEvent<HTMLInputElement>) => {
      const { current } = internalInputRef;

      if (current) {
        current.focus();
        setFocused(true);
      }

      if (onClick && !disabled) {
        onClick?.(event);
      }
    };

    const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
      setFocused(false);
      onBlur?.(event);
    };

    const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
      setFocused(true);
      onFocus?.(event);
    };

    const handleInputRef = (inputElementRef: HTMLInputElement | null) => {
      // Assign the input element reference to the internal reference
      internalInputRef.current = inputElementRef;

      // Check if an external ref (inputRef) is provided and is a ref object
      if (inputRef && 'current' in inputRef) {
        // Assign the input element reference to the external ref
        // TODO: Use `ref` prop instead. `forwardRef` is deprecated in React v19.
        // eslint-disable-next-line react-compiler/react-compiler
        inputRef.current = inputElementRef;
      }
      // Check if an external ref (inputRef) is a callback function
      else if (typeof inputRef === 'function') {
        // Call the inputRef function, passing the input element reference
        inputRef(inputElementRef);
      }
    };

    const isDsInput = InputComponent === DsInput;
    const inputClassName = classnames(
      'mm-text-field__input',
      inputProps?.className ?? '',
    );

    const inputPropsToPass = {
      ...(error && { 'aria-invalid': error }),
      autoComplete: autoComplete === true ? 'on' : autoComplete === false ? 'off' : autoComplete,
      autoFocus,
      'data-testid': testId,
      defaultValue,
      id,
      maxLength,
      name,
      onBlur: handleBlur,
      onChange,
      onFocus: handleFocus,
      placeholder,
      ref: handleInputRef,
      required,
      value,
      type,
      className: inputClassName,
      ...inputProps,
      ...(onKeyPress && { onKeyPress }),
      ...(isDsInput
        ? { isDisabled: disabled, isReadonly: readOnly }
        : {
            disabled,
            readOnly,
            backgroundColor: BackgroundColor.transparent,
            margin: 0,
            padding: 0,
            paddingLeft: startAccessory ? 2 : 4,
            paddingRight: endAccessory ? 2 : 4,
            focused: focused.toString(),
            disableStateStyles: true,
          }),
    };

    return (
      <Box
        ref={ref}
        className={classnames(
          'mm-text-field',
          'inline-flex rounded-lg',
          `mm-text-field--size-${size}`,
          {
            'mm-text-field--focused': focused && !disabled,
            'mm-text-field--error': Boolean(error),
            'mm-text-field--disabled': Boolean(disabled),
            'mm-text-field--truncate': truncate,
          },
          className,
        )}
        flexDirection={BoxFlexDirection.Row}
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        alignItems={BoxAlignItems.Center}
        borderWidth={1}
        borderColor={BoxBorderColor.BorderDefault}
        paddingLeft={startAccessory ? 4 : 0}
        paddingRight={endAccessory ? 4 : 0}
        onClick={handleClick}
        {...(props as React.ComponentProps<typeof Box>)}
      >
        {startAccessory}
        <InputComponent {...(inputPropsToPass as unknown as React.ComponentProps<typeof InputComponent>)} />
        {endAccessory}
      </Box>
    );
  },
);
