import React from 'react';
import PropTypes from 'prop-types';
import {
  TYPOGRAPHY,
  SIZES,
  DISPLAY,
  ALIGN_ITEMS,
  COLORS,
  FONT_WEIGHT,
} from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box';
import Typography from '../../../ui/typography/typography';

const SignatureRequestSIWETag = ({ text }) => {
  return (
    <Box
      className="signature-request-siwe-tag"
      marginRight={1}
      display={DISPLAY.INLINE_FLEX}
      alignItems={ALIGN_ITEMS.CENTER}
      backgroundColor={COLORS.ERROR_DEFAULT}
      borderRadius={SIZES.XL}
      paddingLeft={4}
      paddingRight={4}
    >
      <Typography
        fontWeight={FONT_WEIGHT.BOLD}
        margin={0}
        variant={TYPOGRAPHY.H7}
        color={COLORS.ERROR_INVERSE}
      >
        {text}
      </Typography>
    </Box>
  );
};

export default SignatureRequestSIWETag;

SignatureRequestSIWETag.propTypes = {
  /**
   * The text to display in the tag
   */
  text: PropTypes.string,
};
