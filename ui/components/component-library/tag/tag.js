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
  JUSTIFY_CONTENT,
  TEXT,
} from '../../../helpers/constants/design-system';

export const Tag = ({ label, className, labelProps, ...props }) => {
  return (
    <Box
      className={classnames('tag', className)}
      backgroundColor={COLORS.BACKGROUND_DEFAULT}
      borderColor={COLORS.BORDER_DEFAULT}
      borderWidth={1}
      justifyContent={JUSTIFY_CONTENT.CENTER}
      alignItems={ALIGN_ITEMS.CENTER}
      paddingLeft={1}
      paddingRight={1}
      borderRadius={BORDER_RADIUS.PILL}
      display={DISPLAY.INLINE_BLOCK}
      {...props}
    >
      <Text variant={TEXT.BODY_SM} {...labelProps}>
        {label}
      </Text>
    </Box>
  );
};

Tag.propTypes = {
  /**
   * The text content of the Tag component
   */
  label: PropTypes.string,
  /**
   * The label props of the component. Most Text component props can be used
   */
  labelProps: Text.propTypes,
  /**
   * Additional classNames to be added to the Tag component
   */
  className: PropTypes.string,
};
