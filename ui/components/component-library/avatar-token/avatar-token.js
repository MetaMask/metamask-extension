import React, { useState, useEffect } from 'react';
import classnames from 'classnames';
import PropTypes from 'prop-types';
import Box from '../../ui/box/box';
import { AvatarBase } from '../avatar-base';
import {
  SIZES,
  COLORS,
  DISPLAY,
  ALIGN_ITEMS,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';
import { AVATAR_TOKEN_SIZES } from './avatar-token.constants';

export const AvatarToken = ({
  size = SIZES.MD,
  name,
  src,
  showHalo,
  color = COLORS.TEXT_DEFAULT,
  backgroundColor = COLORS.BACKGROUND_ALTERNATIVE,
  borderColor = COLORS.TRANSPARENT,
  className,
  ...props
}) => {
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    setShowFallback(!src);
  }, [src]);

  const handleOnError = () => {
    setShowFallback(true);
  };

  const fallbackString = name && name[0] ? name[0] : '?';

  return (
    <AvatarBase
      size={size}
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.CENTER}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      className={classnames(
        'mm-avatar-token',
        showHalo && 'mm-avatar-token--with-halo',
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
              src={src}
              className={
                showHalo ? 'mm-avatar-token__token-image--blurred' : ''
              }
              aria-hidden="true"
            />
          )}
          <img
            className={
              showHalo
                ? 'mm-avatar-token__token-image--size-reduced'
                : 'mm-avatar-token__token-image'
            }
            onError={handleOnError}
            src={src}
            alt={`${name} logo` || 'token logo'}
          />
        </>
      )}
    </AvatarBase>
  );
};

AvatarToken.propTypes = {
  /**
   * The name accepts the string to render the first letter of the AvatarToken. This will be used as the fallback display if no image url is passed to the src
   */
  name: PropTypes.string,
  /**
   * The src accepts the string of the image to be rendered
   */
  src: PropTypes.string,
  /**
   * The showHalo accepts a boolean prop to render the image with halo effect
   */
  showHalo: PropTypes.bool,
  /**
   * The size of the AvatarToken.
   * Possible values could be SIZES.XS(16px), SIZES.SM(24px), SIZES.MD(32px), SIZES.LG(40px), SIZES.XL(48px)
   * Defaults to SIZES.MD
   */
  size: PropTypes.oneOf(Object.values(AVATAR_TOKEN_SIZES)),
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
