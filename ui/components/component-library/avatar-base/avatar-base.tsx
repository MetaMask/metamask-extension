import React from 'react';
import classnames from 'classnames';

import {
  BackgroundColor,
  BorderColor,
  TextColor,
  Display,
  JustifyContent,
  AlignItems,
  BorderRadius,
  TextVariant,
  TextTransform,
} from '../../../helpers/constants/design-system';

import type { PolymorphicRef } from '../box';
import { Text } from '../text';
import type { TextProps } from '../text';
import {
  AvatarBaseComponent,
  AvatarBaseProps,
  AvatarBaseSize,
} from './avatar-base.types';

export const AvatarBase: AvatarBaseComponent = React.forwardRef(
  <C extends React.ElementType = 'div'>(
    {
      size = AvatarBaseSize.Md,
      children,
      backgroundColor = BackgroundColor.backgroundAlternative,
      borderColor = BorderColor.borderDefault,
      color = TextColor.textDefault,
      className = '',
      ...props
    }: AvatarBaseProps<C>,
    ref?: PolymorphicRef<C>,
  ) => {
    let fallbackTextVariant;

    if (size === AvatarBaseSize.Lg || size === AvatarBaseSize.Xl) {
      fallbackTextVariant = TextVariant.bodyLgMedium;
    } else if (size === AvatarBaseSize.Sm || size === AvatarBaseSize.Md) {
      fallbackTextVariant = TextVariant.bodySm;
    } else {
      fallbackTextVariant = TextVariant.bodyXs;
    }
    return (
      <Text
        className={classnames(
          'mm-avatar-base',
          `mm-avatar-base--size-${size}`,
          className,
        )}
        ref={ref}
        as="div"
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        borderRadius={BorderRadius.full}
        variant={fallbackTextVariant}
        textTransform={TextTransform.Uppercase}
        {...{ backgroundColor, borderColor, color }}
        {...(props as TextProps<C>)}
      >
        {children}
      </Text>
    );
  },
);
