import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';

import {
  BackgroundColor,
  BorderColor,
  TextColor,
  IconColor,
  DISPLAY,
  JustifyContent,
  AlignItems,
  BorderRadius,
  TextVariant,
  TEXT_TRANSFORM,
} from '../../../helpers/constants/design-system';

import { Text } from '../text';

import { AVATAR_BASE_SIZES } from './avatar-base.constants';

export const AvatarBase = React.forwardRef(
  (
    {
      size = AVATAR_BASE_SIZES.MD,
      children,
      backgroundColor = BackgroundColor.backgroundAlternative,
      borderColor = BorderColor.borderDefault,
      color = TextColor.textDefault,
      className,
      ...props
    },
    ref,
  ) => {
    let fallbackTextVariant;

    if (size === AVATAR_BASE_SIZES.LG || size === AVATAR_BASE_SIZES.XL) {
      fallbackTextVariant = TextVariant.bodyLgMedium;
    } else if (size === AVATAR_BASE_SIZES.SM || size === AVATAR_BASE_SIZES.MD) {
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
  },
);

AvatarBase.propTypes = {
  /**
   * The size of the AvatarBase.
   * Possible values could be 'AVATAR_BASE_SIZES.XS'(16px), 'AVATAR_BASE_SIZES.SM'(24px), 'AVATAR_BASE_SIZES.MD'(32px), 'AVATAR_BASE_SIZES.LG'(40px), 'AVATAR_BASE_SIZES.XL'(48px)
   * Defaults to AVATAR_BASE_SIZES.MD
   */
  size: PropTypes.oneOf(Object.values(AVATAR_BASE_SIZES)),
  /**
   * The children to be rendered inside the AvatarBase
   */
  children: PropTypes.node,
  /**
   * The background color of the AvatarBase
   * Defaults to Color.backgroundAlternative
   */
  backgroundColor: PropTypes.oneOf(Object.values(BackgroundColor)),
  /**
   * The background color of the AvatarBase
   * Defaults to Color.borderDefault
   */
  borderColor: PropTypes.oneOf(Object.values(BorderColor)),
  /**
   * The color of the text inside the AvatarBase
   * Defaults to TextColor.textDefault
   */
  color: PropTypes.oneOf([
    ...Object.values(TextColor),
    ...Object.values(IconColor),
  ]),
  /**
   * Additional classNames to be added to the AvatarToken
   */
  className: PropTypes.string,
  /**
   * AvatarBase also accepts all Text props including variant and all Box props
   */
  ...Text.propTypes,
};

AvatarBase.displayName = 'AvatarBase';
