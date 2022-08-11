import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import { BaseAvatar } from '../base-avatar';
import Box from '../../ui/box/box';

import {
  COLORS,
  SIZES,
  DISPLAY,
  ALIGN_ITEMS,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';

export const AvatarToken = ({
  size = SIZES.MD,
  backgroundColor = COLORS.BACKGROUND_ALTERNATIVE,
  borderColor = COLORS.BORDER_DEFAULT,
  tokenName,
  tokenImageUrl,
  showHalo,
  ...props
}) => {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    setShowFallback(!tokenImageUrl);
  }, [tokenImageUrl]);

  const baseStyle = showHalo ? { position: `relative` } : {};
  const sizePercentage = showHalo ? '62.5%' : '100%';

  const style = size
    ? {
        height: sizePercentage,
        width: sizePercentage,
        borderRadius: '50%',
        zIndex: '2',
      }
    : {};

  const handleOnError = () => {
    setShowFallback(true);
  };

  return (
    <BaseAvatar
      size={size}
      style={baseStyle}
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.CENTER}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      className={classnames(
        'base-avatar',
        `base-avatar--size-${size} avatar-token`,
      )}
      {...{ backgroundColor, borderColor, ...props }}
    >
      {showFallback ? (
        tokenName?.[0]?.toUpperCase() ?? '?'
      ) : (
        <>
          <img
            onError={handleOnError}
            src={tokenImageUrl}
            style={style}
            alt={tokenName || 'token avatar'}
          />
          {showHalo && (
            <img
              src={tokenImageUrl}
              className={showHalo ? 'avatar-token__token-image--halo' : ''}
              aria-hidden="true"
            />
          )}
        </>
      )}
    </BaseAvatar>
  );
};

AvatarToken.propTypes = {
  /**
   * The tokenName accepts the string to render the first letter of the AvatarToken. This will be used as the fallback display if no image url is passed to the tokenImageUrl
   */
  tokenName: PropTypes.string,
  /**
   * The tokenImageUrl accepts the string of the image to be rendered
   */
  tokenImageUrl: PropTypes.string,
  /**
   * The showHalo accepts a boolean prop to render the image with halo effect
   */
  showHalo: PropTypes.bool,
  /**
   * The size of theAvatarToken.
   * Possible values could be 'xs', 'sm', 'md', 'lg', 'xl',
   */
  size: PropTypes.oneOf(Object.values(SIZES)),
  /**
   * The background color of theAvatarToken
   */
  backgroundColor: Box.propTypes.backgroundColor,
  /**
   * The background color of theAvatarToken
   */
  borderColor: Box.propTypes.borderColor,
  /**
   * AvatarToken accepts all the props from Box
   */
  ...Box.propTypes,
};
