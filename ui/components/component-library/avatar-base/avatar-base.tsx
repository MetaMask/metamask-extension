import React from 'react';
import classnames from 'classnames';

import {
  BackgroundColor,
  BorderColor,
  TextColor,
  DISPLAY,
  JustifyContent,
  AlignItems,
  BorderRadius,
  TextVariant,
  TEXT_TRANSFORM,
} from "../../../helpers/constants/design-system";

import { Text, ValidTag } from '../text';

import { AvatarBaseProps, AvatarBaseSizes } from './avatar-base.types';

export const AvatarBase = ({
  size = AvatarBaseSizes.MD,
  children,
  backgroundColor = BackgroundColor.backgroundAlternative,
  borderColor = BorderColor.borderDefault,
  color = TextColor.textDefault,
  className = '',
  ...props
}: AvatarBaseProps) => {
  let fallbackTextVariant;

  if (size === AvatarBaseSizes.LG || size === AvatarBaseSizes.XL) {
    fallbackTextVariant = TextVariant.bodyLgMedium;
  } else if (size === AvatarBaseSizes.SM || size === AvatarBaseSizes.MD) {
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
      as={ValidTag.Div}
      display={DISPLAY.FLEX}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      borderRadius={BorderRadius.full}
      variant={fallbackTextVariant}
      textTransform={TEXT_TRANSFORM.UPPERCASE}
      {...{ backgroundColor, borderColor, color, ...props }}
    >
      {children}
    </Text>
  );
};
