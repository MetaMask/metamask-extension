import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { AvatarBase } from '../avatar-base';
import Box from '../../ui/box/box';
import { IconName, Icon } from '../icon';
import {
  BorderColor,
  Size,
  DISPLAY,
  AlignItems,
  JustifyContent,
  IconColor,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { AVATAR_FAVICON_SIZES } from './avatar-favicon.constants';

export const AvatarFavicon = React.forwardRef(
  (
    {
      size = Size.MD,
      src,
      name = 'avatar-favicon',
      className,
      fallbackIconProps,
      borderColor = BorderColor.transparent,
      ...props
    },
    ref,
  ) => {
    const t = useI18nContext();
    return (
      <AvatarBase
        ref={ref}
        size={size}
        display={DISPLAY.FLEX}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.center}
        className={classnames('mm-avatar-favicon', className)}
        {...{ borderColor, ...props }}
      >
        {src ? (
          <img
            className="mm-avatar-favicon__image"
            src={src}
            alt={t('logo', [name])}
          />
        ) : (
          <Icon
            name={IconName.Global}
            color={IconColor.iconDefault}
            size={size}
            {...fallbackIconProps}
          />
        )}
      </AvatarBase>
    );
  },
);

AvatarFavicon.propTypes = {
  /**
   * The src accepts the string of the image to be rendered
   */
  src: PropTypes.string,
  /**
   * The alt text for the favicon avatar to be rendered
   */
  name: PropTypes.string.isRequired,
  /**
   * Props for the fallback icon. All Icon props can be used
   */
  fallbackIconProps: PropTypes.object,
  /**
   * The size of the AvatarFavicon
   * Possible values could be 'Size.XS' 16px, 'Size.SM' 24px, 'Size.MD' 32px, 'Size.LG' 40px, 'Size.XL' 48px
   * Defaults to Size.MD
   */
  size: PropTypes.oneOf(Object.values(AVATAR_FAVICON_SIZES)),
  /**
   * The border color of the AvatarFavicon
   * Defaults to Color.transparent
   */
  borderColor: PropTypes.oneOf(Object.values(BorderColor)),
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

AvatarFavicon.displayName = 'AvatarFavicon';
