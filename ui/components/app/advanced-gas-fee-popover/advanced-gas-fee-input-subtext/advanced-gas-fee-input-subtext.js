import React from 'react';
import PropTypes from 'prop-types';

import Box from '../../../ui/box';
import I18nValue from '../../../ui/i18n-value';

const AdvancedGasFeeInputSubtext = ({ currentValue, rangeValue }) => {
  return (
    <Box className="advanced-gas-fee-input-subtext">
      <Box display="flex" alignItems="center">
        <span className="advanced-gas-fee-input-subtext__label">
          <I18nValue messageKey="currentTitle" />
        </span>
        <span>{currentValue}</span>
        <img src="./images/high-arrow.svg" alt="" />
      </Box>
      <Box>
        <span className="advanced-gas-fee-input-subtext__label">
          <I18nValue messageKey="twelveHrTitle" />
        </span>
        <span>{rangeValue}</span>
      </Box>
    </Box>
  );
};

AdvancedGasFeeInputSubtext.propTypes = {
  currentValue: PropTypes.number,
  rangeValue: PropTypes.string,
};

export default AdvancedGasFeeInputSubtext;
