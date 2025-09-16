import React from 'react';
import classnames from 'classnames';
import { Link } from 'react-router-dom-v5-compat';

import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  IconColor,
  JustifyContent,
} from '../../../helpers/constants/design-system';

import { Box, BoxProps, PolymorphicRef } from '../box';
import { Icon, IconSize } from '../icon';
import {
  ButtonIconSize,
  ButtonIconProps,
  ButtonIconComponent,
} from './button-icon.types';

const buttonIconSizeToIconSize: Record<ButtonIconSize, IconSize> = {
  [ButtonIconSize.Sm]: IconSize.Sm,
  [ButtonIconSize.Md]: IconSize.Md,
  [ButtonIconSize.Lg]: IconSize.Lg,
};

export const ButtonIcon: ButtonIconComponent = React.forwardRef(
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
  // eslint-disable-next-line @typescript-eslint/naming-convention
  <C extends React.ElementType = 'button' | 'a'>(
    {
      ariaLabel,
      as,
      className = '',
      color = IconColor.iconDefault,
      href,
      size = ButtonIconSize.Lg,
      iconName,
      disabled,
      iconProps,
      ...props
    }: ButtonIconProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    const tag = as ?? 'button';
    const isDisabled = disabled && tag === 'button';

    const commonProps = {
      'aria-label': ariaLabel,
      className: classnames(
        'mm-button-icon inline-flex items-center justify-center rounded-lg transition-all hover:text-inherit',
        `mm-button-icon--size-${String(size)}`,
        {
          'mm-button-icon--disabled': Boolean(disabled),
        },
        className,
      ),
      color,
      ref,
      ...props,
    };

    if (href) {
      return disabled ? (
        <span {...commonProps}>
          <Icon
            name={iconName}
            size={buttonIconSizeToIconSize[size]}
            {...iconProps}
          />
        </span>
      ) : (
        <Link to={href} {...commonProps}>
          <Icon
            name={iconName}
            size={buttonIconSizeToIconSize[size]}
            {...iconProps}
          />
        </Link>
      );
    }

    return (
      <Box
        aria-label={ariaLabel}
        as={tag}
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
        display={Display.InlineFlex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        borderRadius={BorderRadius.LG}
        backgroundColor={BackgroundColor.transparent}
        {...(href ? { href } : {})}
        ref={ref}
        {...(props as BoxProps<C>)}
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
