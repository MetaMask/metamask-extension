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

export const TagUrl = ({
  label,
  labelProps,
  actionButtonLabel,
  actionButtonProps,
  url,
  avatarFaviconProps,
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
      <AvatarFavicon imageSource={url} {...avatarFaviconProps} />
      <Text variant={TEXT.BODY_MD} ellipsis {...labelProps}>
        {label}
      </Text>
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
   * The url accepts the string of the image to be rendered
   */
  url: PropTypes.string,
  /**
   * It accepts all the props from Avatar Favicon
   */
  avatarFaviconProps: PropTypes.shape(AvatarFavicon.PropTypes),
  /**
   * The text content of the TagUrl component
   */
  label: PropTypes.string,
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
