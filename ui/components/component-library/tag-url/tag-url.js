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
} from '../../../helpers/constants/design-system';

export const TagUrl = ({ label, className, ...props }) => {
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
      <Text variant="body-sm">{label}</Text>
    </Box>
  );
};

TagUrl.propTypes = {
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
