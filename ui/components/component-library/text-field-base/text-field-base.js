import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  DISPLAY,
  SIZES,
  ALIGN_ITEMS,
  TEXT,
  COLORS,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box';

import { Text } from '../text';

import {
  TEXT_FIELD_BASE_SIZES,
  TEXT_FIELD_BASE_TYPES,
} from './text-field-base.constants';

export const TextFieldBase = ({
  autoComplete,
  autoFocus,
  className,
  defaultValue,
  disabled,
  error,
  id,
  inputProps,
  inputRef,
  leftAccessory,
  rightAccessory,
  maxLength,
  name,
  onBlur,
  onChange,
  onClick,
  onFocus,
  placeholder,
  readOnly,
  required,
  size = SIZES.MD,
  type = 'text',
  truncate,
  value,
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

    if (onClick) {
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
        'mm-text-field-base',
        `mm-text-field-base--size-${size}`,
        {
          'mm-text-field-base--focused': focused && !disabled,
          'mm-text-field-base--error': error,
          'mm-text-field-base--disabled': disabled,
          'mm-text-field-base--truncate': truncate,
        },
        className,
      )}
      display={DISPLAY.INLINE_FLEX}
      backgroundColor={COLORS.BACKGROUND_DEFAULT}
      alignItems={ALIGN_ITEMS.CENTER}
      borderWidth={1}
      borderRadius={SIZES.SM}
      paddingLeft={4}
      paddingRight={4}
      onClick={handleClick}
      {...props}
    >
      {leftAccessory}
      <Text
        aria-invalid={error}
        as="input"
        autoComplete={autoComplete ? 'on' : 'off'}
        autoFocus={autoFocus}
        backgroundColor={COLORS.TRANSPARENT}
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
        paddingLeft={leftAccessory ? 2 : null}
        paddingRight={leftAccessory ? 2 : null}
        placeholder={placeholder}
        readOnly={readOnly}
        ref={handleInputRef}
        required={required}
        value={value}
        variant={TEXT.BODY_MD}
        type={type}
        {...inputProps} // before className so input className isn't overridden
        className={classnames(
          'mm-text-field-base__input',
          inputProps?.className,
        )}
      />
      {rightAccessory}
    </Box>
  );
};

TextFieldBase.propTypes = {
  /**
   * Autocomplete allows the browser to predict the value based on earlier typed values
   */
  autoComplete: PropTypes.string,
  /**
   * If `true`, the input will be focused during the first mount.
   */
  autoFocus: PropTypes.bool,
  /**
   * An additional className to apply to the text-field-base
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
   * Attributes applied to the `input` element.
   */
  inputProps: PropTypes.object,
  /**
   * Component to appear on the left side of the input
   */
  leftAccessory: PropTypes.node,
  /**
   * Component to appear on the right side of the input
   */
  rightAccessory: PropTypes.node,
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
  size: PropTypes.oneOf(Object.values(TEXT_FIELD_BASE_SIZES)),
  /**
   * Type of the input element. Can be TEXT_FIELD_BASE_TYPES.TEXT, TEXT_FIELD_BASE_TYPES.PASSWORD, TEXT_FIELD_BASE_TYPES.NUMBER
   * Defaults to TEXT_FIELD_BASE_TYPES.TEXT ('text')
   */
  type: PropTypes.oneOf(Object.values(TEXT_FIELD_BASE_TYPES)),
  /**
   * The input value, required for a controlled component.
   */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /**
   * TextFieldBase accepts all the props from Box
   */
  ...Box.propTypes,
};

TextFieldBase.displayName = 'TextFieldBase';
