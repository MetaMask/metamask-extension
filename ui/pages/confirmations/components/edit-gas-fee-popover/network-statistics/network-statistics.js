import React, { useContext } from 'react';
import {
  FontWeight,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { isNullish } from '../../../../../helpers/utils/util';
import { formatGasFeeOrFeeRange } from '../../../../../helpers/utils/gas';
import { I18nContext } from '../../../../../contexts/i18n';
import { useGasFeeContext } from '../../../../../contexts/gasFee';
import { Text } from '../../../../../components/component-library';
import { BaseFeeTooltip, PriorityFeeTooltip } from './tooltips';
import StatusSlider from './status-slider';

const NetworkStatistics = () => {
  const t = useContext(I18nContext);
  const { gasFeeEstimates } = useGasFeeContext();
  const formattedLatestBaseFee = formatGasFeeOrFeeRange(
    gasFeeEstimates?.estimatedBaseFee,
    {
      precision: 0,
    },
  );
  const formattedLatestPriorityFeeRange = formatGasFeeOrFeeRange(
    gasFeeEstimates?.latestPriorityFeeRange,
    { precision: [1, 0] },
  );
  const networkCongestion = gasFeeEstimates?.networkCongestion;

  return (
    <div className="network-statistics">
      <Text
        color={TextColor.textAlternative}
        fontWeight={FontWeight.Bold}
        marginTop={3}
        marginBottom={3}
        variant={TextVariant.bodyXs}
        as="h6"
      >
        {t('networkStatus')}
      </Text>
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
                {t('baseFee')}
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
                {t('priorityFee')}
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
