import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { AvatarBase } from '../avatar-base';
import Box from '../../ui/box/box';
import { ICON_NAMES, Icon } from '../icon';
import {
  COLORS,
  BORDER_COLORS,
  SIZES,
  DISPLAY,
  ALIGN_ITEMS,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';
import { AVATAR_FAVICON_SIZES } from './avatar-favicon.constants';

export const AvatarFavicon = ({
  size = SIZES.MD,
  src,
  name = 'avatar-favicon',
  className,
  fallbackIconProps,
  borderColor = BORDER_COLORS.TRANSPARENT,
  ...props
}) => {
  return (
    <AvatarBase
      size={size}
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.CENTER}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      className={classnames('mm-avatar-favicon', className)}
      {...{ borderColor, ...props }}
    >
      {src ? (
        <img
          className="mm-avatar-favicon__image"
          src={src}
          alt={`${name} logo`}
        />
      ) : (
        <Icon
          name={ICON_NAMES.GLOBAL_FILLED}
          color={COLORS.ICON_DEFAULT}
          size={size}
          {...fallbackIconProps}
        />
      )}
    </AvatarBase>
  );
};

AvatarFavicon.propTypes = {
  /**
   * The src accepts the string of the image to be rendered
   */
  src: PropTypes.string,
  /**
   * The alt text for the favicon avatar to be rendered
   */
  name: PropTypes.string.isRequired,
  /**
   * Props for the fallback icon. All Icon props can be used
   */
  fallbackIconProps: PropTypes.shape(Icon.PropTypes),
  /**
   * The size of the AvatarFavicon
   * Possible values could be 'SIZES.XS' 16px, 'SIZES.SM' 24px, 'SIZES.MD' 32px, 'SIZES.LG' 40px, 'SIZES.XL' 48px
   * Defaults to SIZES.MD
   */
  size: PropTypes.oneOf(Object.values(AVATAR_FAVICON_SIZES)),
  /**
   * The border color of the AvatarFavicon
   * Defaults to COLORS.TRANSPARENT
   */
  borderColor: Box.propTypes.borderColor,
  /**
   * Additional classNames to be added to the AvatarFavicon
   */
  className: PropTypes.string,
  /**
   * AvatarFavicon also accepts all Box props including but not limited to
   * className, as(change root element of HTML element) and margin props
   */
  ...Box.propTypes,
};
