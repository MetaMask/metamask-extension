import React, { useContext } from 'react';
import classNames from 'classnames';

import { useGasFeeEstimates } from '../../../hooks/useGasFeeEstimates';
import { I18nContext } from '../../../contexts/i18n';

import Typography from '../../ui/typography/typography';
import { TYPOGRAPHY } from '../../../helpers/constants/design-system';
import InfoTooltip from '../../ui/info-tooltip';
import { useGasFeeInputs } from '../../../hooks/useGasFeeInputs';

// Once we reach this second threshold, we switch to minutes as a unit
const SECOND_CUTOFF = 90;

export default function GasTiming() {
  const { gasFeeEstimates, isGasEstimatesLoading } = useGasFeeEstimates();
  const { maxPriorityFeePerGas } = useGasFeeInputs();
  const { low, medium, high } = gasFeeEstimates;

  const t = useContext(I18nContext);

  // Shows "seconds" as unit of time if under SECOND_CUTOFF, otherwise "minutes"
  const toHumanReadableTime = (milliseconds) => {
    const seconds = Math.ceil(milliseconds / 1000);
    if (seconds <= SECOND_CUTOFF) {
      return t('gasTimingSeconds', [seconds]);
    }
    return t('gasTimingMinutes', [Math.ceil(seconds / 60)]);
  };

  // Prevents a range being shown if the values are the same
  const getRangeOrSingleValue = (value1, value2) => {
    if (value1 === value2) {
      return value1;
    }
    return `${value1} - ${value2}`;
  };

  // Don't show anything if we don't have enough information
  if (isGasEstimatesLoading || maxPriorityFeePerGas < 1) {
    return null;
  }

  let text = '';
  let attitude = '';
  const tooltipText = '';

  // 1:  Longer than the `low.maxWaitTimeEstimate`
  if (maxPriorityFeePerGas < low.maxPriorityFeePerGas) {
    text = t('editGasTooLow');
    attitude = 'negative';
  }
  // 2: Between the `low.minWaitTimeEstimate` and `low.maxWaitTimeEstimate`
  else if (
    maxPriorityFeePerGas >= low.maxPriorityFeePerGas &&
    maxPriorityFeePerGas < medium.maxPriorityFeePerGas
  ) {
    if (low.minWaitTimeEstimate === 0) {
      text = t('gasTimingLessThan', [
        toHumanReadableTime(low.maxWaitTimeEstimate),
      ]);
    } else if (low.maxWaitTimeEstimate === 0) {
      text = t('gasTimingAtLeast', [
        toHumanReadableTime(low.maxWaitTimeEstimate),
      ]);
    } else {
      text = getRangeOrSingleValue(
        toHumanReadableTime(low.minWaitTimeEstimate),
        toHumanReadableTime(low.maxWaitTimeEstimate),
      );
    }
  }
  // 3: Between the `medium.minWaitTimeEstimate` and `medium.maxWaitTimeEstimate`
  else if (
    maxPriorityFeePerGas >= medium.maxPriorityFeePerGas &&
    maxPriorityFeePerGas < high.maxPriorityFeePerGas
  ) {
    if (medium.minWaitTimeEstimate === 0) {
      text = t('gasTimingLessThan', [
        toHumanReadableTime(medium.maxWaitTimeEstimate),
      ]);
    } else if (medium.maxWaitTimeEstimate === 0) {
      text = t('gasTimingAtLeast', [
        toHumanReadableTime(medium.maxWaitTimeEstimate),
      ]);
    } else {
      text = getRangeOrSingleValue(
        toHumanReadableTime(medium.minWaitTimeEstimate),
        toHumanReadableTime(medium.maxWaitTimeEstimate),
      );
    }
  }
  // 4: Between the `high.minWaitTimeEstimate` and the `high.maxWaitTimeEstimate`
  else if (maxPriorityFeePerGas === high.maxPriorityFeePerGas) {
    if (high.minWaitTimeEstimate === 0) {
      text = t('gasTimingLessThan', [
        toHumanReadableTime(high.maxWaitTimeEstimate),
      ]);
    } else if (high.maxWaitTimeEstimate === 0) {
      text = t('gasTimingAtLeast', [
        toHumanReadableTime(high.maxWaitTimeEstimate),
      ]);
    } else {
      text = getRangeOrSingleValue(
        toHumanReadableTime(high.minWaitTimeEstimate),
        toHumanReadableTime(high.maxWaitTimeEstimate),
      );
    }
  }
  // 5: Faster than `high.minWaitTimeEstimate`
  else if (maxPriorityFeePerGas > high.maxPriorityFeePerGas) {
    text = t('gasTimingLessThan', [
      toHumanReadableTime(high.minWaitTimeEstimate),
    ]);
  }

  // If we didn't hit any values, do not show anything
  if (text === '') {
    return null;
  }

  return (
    <Typography
      variant={TYPOGRAPHY.H7}
      className={classNames('gas-timing', {
        [`gas-timing--${attitude}`]: attitude,
      })}
    >
      {text}
      {tooltipText && <InfoTooltip position="top" contentText={tooltipText} />}
    </Typography>
  );
}
