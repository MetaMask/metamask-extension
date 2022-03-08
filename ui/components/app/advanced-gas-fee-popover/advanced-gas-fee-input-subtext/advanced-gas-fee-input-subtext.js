import React from 'react';
import PropTypes from 'prop-types';

import { isNullish } from '../../../../helpers/utils/util';
import { formatGasFee } from '../../../../helpers/utils/gas';
import Box from '../../../ui/box';
import I18nValue from '../../../ui/i18n-value';
import LoadingHeartBeat from '../../../ui/loading-heartbeat';

const FEE_TRENDS = ['up', 'down', 'level'];

const AdvancedGasFeeInputSubtext = ({ latest, historical, trend }) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      gap={4}
      className="advanced-gas-fee-input-subtext"
    >
      {isNullish(latest) ? null : (
        <Box display="flex" alignItems="center" data-testid="latest">
          <span className="advanced-gas-fee-input-subtext__label">
            <I18nValue messageKey="currentTitle" />
          </span>
          <span className="advanced-gas-fee-input-subtext__value">
            <LoadingHeartBeat />
            {formatGasFee(latest)}
          </span>
          {FEE_TRENDS.includes(trend) ? (
            <span className={`advanced-gas-fee-input-subtext__${trend}`}>
              <img
                src={`./images/${trend}-arrow.svg`}
                alt={`${trend} arrow`}
                data-testid="fee-arrow"
              />
            </span>
          ) : null}
        </Box>
      )}
      {isNullish(historical) ? null : (
        <Box>
          <span
            className="advanced-gas-fee-input-subtext__label"
            data-testid="historical"
          >
            <I18nValue messageKey="twelveHrTitle" />
          </span>
          <span className="advanced-gas-fee-input-subtext__value">
            <LoadingHeartBeat />
            {formatGasFee(historical)}
          </span>
        </Box>
      )}
    </Box>
  );
};

AdvancedGasFeeInputSubtext.propTypes = {
  latest: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  historical: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  trend: PropTypes.oneOf(['up', 'down', 'level']),
};

export default AdvancedGasFeeInputSubtext;
