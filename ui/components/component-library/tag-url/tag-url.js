import React from 'react';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import { BaseAvatar } from '../base-avatar';
import Box from '../../ui/box/box';
import { Text } from '../text';
import {
  ALIGN_ITEMS,
  COLORS,
  DISPLAY,
  JUSTIFY_CONTENT,
  BORDER_COLORS,
  SIZES,
} from '../../../helpers/constants/design-system';

export const TagUrl = ({ label, className, imageSource, cta, ...props }) => {
  return (
    <Box
      className={classnames('tag-url', className)}
      backgroundColor={COLORS.BACKGROUND_DEFAULT}
      borderColor={COLORS.BORDER_DEFAULT}
      borderWidth={1}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      alignItems={ALIGN_ITEMS.CENTER}
      borderRadius={SIZES.XL}
      paddingLeft={1}
      paddingRight={1}
      {...props}
    >
      {/* Going to replace this when AvatarFavicon will be merged */}
      <BaseAvatar
        size={SIZES.MD}
        display={DISPLAY.FLEX}
        alignItems={ALIGN_ITEMS.CENTER}
        justifyContent={JUSTIFY_CONTENT.CENTER}
        borderColor={BORDER_COLORS.TRANSPARENT}
        className={classnames('avatar-favicon', className)}
        {...props}
      >
        <img
          className="avatar-favicon__image"
          src={imageSource}
          alt="avatar favicon"
        />
      </BaseAvatar>
      <Text variant="body-sm">{label}</Text>
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
   * Additional classNames to be added to the TagUrl component
   */
  className: PropTypes.string,
};

export default TagUrl;
