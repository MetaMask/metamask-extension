import React from 'react';
import PropTypes from 'prop-types';
import {
  TypographyVariant,
  Size,
  DISPLAY,
  AlignItems,
  FONT_WEIGHT,
  BackgroundColor,
  TextColor,
} from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box';
import Typography from '../../../ui/typography/typography';

const SignatureRequestSIWETag = ({ text }) => {
  return (
    <Box
      className="signature-request-siwe-tag"
      marginRight={1}
      display={DISPLAY.INLINE_FLEX}
      alignItems={AlignItems.center}
      backgroundColor={BackgroundColor.errorDefault}
      borderRadius={Size.XL}
      paddingLeft={4}
      paddingRight={4}
    >
      <Typography
        fontWeight={FONT_WEIGHT.BOLD}
        margin={0}
        variant={TypographyVariant.H7}
        color={TextColor.errorInverse}
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
