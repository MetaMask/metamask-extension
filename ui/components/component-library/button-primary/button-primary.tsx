import React from 'react';
import classnames from 'classnames';
import { ButtonBase } from '../button-base';
import {
  BackgroundColor,
  IconColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import type { PolymorphicRef } from '../box';
import type { ButtonBaseProps } from '../button-base';
import type { ButtonPrimaryProps } from './button-primary.types';
import {
  ButtonPrimarySize,
  ButtonPrimaryComponent,
} from './button-primary.types';

export const ButtonPrimary: ButtonPrimaryComponent = React.forwardRef(
  <C extends React.ElementType = 'button' | 'a'>(
    {
      className = '',
      danger = false,
      disabled = false,
      size = ButtonPrimarySize.Md,
      ...props
    }: ButtonPrimaryProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    return (
      <ButtonBase
        backgroundColor={
          danger ? BackgroundColor.errorDefault : BackgroundColor.primaryDefault
        }
        color={danger ? TextColor.errorInverse : TextColor.primaryInverse}
        className={classnames(className, 'mm-button-primary', {
          'mm-button-primary--type-danger': danger,
          'mm-button-primary--disabled': disabled,
        })}
        iconLoadingProps={{
          color: danger ? IconColor.errorInverse : IconColor.primaryInverse,
        }}
        size={size}
        ref={ref}
        {...{ disabled, ...(props as ButtonBaseProps<C>) }}
      />
    );
  },
);
