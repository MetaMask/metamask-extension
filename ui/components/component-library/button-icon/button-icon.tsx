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
import { Icon } from '../icon';

import { ButtonIconSize, ButtonIconProps } from './button-icon.types';

export const ButtonIcon = React.forwardRef<HTMLButtonElement, ButtonIconProps>(
  ({
    ariaLabel,
    as = 'button',
    className = '',
    color = IconColor.iconDefault,
    href,
    size = ButtonIconSize.LG,
    iconName,
    disabled,
    iconProps,
    ...props
  }) => {
    const Tag = href ? 'a' : as;
    return (
      <Box
        aria-label={ariaLabel}
        as={Tag}
        className={classnames(
          'mm-button-icon',
          `mm-button-icon--size-${size}`,
          {
            'mm-button-icon--disabled': disabled,
          },
          className,
        )}
        color={color}
        disabled={disabled}
        display={DISPLAY.INLINE_FLEX}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        borderRadius={BorderRadius.LG}
        backgroundColor={BackgroundColor.transparent}
        href={href}
        {...props}
      >
        <Icon name={iconName} size={size} {...iconProps} />
      </Box>
    );
  },
);
