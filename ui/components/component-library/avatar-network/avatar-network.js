import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { AvatarBase } from '../avatar-base';
import Box from '../../ui/box/box';
import {
  Size,
  DISPLAY,
  AlignItems,
  JustifyContent,
  TextColor,
  BackgroundColor,
  BorderColor,
} from '../../../helpers/constants/design-system';
import { AVATAR_NETWORK_SIZES } from './avatar-network.constants';

export const AvatarNetwork = ({
  size = Size.MD,
  name,
  src,
  showHalo,
  color = TextColor.textDefault,
  backgroundColor = BackgroundColor.backgroundAlternative,
  borderColor = BorderColor.transparent,
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
      alignItems={AlignItems.center}
      justifyContent={JustifyContent.center}
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
   * Possible values could be Size.XS(16px), Size.SM(24px), Size.MD(32px), Size.LG(40px), Size.XL(48px)
   * Defaults to Size.MD
   */
  size: PropTypes.oneOf(Object.values(AVATAR_NETWORK_SIZES)),
  /**
   * The background color of the AvatarNetwork
   * Defaults to BackgroundColor.backgroundAlternative
   */
  backgroundColor: PropTypes.oneOf(Object.values(BackgroundColor)),
  /**
   * The background color of the AvatarNetwork
   * Defaults to BorderColor.borderDefault
   */
  borderColor: PropTypes.oneOf(Object.values(BorderColor)),
  /**
   * The color of the text inside the AvatarNetwork
   * Defaults to TextColor.textDefault
   */
  color: PropTypes.oneOf(Object.values(TextColor)),
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
