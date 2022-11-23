import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { AvatarBase } from '../avatar-base';
import Box from '../../ui/box/box';

import {
  COLORS,
  SIZES,
  DISPLAY,
  ALIGN_ITEMS,
  JUSTIFY_CONTENT,
} from '../../../helpers/constants/design-system';

export const AvatarNetwork = ({
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

  const fallbackString = name && name[0] ? name[0] : '?';

  const handleOnError = () => {
    setShowFallback(true);
  };

  return (
    <AvatarBase
      size={size}
      display={DISPLAY.FLEX}
      alignItems={ALIGN_ITEMS.CENTER}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      className={classnames(
        'mm-avatar-network',
        showHalo && 'mm-avatar-network--with-halo',
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
                showHalo ? 'mm-avatar-network__network-image--blurred' : ''
              }
              aria-hidden="true"
            />
          )}
          <img
            className={
              showHalo
                ? 'mm-avatar-network__network-image--size-reduced'
                : 'mm-avatar-network__network-image'
            }
            onError={handleOnError}
            src={src}
            alt={`${name} logo` || 'network logo'}
          />
        </>
      )}
    </AvatarBase>
  );
};

AvatarNetwork.propTypes = {
  /**
   * The name accepts the string to render the first alphabet of the Avatar Name
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
   * The size of the AvatarNetwork
   * Possible values could be 'SIZES.XS'(16px), 'SIZES.SM'(24px), 'SIZES.MD'(32px), 'SIZES.LG'(40px), 'SIZES.XL'(48px)
   * Defaults to SIZES.MD
   */
  size: PropTypes.oneOf(Object.values(SIZES)),
  /**
   * The background color of the AvatarNetwork
   * Defaults to COLORS.BACKGROUND_ALTERNATIVE
   */
  backgroundColor: Box.propTypes.backgroundColor,
  /**
   * The background color of the AvatarNetwork
   * Defaults to COLORS.BORDER_DEFAULT
   */
  borderColor: Box.propTypes.borderColor,
  /**
   * The color of the text inside the AvatarNetwork
   * Defaults to COLORS.TEXT_DEFAULT
   */
  color: Box.propTypes.color,
  /**
   * Additional classNames to be added to the AvatarNetwork
   */
  className: PropTypes.string,
  /**
   * AvatarNetwork also accepts all Box props including but not limited to
   * className, as(change root element of HTML element) and margin props
   */
  ...Box.propTypes,
};
