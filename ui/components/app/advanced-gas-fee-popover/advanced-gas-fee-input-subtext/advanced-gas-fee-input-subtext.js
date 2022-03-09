import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { isNullish } from '../../../../helpers/utils/util';
import { formatGasFeeOrFeeRange } from '../../../../helpers/utils/gas';
import { I18nContext } from '../../../../contexts/i18n';
import Box from '../../../ui/box';
import LoadingHeartBeat from '../../../ui/loading-heartbeat';

const FEE_TRENDS = ['up', 'down', 'level'];

const AdvancedGasFeeInputSubtext = ({ latest, historical, trend }) => {
  const t = useContext(I18nContext);
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
            {t('currentTitle')}
          </span>
          <span className="advanced-gas-fee-input-subtext__value">
            <LoadingHeartBeat />
            {formatGasFeeOrFeeRange(latest)}
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
            {t('twelveHrTitle')}
          </span>
          <span className="advanced-gas-fee-input-subtext__value">
            <LoadingHeartBeat />
            {formatGasFeeOrFeeRange(historical)}
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
  trend: PropTypes.oneOf(FEE_TRENDS),
};

export default AdvancedGasFeeInputSubtext;
