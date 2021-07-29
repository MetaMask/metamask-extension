import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { GAS_ESTIMATE_TYPES } from '../../../../shared/constants/gas';

import { useGasFeeEstimates } from '../../../hooks/useGasFeeEstimates';
import { I18nContext } from '../../../contexts/i18n';

import Typography from '../../ui/typography/typography';
import { TYPOGRAPHY } from '../../../helpers/constants/design-system';

// Once we reach this second threshold, we switch to minutes as a unit
const SECOND_CUTOFF = 90;

export default function GasTiming({ maxPriorityFeePerGas }) {
  const {
    gasFeeEstimates,
    isGasEstimatesLoading,
    gasEstimateType,
  } = useGasFeeEstimates();

  const t = useContext(I18nContext);

  // Shows "seconds" as unit of time if under SECOND_CUTOFF, otherwise "minutes"
  const toHumanReadableTime = (milliseconds = 1) => {
    const seconds = Math.ceil(milliseconds / 1000);
    if (seconds <= SECOND_CUTOFF) {
      return t('gasTimingSeconds', [seconds]);
    }
    return t('gasTimingMinutes', [Math.ceil(seconds / 60)]);
  };

  // Don't show anything if we don't have enough information
  if (
    isGasEstimatesLoading ||
    gasEstimateType !== GAS_ESTIMATE_TYPES.FEE_MARKET
  ) {
    return null;
  }

  const { low, medium, high } = gasFeeEstimates;

  let text = '';
  let attitude = '';

  // Anything medium or faster is positive
  if (
    Number(maxPriorityFeePerGas) >= Number(medium.suggestedMaxPriorityFeePerGas)
  ) {
    attitude = 'positive';

    // High+ is very likely, medium is likely
    if (
      Number(maxPriorityFeePerGas) < Number(high.suggestedMaxPriorityFeePerGas)
    ) {
      text = t('gasTimingPositive', [
        toHumanReadableTime(medium.maxWaitTimeEstimate),
      ]);
    } else {
      text = t('gasTimingVeryPositive', [
        toHumanReadableTime(high.maxWaitTimeEstimate),
      ]);
    }
  } else {
    attitude = 'negative';
    text = t('gasTimingNegative', [
      toHumanReadableTime(low.maxWaitTimeEstimate),
    ]);
  }

  return (
    <Typography
      variant={TYPOGRAPHY.H7}
      className={classNames('gas-timing', {
        [`gas-timing--${attitude}`]: attitude,
      })}
    >
      {text}
    </Typography>
  );
}

GasTiming.propTypes = {
  maxPriorityFeePerGas: PropTypes.string.isRequired,
};
