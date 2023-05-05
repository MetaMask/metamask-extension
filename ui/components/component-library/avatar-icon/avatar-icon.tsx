import React, { Ref } from 'react';
import classnames from 'classnames';
import {
  BorderColor,
  DISPLAY,
  AlignItems,
  JustifyContent,
  BackgroundColor,
  IconColor,
  TextColor,
} from '../../../helpers/constants/design-system';

import { Icon } from '../icon';
import { AvatarBase, AvatarBaseSize } from '../avatar-base';

import { AvatarIconProps } from './avatar-icon.types';

export const AvatarIcon = React.forwardRef(
  (
    {
      size = AvatarBaseSize.Md,
      color = TextColor.primaryDefault,
      backgroundColor = BackgroundColor.primaryMuted,
      className = '',
      iconProps,
      iconName,
      ...props
    }: AvatarIconProps,
    ref: Ref<HTMLElement>,
  ) => (
    <AvatarBase
      ref={ref}
      size={size}
      display={DISPLAY.FLEX}
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
        size={size}
        {...iconProps}
      />
    </AvatarBase>
  ),
);

AvatarIcon.displayName = 'AvatarIcon';
