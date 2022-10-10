import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { BaseAvatar } from '../base-avatar';
import Box from '../../ui/box/box';

import {
  BORDER_COLORS,
  SIZES,
  DISPLAY,
  ALIGN_ITEMS,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';

export const AvatarFavicon = ({
  size = SIZES.MD,
  imageSource,
  className,
  borderColor = BORDER_COLORS.TRANSPARENT,
  ...props
}) => {
  return (
    <BaseAvatar
      size={size}
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.CENTER}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      className={classnames('avatar-favicon', className)}
      {...{ borderColor, ...props }}
    >
      <img
        className="avatar-favicon__image"
        src={imageSource || './images/icons/icon-global-filled.svg'}
        alt="avatar favicon"
      />
    </BaseAvatar>
  );
};

AvatarFavicon.propTypes = {
  /**
   * The imageSource accepts the string of the image to be rendered
   */
  imageSource: PropTypes.string,
  /**
   * The size of the AvatarFavicon
   * Possible values could be 'SIZES.XS', 'SIZES.SM', 'SIZES.MD', 'SIZES.LG', 'SIZES.XL'
   * Defaults to SIZES.MD
   */
  size: PropTypes.oneOf(Object.values(SIZES)),
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
