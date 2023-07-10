import React, { ChangeEvent, KeyboardEvent } from 'react';
import classnames from 'classnames';

import {
  BackgroundColor,
  BorderColor,
  BorderRadius,
  IconColor,
  TextVariant,
  Display,
  AlignItems,
} from '../../../helpers/constants/design-system';
import type { PolymorphicRef } from '../box';

import { Box, Icon, IconName, Label } from '..';

import { CheckboxProps, CheckboxComponent } from './checkbox.types';

export const Checkbox: CheckboxComponent = React.forwardRef(
  <C extends React.ElementType = 'input'>(
    {
      id,
      isChecked,
      isIndeterminate,
      isDisabled,
      isReadOnly,
      isRequired,
      onChange,
      className = '',
      iconProps,
      title,
      name,
      label,
      labelProps,
      ...props
    }: CheckboxProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const handleCheckboxKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        onChange?.(event as unknown as ChangeEvent<HTMLInputElement>);
      }
    };

    // If no title is provided, use the label as the title only if the label is a string
    const sanitizedTitle =
      !title && typeof label === 'string' ? label : title || id;

    return (
      <Label
        className={'mm-checkbox__wrapper'}
        variant={TextVariant.bodyMd}
        display={Display.Flex}
        alignItems={AlignItems.center}
        {...labelProps}
      >
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
          marginRight={label ? 2 : 0}
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
          display={Display.Flex}
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
        {label ? <span>{label}</span> : null}
      </Label>
    );
  },
);
