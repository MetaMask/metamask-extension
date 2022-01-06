import React from 'react';
import { uniq } from 'lodash';
import { toBigNumber } from '../../../../../../shared/modules/conversion.utils';
import { useGasFeeContext } from '../../../../../contexts/gasFee';
import I18nValue from '../../../../ui/i18n-value';
import { PriorityFeeTooltip } from '../tooltips';

function roundToDecimalPlacesRemovingExtraZeroes(
  numberish,
  numberOfDecimalPlaces,
) {
  return toBigNumber.dec(
    toBigNumber.dec(numberish).toFixed(numberOfDecimalPlaces),
  );
}

export default function LatestPriorityFeeField() {
  const { gasFeeEstimates } = useGasFeeContext();

  const renderPriorityFeeRange = () => {
    const { latestPriorityFeeRange } = gasFeeEstimates;
    if (latestPriorityFeeRange) {
      const formattedRange = uniq(
        latestPriorityFeeRange.map((priorityFee) =>
          roundToDecimalPlacesRemovingExtraZeroes(priorityFee, 1),
        ),
      ).join(' - ');
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
