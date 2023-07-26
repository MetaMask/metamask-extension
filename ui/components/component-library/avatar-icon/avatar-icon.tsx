import React, { Ref } from 'react';
import classnames from 'classnames';
import {
  BorderColor,
  Display,
  AlignItems,
  JustifyContent,
  BackgroundColor,
  IconColor,
  TextColor,
} from '../../../helpers/constants/design-system';

import { Icon } from '../icon';
import { AvatarBase } from '../avatar-base';

import {
  AvatarIconProps,
  AvatarIconSize,
  avatarIconSizeToIconSize,
} from './avatar-icon.types';

export const AvatarIcon = React.forwardRef(
  (
    {
      size = AvatarIconSize.Md,
      color = TextColor.primaryDefault,
      backgroundColor = BackgroundColor.primaryMuted,
      className = '',
      iconProps,
      iconName,
      ...props
    }: AvatarIconProps,
    ref: Ref<HTMLElement>,
  ) => {
    const iconSize = avatarIconSizeToIconSize[size];
    return (
      <AvatarBase
        ref={ref}
        size={size}
        display={Display.Flex}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        color={color as TextColor}
        backgroundColor={backgroundColor}
        borderColor={BorderColor.transparent}
        className={classnames('mm-avatar-icon', className)}
        {...props}
      >
        <Icon
          color={IconColor.inherit}
          name={iconName}
          size={iconSize}
          {...iconProps}
        />
      </AvatarBase>
    );
  },
);

AvatarIcon.displayName = 'AvatarIcon';
