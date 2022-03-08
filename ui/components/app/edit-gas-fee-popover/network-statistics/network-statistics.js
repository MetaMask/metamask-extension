import React from 'react';
import {
  COLORS,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../../../helpers/constants/design-system';
import { isNullish } from '../../../../helpers/utils/util';
import { formatGasFee } from '../../../../helpers/utils/gas';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import I18nValue from '../../../ui/i18n-value';
import Typography from '../../../ui/typography/typography';
import { BaseFeeTooltip, PriorityFeeTooltip } from './tooltips';
import StatusSlider from './status-slider';

const NetworkStatistics = () => {
  const { gasFeeEstimates } = useGasFeeContext();
  const formattedLatestBaseFee = formatGasFee(
    gasFeeEstimates?.estimatedBaseFee,
    {
      precision: 0,
    },
  );
  const formattedLatestPriorityFeeRange = formatGasFee(
    gasFeeEstimates?.latestPriorityFeeRange,
    { precision: [1, 0] },
  );
  const networkCongestion = gasFeeEstimates?.networkCongestion;

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
        {isNullish(formattedLatestBaseFee) ? null : (
          <div
            className="network-statistics__field"
            data-testid="formatted-latest-base-fee"
          >
            <BaseFeeTooltip>
              <span className="network-statistics__field-data">
                {formattedLatestBaseFee}
              </span>
              <span className="network-statistics__field-label">
                <I18nValue messageKey="baseFee" />
              </span>
            </BaseFeeTooltip>
          </div>
        )}
        {isNullish(formattedLatestPriorityFeeRange) ? null : (
          <div
            className="network-statistics__field"
            data-testid="formatted-latest-priority-fee-range"
          >
            <PriorityFeeTooltip>
              <span className="network-statistics__field-data">
                {formattedLatestPriorityFeeRange}
              </span>
              <span className="network-statistics__field-label">
                <I18nValue messageKey="priorityFee" />
              </span>
            </PriorityFeeTooltip>
          </div>
        )}
        {isNullish(networkCongestion) ? null : (
          <div className="network-statistics__field">
            <StatusSlider />
          </div>
        )}
      </div>
    </div>
  );
};

export default NetworkStatistics;
