import React, { useContext } from 'react';
import PropTypes from 'prop-types';

import { isNullish } from '../../../../helpers/utils/util';
import { formatGasFeeOrFeeRange } from '../../../../helpers/utils/gas';
import { I18nContext } from '../../../../contexts/i18n';
import Box from '../../../ui/box';
import LoadingHeartBeat from '../../../ui/loading-heartbeat';

function determineTrendInfo(trend, t) {
  switch (trend) {
    case 'up':
      return {
        className: 'advanced-gas-fee-input-subtext__up',
        imageSrc: '/images/up-arrow.svg',
        imageAlt: t('upArrow'),
      };
    case 'down':
      return {
        className: 'advanced-gas-fee-input-subtext__down',
        imageSrc: '/images/down-arrow.svg',
        imageAlt: t('downArrow'),
      };
    case 'level':
      return {
        className: 'advanced-gas-fee-input-subtext__level',
        imageSrc: '/images/level-arrow.svg',
        imageAlt: t('levelArrow'),
      };
    default:
      return null;
  }
}

const AdvancedGasFeeInputSubtext = ({ latest, historical, trend }) => {
  const t = useContext(I18nContext);
  const trendInfo = determineTrendInfo(trend, t);
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
          {trendInfo === null ? null : (
            <span className={trendInfo.className}>
              <img
                src={trendInfo.imageSrc}
                alt={trendInfo.imageAlt}
                data-testid="fee-arrow"
              />
            </span>
          )}
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
  trend: PropTypes.oneOf(['up', 'down', 'level']),
};

export default AdvancedGasFeeInputSubtext;
