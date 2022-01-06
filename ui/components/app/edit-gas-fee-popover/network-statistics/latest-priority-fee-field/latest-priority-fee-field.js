import React from 'react';
import { uniq } from 'lodash';
import { roundToDecimalPlacesRemovingExtraZeroes } from '../../../../../helpers/utils/util';
import { useGasFeeContext } from '../../../../../contexts/gasFee';
import I18nValue from '../../../../ui/i18n-value';
import { PriorityFeeTooltip } from '../tooltips';

export default function LatestPriorityFeeField() {
  const { gasFeeEstimates } = useGasFeeContext();

  const renderPriorityFeeRange = () => {
    const { latestPriorityFeeRange } = gasFeeEstimates;
    if (latestPriorityFeeRange) {
      const formattedRange = uniq([
        roundToDecimalPlacesRemovingExtraZeroes(latestPriorityFeeRange[0], 1),
        roundToDecimalPlacesRemovingExtraZeroes(latestPriorityFeeRange[1], 0),
      ]).join(' - ');
      return `${formattedRange} GWEI`;
    }
    return null;
  };

  return (
    <div className="network-statistics__info__field latest-priority-fee-field">
      <span className="network-statistics__info__field-data">
        <PriorityFeeTooltip>{renderPriorityFeeRange()}</PriorityFeeTooltip>
      </span>
      <span className="network-statistics__info__field-label">
        <I18nValue messageKey="priorityFee" />
      </span>
    </div>
  );
}
