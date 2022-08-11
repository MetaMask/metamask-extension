import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { BaseAvatar } from '../base-avatar';
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
  backgroundColor = COLORS.BACKGROUND_ALTERNATIVE,
  borderColor = COLORS.BORDER_DEFAULT,
  networkName,
  networkImageUrl,
  showHalo,
  ...props
}) => {
  const [showFallback, setShowFallback] = useState(false);
  useEffect(() => {
    setShowFallback(!networkImageUrl);
  }, [networkImageUrl]);

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
        `base-avatar--size-${size} avatar-network`,
      )}
      {...{ backgroundColor, borderColor, ...props }}
    >
      {showFallback ? (
        networkName?.[0]?.toUpperCase() ?? '?'
      ) : (
        <>
          <img
            onError={handleOnError}
            src={networkImageUrl}
            style={style}
            alt={networkName || 'network avatar'}
          />
          {showHalo && (
            <img
              src={networkImageUrl}
              className={showHalo ? 'avatar-network__token-image--halo' : ''}
              aria-hidden="true"
            />
          )}
        </>
      )}
    </BaseAvatar>
  );
};

AvatarNetwork.propTypes = {
  /**
   * The networkName accepts the string to render the first alphabet of the Avatar Name
   */
  networkName: PropTypes.string,
  /**
   * The networkImageUrl accepts the string of the image to be rendered
   */
  networkImageUrl: PropTypes.string,
  /**
   * The showHalo accepts a boolean prop to render the image with halo effect
   */
  showHalo: PropTypes.bool,
  /**
   * The size of the AvatarNetwork
   * Possible values could be 'xs', 'sm', 'md', 'lg', 'xl',
   */
  size: PropTypes.oneOf(Object.values(SIZES)),
  /**
   * The background color of the AvatarNetwork
   */
  backgroundColor: Box.propTypes.backgroundColor,
  /**
   * The background color of the AvatarNetwork
   */
  borderColor: Box.propTypes.borderColor,
  /**
   * AvatarNetwork accepts all the props from Box
   */
  ...Box.propTypes,
};
