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

export const Tag = ({ label, className, ...props }) => {
  return (
    <Box
      className={classnames('tag', className)}
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

Tag.propTypes = {
  /**
   * The text content of the Tag component
   */
  label: PropTypes.string,
  /**
   * Additional classNames to be added to the Tag component
   */
  className: PropTypes.string,
};

export default Tag;
