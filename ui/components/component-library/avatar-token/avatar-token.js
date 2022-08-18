import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import Box from '../../ui/box/box';
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
  tokenName,
  tokenImageUrl,
  showHalo,
  color = COLORS.TEXT_DEFAULT,
  backgroundColor = COLORS.BACKGROUND_ALTERNATIVE,
  borderColor = COLORS.TRANSPARENT,
  className,
  ...props
}) => {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    setShowFallback(!tokenImageUrl);
  }, [tokenImageUrl]);

  const handleOnError = () => {
    setShowFallback(true);
  };

  const fallbackString = tokenName && tokenName[0] ? tokenName[0] : '?';

  return (
    <BaseAvatar
      size={size}
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.CENTER}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      className={classnames(
        'avatar-token',
        showHalo && 'avatar-token--with-halo',
        className,
      )}
      {...{ backgroundColor, borderColor, color, ...props }}
    >
      {showFallback ? (
        fallbackString
      ) : (
        <>
          {showHalo && (
            <img
              src={tokenImageUrl}
              className={showHalo ? 'avatar-token__token-image--blurred' : ''}
              aria-hidden="true"
            />
          )}
          <img
            className={
              showHalo
                ? 'avatar-token__token-image--size-reduced'
                : 'avatar-token__token-image'
            }
            onError={handleOnError}
            src={tokenImageUrl}
            alt={tokenName || 'token avatar'}
          />
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
   * The size of the AvatarToken.
   * Possible values could be 'SIZES.XS', 'SIZES.SM', 'SIZES.MD', 'SIZES.LG', 'SIZES.XL'
   * Defaults to SIZES.MD
   */
  size: PropTypes.oneOf(Object.values(SIZES)),
  /**
   * The background color of the AvatarToken
   * Defaults to COLORS.BACKGROUND_ALTERNATIVE
   */
  backgroundColor: Box.propTypes.backgroundColor,
  /**
   * The background color of the AvatarToken
   * Defaults to COLORS.BORDER_DEFAULT
   */
  borderColor: Box.propTypes.borderColor,
  /**
   * The color of the text inside the AvatarToken
   * Defaults to COLORS.TEXT_DEFAULT
   */
  color: Box.propTypes.color,
  /**
   * Additional classNames to be added to the AvatarToken
   */
  className: PropTypes.string,
  /**
   * AvatarToken also accepts all Box props including but not limited to
   * className, as(change root element of HTML element) and margin props
   */
  ...Box.propTypes,
};
