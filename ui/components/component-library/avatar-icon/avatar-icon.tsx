import React from 'react';
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
import type { PolymorphicRef } from '../box';
import { AvatarBase, AvatarBaseProps } from '../avatar-base';
import type { AvatarIconComponent } from './avatar-icon.types';
import {
  AvatarIconProps,
  AvatarIconSize,
  avatarIconSizeToIconSize,
} from './avatar-icon.types';

export const AvatarIcon: AvatarIconComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      size = AvatarIconSize.Md,
      color = TextColor.primaryDefault,
      backgroundColor = BackgroundColor.primaryMuted,
      className = '',
      iconProps,
      iconName,
      ...props
    }: AvatarIconProps<C>,
    ref?: PolymorphicRef<C>,
  ) => (
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
      {...(props as AvatarBaseProps<C>)}
    >
      <Icon
        color={IconColor.inherit}
        name={iconName}
        {...iconProps}
        className={classnames(
          'mm-avatar-icon__icon',
          `mm-avatar-icon__icon--size-${size}`,
          iconProps?.className || '',
        )}
      />
    </AvatarBase>
  ),
);
