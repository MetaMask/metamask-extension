import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../../ui/box';
import Typography from '../../../ui/typography';

import {
  FLEX_DIRECTION,
  TypographyVariant,
} from '../../../../helpers/constants/design-system';

const SignatureRequestSIWEMessage = ({ data }) => {
  return (
    <Box className="signature-request-siwe-message">
      <Box flexDirection={FLEX_DIRECTION.COLUMN}>
        {data.map(({ label, value }, i) => (
          <Box key={i.toString()} marginTop={2} marginBottom={2}>
            <Typography
              variant={TypographyVariant.H4}
              marginTop={2}
              marginBottom={2}
            >
              {label}
            </Typography>
            <Typography
              className="signature-request-siwe-message__sub-text"
              variant={TypographyVariant.H6}
              marginTop={2}
              marginBottom={2}
            >
              {value}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

SignatureRequestSIWEMessage.propTypes = {
  /**
   * The data array that contains objects of data about the message
   */
  data: PropTypes.arrayOf(
    PropTypes.shape({
      /**
       * The label or title of the value data
       */
      label: PropTypes.string,
      /**
       * The value of the data
       */
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
  ),
};

export default React.memo(SignatureRequestSIWEMessage);
