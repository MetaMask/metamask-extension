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
    isChecked,
    isIndeterminate,
    isDisabled,
    isReadOnly,
    isRequired,
    onChange,
    className = '',
    textProps,
    title,
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
        title={title}
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
        {...props}
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
      />
      {(isChecked || isIndeterminate) && (
        <Icon
          className="mm-checkbox__icon"
          color={IconColor.primaryInverse}
          name={isChecked ? IconName.CheckBold : IconName.MinusBold}
        />
      )}
    </Box>
  );

  return label ? (
    <Box display={Display.Flex} gap={4}>
      {CheckboxComponent}
      <Text
        {...textProps}
        className={classnames(
          'mm-checkbox__label',
          textProps?.className ?? '',
          {
            'mm-checkbox--disabled': Boolean(isDisabled),
          },
        )}
      >
        {label}
      </Text>
    </Box>
  ) : (
    CheckboxComponent
  );
});
