import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Box from '../../ui/box/box';
import { Text } from '../text';
import {
  ALIGN_ITEMS,
  BORDER_RADIUS,
  COLORS,
  DISPLAY,
  SIZES,
  TEXT,
} from '../../../helpers/constants/design-system';
import { AvatarFavicon } from '../avatar-favicon';
import { ButtonLink } from '../button-link';
import { Icon, ICON_NAMES } from '../icon';

export const TagUrl = ({
  label,
  labelProps,
  actionButtonLabel,
  actionButtonProps,
  src,
  avatarFaviconProps,
  fallbackIconProps,
  className,
  ...props
}) => {
  return (
    <Box
      className={classnames('mm-tag-url', className)}
      backgroundColor={COLORS.BACKGROUND_DEFAULT}
      borderColor={COLORS.BORDER_DEFAULT}
      borderWidth={1}
      alignItems={ALIGN_ITEMS.CENTER}
      paddingLeft={2}
      paddingRight={4}
      gap={2}
      borderRadius={BORDER_RADIUS.PILL}
      display={DISPLAY.INLINE_FLEX}
      {...props}
    >
      <AvatarFavicon imageSource={src} {...avatarFaviconProps} />
      {label.includes('https://') ? (
        <>
          <Icon
            className="tag-url__lock-icon"
            name={ICON_NAMES.LOCK_FILLED}
            color={COLORS.ICON_ALTERNATIVE}
            size={SIZES.SM}
            aria-label="https://"
            {...fallbackIconProps}
          />
          <Text variant={TEXT.BODY_MD} ellipsis {...labelProps}>
            {label.replace('https://', '')}
          </Text>{' '}
        </>
      ) : (
        <Text variant={TEXT.BODY_MD} ellipsis {...labelProps}>
          {label}
        </Text>
      )}
      {actionButtonLabel && (
        <ButtonLink
          as="a"
          size={SIZES.SM}
          paddingLeft={0}
          paddingRight={0}
          marginLeft={2}
          marginRight={2}
          {...actionButtonProps}
        >
          {actionButtonLabel}
        </ButtonLink>
      )}
    </Box>
  );
};

TagUrl.propTypes = {
  /**
   * The src accepts the string of the image to be rendered
   */
  src: PropTypes.string,
  /**
   * It accepts all the props from Avatar Favicon
   */
  avatarFaviconProps: PropTypes.shape(AvatarFavicon.PropTypes),
  /**
   * It accepts all the props from Icon
   */
  fallbackIconProps: PropTypes.shape(Icon.PropTypes),
  /**
   * The text content of the TagUrl component
   */
  label: PropTypes.string.isRequired,
  /**
   * It accepts all the props from Text Component
   */
  labelProps: PropTypes.shape(Text.PropTypes),
  /**
   * If we want a button in TagUrl component.
   */
  actionButtonLabel: PropTypes.oneOfType([PropTypes.string, PropTypes.node]),
  /**
   * It accepts all the props from ButtonLink
   */
  actionButtonProps: PropTypes.shape(ButtonLink.PropTypes),
  /**
   * Additional classNames to be added to the TagUrl component
   */
  className: PropTypes.string,
};

export default TagUrl;
