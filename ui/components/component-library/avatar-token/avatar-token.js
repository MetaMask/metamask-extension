import React, { useState } from 'react';
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
  ...props
}) => {
  const [showFallback, setShowFallback] = useState(!tokenImageUrl);

  const style = size ? { height: `100%`, width: `100%` } : {};

  const handleOnError = () => {
    setShowFallback(true);
  };

  return (
    <BaseAvatar
      size={size}
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.CENTER}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      {...{ backgroundColor, borderColor, ...props }}
    >
      {showFallback ? (
        tokenName?.[0].toUpperCase() ?? '?'
      ) : (
        <img
          onError={handleOnError}
          src={tokenImageUrl}
          style={style}
          alt={tokenName || 'icon'}
          {...props}
        />
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
   * AvatarToken accepts all the props from BaseAvatar
   */
  ...BaseAvatar.propTypes,
};
