import React from 'react';
import classnames from 'classnames';
import { ButtonBase, IconSize } from '..';
import {
  BackgroundColor,
  Color,
} from '../../../helpers/constants/design-system';
import type { PolymorphicRef } from '../box';
import type { ButtonBaseProps } from '../button-base';
import type { ButtonLinkProps } from './button-link.types';
import { ButtonLinkSize, ButtonLinkComponent } from './button-link.types';

export const ButtonLink: ButtonLinkComponent = React.forwardRef(
  <C extends React.ElementType = 'button' | 'a'>(
    {
      className = '',
      color,
      danger = false,
      disabled = false,
      loading = false,
      size = ButtonLinkSize.Auto,
      endIconProps,
      startIconProps,
      ...props
    }: ButtonLinkProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    return (
      <ButtonBase
        className={classnames(className, 'mm-button-link', {
          'mm-button-link--type-danger': danger,
          'mm-button-link--disabled': disabled,
          'mm-button-link--loading': loading,
          'mm-button-link--size-inherit': size === ButtonLinkSize.Inherit,
          'mm-button-link--size-auto': size === ButtonLinkSize.Auto,
        })}
        paddingLeft={0}
        paddingRight={0}
        size={size === ButtonLinkSize.Inherit ? null : size}
        backgroundColor={BackgroundColor.transparent}
        color={color || (danger ? Color.errorDefault : Color.primaryDefault)}
        borderRadius={null}
        startIconProps={{
          size:
            size === ButtonLinkSize.Inherit ? IconSize.Inherit : IconSize.Sm,
          ...startIconProps,
          className:
            size === ButtonLinkSize.Inherit
              ? `mm-button-link--size-inherit__icon ${
                  startIconProps?.className || ''
                }`
              : '',
        }}
        endIconProps={{
          size:
            size === ButtonLinkSize.Inherit ? IconSize.Inherit : IconSize.Sm,
          ...endIconProps,
          className:
            size === ButtonLinkSize.Inherit
              ? `mm-button-link--size-inherit__icon ${
                  endIconProps?.className || ''
                }`
              : '',
        }}
        iconLoadingProps={{
          size:
            size === ButtonLinkSize.Inherit ? IconSize.Inherit : IconSize.Md,
          color: color || (danger ? Color.errorDefault : Color.primaryDefault),
        }}
        ref={ref}
        {...{ disabled, loading, ...(props as ButtonBaseProps<C>) }}
      />
    );
  },
);
