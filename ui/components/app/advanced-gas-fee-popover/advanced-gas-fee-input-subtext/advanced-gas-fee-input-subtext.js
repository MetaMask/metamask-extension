import React from 'react';
import PropTypes from 'prop-types';
import Box from '../../../ui/box';
import Typography from '../../../ui/typography';
import I18nValue from '../../../ui/i18n-value';
import {
  COLORS,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';

const AdvancedGasFeeInputSubtext = ({ currentData = '', tweleveHrData = '' }) => {
  return (
    <Box className="advanced-gas-fee-popover__input-subtext">
      <Box className="advanced-gas-fee-popover__input-subtext">
        <Typography
          tag={TYPOGRAPHY.Paragraph}
          variant={TYPOGRAPHY.H8}
          color={COLORS.UI4}
          fontWeight={FONT_WEIGHT.BOLD}
          boxProps={{ marginRight: 1 }}
        >
          <I18nValue messageKey="currentTitle" />
        </Typography>
        <Typography
          tag={TYPOGRAPHY.Paragraph}
          variant={TYPOGRAPHY.H8}
          color={COLORS.UI4}
          boxProps={{ marginRight: 1 }}
        >
          {currentData}
        </Typography>
        <img height="18" src="./images/high-arrow.svg" alt="" />
      </Box>
      <Box marginLeft={4} className="advanced-gas-fee-popover__input-subtext">
        <Typography
          tag={TYPOGRAPHY.Paragraph}
          variant={TYPOGRAPHY.H8}
          color={COLORS.UI4}
          fontWeight={FONT_WEIGHT.BOLD}
          boxProps={{ marginRight: 1 }}
        >
          <I18nValue messageKey="twelveHrTitle" />
        </Typography>
        <Typography
          tag={TYPOGRAPHY.Paragraph}
          variant={TYPOGRAPHY.H8}
          color={COLORS.UI4}
          boxProps={{ marginRight: 1 }}
        >
          {tweleveHrData}
        </Typography>
      </Box>
    </Box>
  );
};

AdvancedGasFeeInputSubtext.propTypes = {
  currentData: PropTypes.string,
  tweleveHrData: PropTypes.string,
};

export default AdvancedGasFeeInputSubtext;
