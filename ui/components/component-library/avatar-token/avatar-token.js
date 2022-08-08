import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { BaseAvatar } from '../base-avatar';

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
      data-test-id="avatar-token"
      {...{ backgroundColor, borderColor, ...props }}
    >
      {showFallback ? (
        tokenName?.[0].toUpperCase() ?? '?'
      ) : (
        <>
          <img
            onError={handleOnError}
            src={tokenImageUrl}
            style={style}
            alt={tokenName || 'token'}
            {...props}
          />
          {showHalo && (
            <img
              src={tokenImageUrl}
              className={showHalo ? 'blur-halo-image' : ''}
              aria-hidden="true"
              {...props}
            />
          )}
        </>
      )}
    </BaseAvatar>
  );
};

AvatarToken.propTypes = {
  /**
   * The tokenName accepts the string to render the first alphabet of the Avatar Name
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
   * AvatarToken accepts all the props from BaseAvatar
   */
  ...BaseAvatar.propTypes,
};
