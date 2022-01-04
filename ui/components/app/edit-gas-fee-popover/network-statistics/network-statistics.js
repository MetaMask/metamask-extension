import React from 'react';

import {
  COLORS,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import I18nValue from '../../../ui/i18n-value';
import Typography from '../../../ui/typography/typography';

import { BaseFeeTooltip } from './tooltips';
import LatestPriorityFeeField from './latest-priority-fee-field';
import StatusSlider from './status-slider';

const NetworkStatistics = () => {
  const { gasFeeEstimates } = useGasFeeContext();

  return (
    <div className="network-statistics">
      <Typography
        color={COLORS.UI4}
        fontWeight={FONT_WEIGHT.BOLD}
        margin={[3, 0]}
        variant={TYPOGRAPHY.H8}
      >
        <I18nValue messageKey="networkStatus" />
      </Typography>
      <div className="network-statistics__info">
        <div className="network-statistics__info__field">
          <span className="network-statistics__info__field-data">
            <BaseFeeTooltip>
              {gasFeeEstimates?.estimatedBaseFee &&
                `${gasFeeEstimates?.estimatedBaseFee} GWEI`}
            </BaseFeeTooltip>
          </span>
          <span className="network-statistics__info__field-label">
            <I18nValue messageKey="baseFee" />
          </span>
        </div>
        <div className="network-statistics__info__separator" />
        <LatestPriorityFeeField />
        <div className="network-statistics__info__separator" />
        <div className="network-statistics__info__field">
          <StatusSlider />
        </div>
      </div>
    </div>
  );
};

export default NetworkStatistics;
