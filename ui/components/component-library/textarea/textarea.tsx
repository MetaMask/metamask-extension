import React from 'react';
import classnames from 'classnames';

import {
  BorderRadius,
  BackgroundColor,
  BorderColor,
} from '../../../helpers/constants/design-system';

import { Text } from '..';
import { TextProps } from '../text';

import { PolymorphicRef } from '../box';
import {
  TextareaComponent,
  TextareaProps,
  TextareaResize,
} from './textarea.types';

export const Textarea: TextareaComponent = React.forwardRef(
  <C extends React.ElementType = 'textarea'>(
    {
      autoFocus,
      className = '',
      defaultValue,
      isDisabled,
      disabled, // to allow our components to maintain intuitive building and support native HTML attribute
      error,
      id,
      resize = TextareaResize.Vertical,
      rows,
      cols,
      maxLength,
      name,
      onBlur,
      onChange,
      onClick,
      onFocus,
      placeholder,
      readOnly,
      required,
      value,
      ...props
    }: TextareaProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const handleClick = (event: React.MouseEvent<HTMLTextAreaElement>) => {
      if (onClick && (!isDisabled || !disabled)) {
        onClick?.(event);
      }
    };

    const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
      onBlur?.(event);
    };

    const handleFocus = (event: React.FocusEvent<HTMLTextAreaElement>) => {
      onFocus?.(event);
    };

    return (
      <Text
        className={classnames(
          'mm-textarea',
          `mm-textarea--resize-${resize}`,
          {
            'mm-textarea--disabled': Boolean(isDisabled || disabled),
          },
          className,
        )}
        as="textarea"
        ref={ref}
        placeholder={placeholder}
        readOnly={readOnly}
        required={required}
        autoFocus={autoFocus}
        defaultValue={defaultValue}
        disabled={isDisabled || disabled}
        {...(error && { 'aria-invalid': error })}
        id={id}
        maxLength={maxLength}
        name={name}
        value={value}
        onBlur={handleBlur}
        onChange={onChange}
        onClick={handleClick}
        onFocus={handleFocus}
        resize={resize}
        rows={rows}
        cols={cols}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderColor={
          error ? BorderColor.errorDefault : BorderColor.borderDefault
        }
        borderRadius={BorderRadius.SM}
        borderWidth={1}
        paddingBottom={1}
        paddingLeft={4}
        paddingRight={4}
        paddingTop={1}
        {...(props as TextProps<C>)}
      />
    );
  },
);
