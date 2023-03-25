import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Box from '../../ui/box/box';
import { Text } from '../text';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  DISPLAY,
  IconColor,
  Size,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { AvatarFavicon } from '../avatar-favicon';
import { ButtonLink } from '../button-link';
import { Icon, IconName } from '../icon';

export const TagUrl = ({
  label,
  labelProps,
  actionButtonLabel,
  actionButtonProps,
  src,
  showLockIcon,
  avatarFaviconProps,
  lockIconProps,
  className,
  ...props
}) => {
  return (
    <Box
      className={classnames('mm-tag-url', className)}
      backgroundColor={BackgroundColor.backgroundDefault}
      borderColor={BorderColor.borderDefault}
      borderWidth={1}
      alignItems={AlignItems.center}
      paddingLeft={2}
      paddingRight={4}
      gap={2}
      borderRadius={BorderRadius.pill}
      display={DISPLAY.FLEX}
      {...props}
    >
      <AvatarFavicon src={src} name={label} {...avatarFaviconProps} />
      {showLockIcon && (
        <Icon
          className="mm-tag-url__lock-icon"
          name={IconName.Lock}
          color={IconColor.iconAlternative}
          size={Size.SM}
          aria-label="https://"
          role="img"
          {...lockIconProps}
        />
      )}
      <Text variant={TextVariant.bodyMd} ellipsis {...labelProps}>
        {label}
      </Text>
      {actionButtonLabel && (
        <ButtonLink
          as="a"
          size={Size.SM}
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
   * The showLockIcon accepts a boolean prop to render the lock icon instead of https in label
   */
  showLockIcon: PropTypes.bool,
  /**
   * It accepts all the props from Avatar Favicon
   */
  avatarFaviconProps: PropTypes.shape(AvatarFavicon.PropTypes),
  /**
   * It accepts all the props from Icon
   */
  lockIconProps: PropTypes.shape(Icon.PropTypes),
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
  /**
   * TagUrl accepts all the props from Box
   */
  ...Box.propTypes,
};

export default TagUrl;
