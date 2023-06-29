import React, { forwardRef, Ref, ChangeEvent, KeyboardEvent } from 'react';
import classnames from 'classnames';
import { Box, Icon, IconName, Text } from '..';
import {
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  IconColor,
} from '../../../helpers/constants/design-system';
import { CheckboxProps } from './checkbox.types';

export const Checkbox = forwardRef(function Checkbox(
  {
    id,
    isChecked,
    isIndeterminate,
    isDisabled,
    isReadOnly,
    isRequired,
    onChange,
    className = '',
    textProps,
    iconProps,
    title,
    name,
    label,
    ...props
  }: CheckboxProps,
  ref: Ref<HTMLInputElement>,
) {
  const handleCheckboxKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      onChange?.(event as unknown as ChangeEvent<HTMLInputElement>);
    }
  };

  // If no title is provided, use the label as the title only if the label is a string
  const sanitizedTitle =
    !title && typeof label === 'string' ? label : id || title;

  const CheckboxComponent = (
    <Box className="mm-checkbox__wrapper">
      <Box
        className={classnames('mm-checkbox', className, {
          'mm-checkbox--checked': Boolean(isChecked),
          'mm-checkbox--indeterminate': Boolean(isIndeterminate),
          'mm-checkbox--readonly': Boolean(isReadOnly),
          'mm-checkbox--disabled': Boolean(isDisabled),
        })}
        as="input"
        type="checkbox"
        title={sanitizedTitle}
        name={name}
        id={id}
        checked={isChecked}
        disabled={isDisabled}
        readOnly={isReadOnly}
        required={isRequired}
        data-indeterminate={isIndeterminate}
        ref={ref}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          onChange?.(event);
        }}
        onKeyDown={handleCheckboxKeyDown}
        margin={0}
        backgroundColor={
          isChecked || isIndeterminate
            ? BackgroundColor.primaryDefault
            : BackgroundColor.transparent
        }
        borderColor={
          isChecked || isIndeterminate
            ? BorderColor.primaryDefault
            : BorderColor.borderDefault
        }
        borderRadius={BorderRadius.SM}
        borderWidth={2}
        {...props}
      />
      {(isChecked || isIndeterminate) && (
        <Icon
          color={IconColor.primaryInverse}
          name={isChecked ? IconName.CheckBold : IconName.MinusBold}
          className={classnames(
            'mm-checkbox__icon',
            iconProps?.className ?? '',
          )}
          {...iconProps}
        />
      )}
    </Box>
  );

  return label ? (
    <Box display={Display.Flex} gap={4}>
      {CheckboxComponent}
      <Text
        as="label"
        htmlFor={id}
        className={classnames(
          'mm-checkbox__label',
          textProps?.className ?? '',
          {
            'mm-checkbox--disabled': Boolean(isDisabled),
          },
        )}
        {...textProps}
      >
        {label}
      </Text>
    </Box>
  ) : (
    CheckboxComponent
  );
});
