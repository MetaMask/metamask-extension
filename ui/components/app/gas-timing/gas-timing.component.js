import React, { useContext } from 'react';
import classNames from 'classnames';

import { useGasFeeEstimates } from '../../../hooks/useGasFeeEstimates';
import { useGasFeeInputs } from '../../../hooks/useGasFeeInputs';
import { I18nContext } from '../../../contexts/i18n';

import Typography from '../../ui/typography/typography';
import { TYPOGRAPHY } from '../../../helpers/constants/design-system';
import InfoTooltip from '../../ui/info-tooltip';

// Once we reach this second threshold, we switch to minutes as a unit
const SECOND_CUTOFF = 90;

export default function GasTiming() {
  const { gasFeeEstimates, isGasEstimatesLoading } = useGasFeeEstimates();
  const { maxPriorityFeePerGas } = useGasFeeInputs();
  const { low, medium, high } = gasFeeEstimates;

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
  if (isGasEstimatesLoading || maxPriorityFeePerGas < 1) {
    return null;
  }

  let text = '';
  let attitude = '';
  const tooltipText = '';

  // Anything medium or faster is positive
  if (maxPriorityFeePerGas >= medium.maxPriorityFeePerGas) {
    attitude = 'positive';

    // High+ is very likely, medium is likely
    if (maxPriorityFeePerGas < high.maxPriorityFeePerGas) {
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
      {tooltipText && <InfoTooltip position="top" contentText={tooltipText} />}
    </Typography>
  );
}
