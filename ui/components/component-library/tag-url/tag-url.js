import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import Box from '../../ui/box/box';
import { Text } from '../text';
import {
  ALIGN_ITEMS,
  COLORS,
  JUSTIFY_CONTENT,
  SIZES,
  TEXT,
} from '../../../helpers/constants/design-system';
import { AvatarFavicon } from '../avatar-favicon';
import { ButtonLink } from '../button-link';

export const TagUrl = ({
  label,
  className,
  imageSource,
  cta,
  faviconProps,
  buttonProps,
  textProps,
  ...props
}) => {
  return (
    <Box
      className={classnames('tag-url', className)}
      backgroundColor={COLORS.BACKGROUND_DEFAULT}
      borderColor={COLORS.BORDER_DEFAULT}
      borderWidth={1}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      alignItems={ALIGN_ITEMS.CENTER}
      borderRadius={SIZES.XL}
      {...props}
    >
      <AvatarFavicon
        className="tag-url__favicon"
        imageSource={imageSource}
        {...faviconProps}
      />
      <Text className="tag-url__label" variant={TEXT.BODY_MD} {...textProps}>
        {label}
      </Text>
      {cta?.label && (
        <ButtonLink
          as="a"
          className="tag-url__button-link"
          href="#"
          {...buttonProps}
        >
          {cta.label}
        </ButtonLink>
      )}
    </Box>
  );
};

TagUrl.propTypes = {
  /**
   * The imageSource accepts the string of the image to be rendered
   */
  imageSource: PropTypes.string,
  /**
   * The text content of the TagUrl component
   */
  label: PropTypes.string,
  /**
   * If we want a button in TagUrl component.
   */
  cta: PropTypes.object,
  /**
   * It accepts all the props from ButtonLink
   */
  buttonProps: PropTypes.shape(ButtonLink.PropTypes),
  /**
   * It accepts all the props from Avatar Favicon
   */
  faviconProps: PropTypes.shape(AvatarFavicon.PropTypes),
  /**
   * It accepts all the props from Text Component
   */
  textProps: PropTypes.shape(Text.PropTypes),
  /**
   * Additional classNames to be added to the TagUrl component
   */
  className: PropTypes.string,
};

export default TagUrl;
