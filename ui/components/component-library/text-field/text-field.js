import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  DISPLAY,
  Size,
  AlignItems,
  BorderRadius,
  BackgroundColor,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box';

import { Input } from '../input';

import { TEXT_FIELD_SIZES, TEXT_FIELD_TYPES } from './text-field.constants';

export const TextField = ({
  autoComplete,
  autoFocus,
  className,
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
  placeholder,
  readOnly,
  required,
  size = Size.MD,
  testId,
  type = 'text',
  truncate = true,
  value,
  InputComponent = Input,
  ...props
}) => {
  const internalInputRef = useRef(null);
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    // The blur won't fire when the disabled state is set on a focused input.
    // We need to set the focused state manually.
    if (disabled) {
      setFocused(false);
    }
  }, [disabled]);

  const handleClick = (event) => {
    const { current } = internalInputRef;

    if (current) {
      current.focus();
      setFocused(true);
    }

    if (onClick && !disabled) {
      onClick(event);
    }
  };

  const handleFocus = (event) => {
    setFocused(true);
    onFocus && onFocus(event);
  };

  const handleBlur = (event) => {
    setFocused(false);
    onBlur && onBlur(event);
  };

  const handleInputRef = (ref) => {
    internalInputRef.current = ref;
    if (inputRef && inputRef.current !== undefined) {
      inputRef.current = ref;
    } else if (typeof inputRef === 'function') {
      inputRef(ref);
    }
  };

  return (
    <Box
      className={classnames(
        'mm-text-field',
        `mm-text-field--size-${size}`,
        {
          'mm-text-field--focused': focused && !disabled,
          'mm-text-field--error': error,
          'mm-text-field--disabled': disabled,
          'mm-text-field--truncate': truncate,
        },
        className,
      )}
      display={DISPLAY.INLINE_FLEX}
      backgroundColor={BackgroundColor.backgroundDefault}
      alignItems={AlignItems.center}
      borderWidth={1}
      borderRadius={BorderRadius.SM}
      paddingLeft={startAccessory ? 4 : 0}
      paddingRight={endAccessory ? 4 : 0}
      onClick={handleClick}
      {...props}
    >
      {startAccessory}
      <InputComponent
        {...(error && { 'aria-invalid': error })}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        backgroundColor={BackgroundColor.transparent}
        data-testid={testId}
        defaultValue={defaultValue}
        disabled={disabled}
        focused={focused.toString()}
        id={id}
        margin={0}
        maxLength={maxLength}
        name={name}
        onBlur={handleBlur}
        onChange={onChange}
        onFocus={handleFocus}
        padding={0}
        paddingLeft={startAccessory ? 2 : 4}
        paddingRight={endAccessory ? 2 : 4}
        placeholder={placeholder}
        readOnly={readOnly}
        ref={handleInputRef}
        required={required}
        value={value}
        type={type}
        disableStateStyles
        {...inputProps} // before className so input className isn't overridden
        className={classnames('mm-text-field__input', inputProps?.className)}
      />
      {endAccessory}
    </Box>
  );
};

TextField.propTypes = {
  /**
   * Autocomplete allows the browser to predict the value based on earlier typed values
   */
  autoComplete: PropTypes.bool,
  /**
   * If `true`, the input will be focused during the first mount.
   */
  autoFocus: PropTypes.bool,
  /**
   * An additional className to apply to the text-field
   */
  className: PropTypes.string,
  /**
   * The default input value, useful when not controlling the component.
   */
  defaultValue: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /**
   * If `true`, the input will be disabled.
   */
  disabled: PropTypes.bool,
  /**
   * If `true`, the input will indicate an error
   */
  error: PropTypes.bool,
  /**
   * The id of the `input` element.
   */
  id: PropTypes.string,
  /**
   * The the component that is rendered as the input
   * Defaults to the Text component
   */
  InputComponent: PropTypes.elementType,
  /**
   * Attributes applied to the `input` element.
   */
  inputProps: PropTypes.object,
  /**
   * Component to appear on the left side of the input
   */
  startAccessory: PropTypes.node,
  /**
   * Component to appear on the right side of the input
   */
  endAccessory: PropTypes.node,
  /**
   * Use inputRef to pass a ref to the html input element.
   */
  inputRef: PropTypes.oneOfType([PropTypes.func, PropTypes.object]),
  /**
   * Max number of characters to allow
   */
  maxLength: PropTypes.number,
  /**
   * Name attribute of the `input` element.
   */
  name: PropTypes.string,
  /**
   * Callback fired on blur
   */
  onBlur: PropTypes.func,
  /**
   * Callback fired when the value is changed.
   */
  onChange: PropTypes.func,
  /**
   * Callback fired when the TextField is clicked on
   */
  onClick: PropTypes.func,
  /**
   * Callback fired on focus
   */
  onFocus: PropTypes.func,
  /**
   * The short hint displayed in the input before the user enters a value.
   */
  placeholder: PropTypes.string,
  /**
   * It prevents the user from changing the value of the field (not from interacting with the field).
   */
  readOnly: PropTypes.bool,
  /**
   * If `true`, the input will be required. Currently no visual difference is shown.
   */
  required: PropTypes.bool,
  /**
   * The size of the text field. Changes the height of the component
   * Accepts SM(32px), MD(40px), LG(48px)
   */
  size: PropTypes.oneOf(Object.values(TEXT_FIELD_SIZES)),
  /**
   * Type of the input element. Can be TEXT_FIELD_TYPES.TEXT, TEXT_FIELD_TYPES.PASSWORD, TEXT_FIELD_TYPES.NUMBER
   * Defaults to TEXT_FIELD_TYPES.TEXT ('text')
   */
  type: PropTypes.oneOf(Object.values(TEXT_FIELD_TYPES)),
  /**
   * If true will ellipse the text of the input
   * Defaults to true
   */
  truncate: PropTypes.bool,
  /**
   * The input value, required for a controlled component.
   */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /**
   * Data test ID for the InputComponent component
   */
  testId: PropTypes.string,
  /**
   * TextField accepts all the props from Box
   */
  ...Box.propTypes,
};

TextField.displayName = 'TextField';
