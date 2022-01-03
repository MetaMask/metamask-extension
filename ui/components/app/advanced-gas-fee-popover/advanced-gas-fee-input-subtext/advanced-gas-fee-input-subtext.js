import React from 'react';
import PropTypes from 'prop-types';

import Box from '../../../ui/box';
import I18nValue from '../../../ui/i18n-value';
import LoadingHeartBeat from '../../../ui/loading-heartbeat';

const AdvancedGasFeeInputSubtext = ({ latest, historical, feeTrend }) => {
  return (
    <Box className="advanced-gas-fee-input-subtext">
      <Box display="flex" alignItems="center">
        <span className="advanced-gas-fee-input-subtext__label">
          <I18nValue messageKey="currentTitle" />
        </span>
        <span className="advanced-gas-fee-input-subtext__value">
          <LoadingHeartBeat />
          {latest}
        </span>
        <img src={`./images/${feeTrend}-arrow.svg`} alt="feeTrend-arrow" />
      </Box>
      <Box>
        <span className="advanced-gas-fee-input-subtext__label">
          <I18nValue messageKey="twelveHrTitle" />
        </span>
        <span className="advanced-gas-fee-input-subtext__value">
          <LoadingHeartBeat />
          {historical}
        </span>
      </Box>
    </Box>
  );
};

AdvancedGasFeeInputSubtext.propTypes = {
  latest: PropTypes.string,
  historical: PropTypes.string,
  feeTrend: PropTypes.string.isRequired,
};

export default AdvancedGasFeeInputSubtext;
