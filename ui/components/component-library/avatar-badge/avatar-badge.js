import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Box from '../../ui/box/box';
import Jazzicon from '../../ui/jazzicon/jazzicon.component';
import { BaseAvatar } from '../base-avatar';
import { AvatarToken } from '../avatar-token';
import { COLORS, SIZES } from '../../../helpers/constants/design-system';

const getStyles = (diameter) => ({
  height: diameter,
  width: diameter,
  borderRadius: diameter / 2,
});

export const badgePosition = ['top', 'bottom'];
export const AvatarBadge = ({
  size = SIZES.MD,
  backgroundColor = COLORS.BACKGROUND_ALTERNATIVE,
  borderColor = COLORS.BORDER_DEFAULT,
  address,
  className,
  diameter,
  tokenList,
  tokenName,
  tokenImageUrl,
  ...props
}) => {
  const avatarTokenClassName =
    props.badgePosition === 'top'
      ? 'avatar-badge-token-position-top'
      : 'avatar-badge-token-position-bottom';
  return (
    <Box className="avatar-badge__conatiner">
      <BaseAvatar
        className={classnames('avatar-badge')}
        {...{ backgroundColor, borderColor, ...props }}
      >
        <Jazzicon
          address={address}
          diameter={diameter}
          className={classnames('identicon', className)}
          style={getStyles(diameter)}
          tokenList={tokenList}
        />
      </BaseAvatar>
      <AvatarToken
        tokenImageUrl={tokenImageUrl}
        className={avatarTokenClassName}
      />
    </Box>
  );
};

AvatarBadge.propTypes = {
  /**
   * The size of the AvatarBadge.
   * Possible values could be 'xs', 'sm', 'md', 'lg', 'xl',
   */
  size: PropTypes.oneOf(Object.values(SIZES)),
  /**
   * The position of the AvatarBadge
   * Possible values could be 'top', 'bottom',
   */
  badgePosition: PropTypes.oneOf(badgePosition),
  /**
   * The children to be rendered inside the AvatarBadge
   */
  children: PropTypes.node,
  /**
   * The background color of the AvatarBadge
   */
  backgroundColor: Box.propTypes.backgroundColor,
  /**
   * The background color of the AvatarBadge
   */
  borderColor: Box.propTypes.borderColor,
  /**
   * Address used for generating random image
   */
  address: PropTypes.string,
  /**
   * Add custom css class
   */
  className: PropTypes.string,
  /**
   * Add list of token in object
   */
  tokenList: PropTypes.object,
  /**
   * Sets the width and height of the inner img element
   * If addBorder is true will increase components height and width by 8px
   */
  diameter: PropTypes.number,
  /**
   * AvatarBadge accepts all the props from Box
   */
  ...Box.propTypes,
};
