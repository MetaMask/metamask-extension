import React from 'react';
import classnames from 'classnames';

import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  DISPLAY,
  IconColor,
  JustifyContent,
} from '../../../helpers/constants/design-system';

import Box from '../../ui/box';
import { Icon, IconSize } from '../icon';

import { ButtonIconSize, ButtonIconProps } from './button-icon.types';

const buttonIconSizeToIconSize: Record<ButtonIconSize, IconSize> = {
  [ButtonIconSize.Sm]: IconSize.Sm,
  [ButtonIconSize.Lg]: IconSize.Lg,
};

export const ButtonIcon = React.forwardRef(
  (
    {
      ariaLabel,
      as = 'button',
      className = '',
      color = IconColor.iconDefault,
      href,
      size = ButtonIconSize.Lg,
      iconName,
      disabled,
      iconProps,
      ...props
    }: ButtonIconProps,
    ref: React.Ref<HTMLElement>,
  ) => {
    const Tag = href ? 'a' : as;
    const isDisabled = disabled && Tag === 'button';
    return (
      <Box
        aria-label={ariaLabel}
        as={Tag}
        className={classnames(
          'mm-button-icon',
          `mm-button-icon--size-${String(size)}`,
          {
            'mm-button-icon--disabled': Boolean(disabled),
          },
          className,
        )}
        color={color}
        {...(isDisabled ? { disabled: true } : {})} // only allow disabled attribute to be passed down to the Box when the as prop is equal to a button element
        display={DISPLAY.INLINE_FLEX}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        borderRadius={BorderRadius.LG}
        backgroundColor={BackgroundColor.transparent}
        {...(href ? { href } : {})}
        ref={ref}
        {...props}
      >
        <Icon
          name={iconName}
          size={buttonIconSizeToIconSize[size]}
          {...iconProps}
        />
      </Box>
    );
  },
);
