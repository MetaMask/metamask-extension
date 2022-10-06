import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../ui/box/box';
import { Text } from '../text';
import {
  ALIGN_ITEMS,
  COLORS,
  JUSTIFY_CONTENT,
  SIZES,
} from '../../../helpers/constants/design-system';

export const Tag = ({ label, ...props }) => {
  return (
    <Box
      className="tag"
      {...props}
      backgroundColor={COLORS.BACKGROUND_DEFAULT}
      borderColor={COLORS.BORDER_DEFAULT}
      borderWidth={1}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      alignItems={ALIGN_ITEMS.CENTER}
      borderRadius={SIZES.XL}
      padding={[2, 4]}
    >
      <Text variant="body-sm">{label}</Text>
    </Box>
  );
};

Tag.propTypes = {
  /**
   * The text content of the Tag component
   */
  label: PropTypes.string,
};

export default Tag;
