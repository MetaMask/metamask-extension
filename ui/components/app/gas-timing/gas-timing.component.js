import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { useGasFeeEstimates } from '../../../hooks/useGasFeeEstimates';
import { I18nContext } from '../../../contexts/i18n';

import Typography from '../../ui/typography/typography';
import { TYPOGRAPHY } from '../../../helpers/constants/design-system';
import InfoTooltip from '../../ui/info-tooltip';

function toHumanReadableTime(milliseconds) {
  const rtf = new Intl.RelativeTimeFormat(undefined, {
    localeMatcher: 'best fit',
    numeric: 'always',
    style: 'long',
  });

  return rtf.format(milliseconds / 1000, 'second');
}

export default function GasTiming({ maxPriorityFeePerGas = 0 }) {
  const { gasFeeEstimates, isGasEstimatesLoading } = useGasFeeEstimates();
  const { low, medium, high } = gasFeeEstimates;

  const t = useContext(I18nContext);

  // Don't show anything if we don't have enough information
  if (isGasEstimatesLoading || maxPriorityFeePerGas < 1) {
    return null;
  }

  let text = '';
  let attitude = '';
  let tooltipText = '';

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
      text = `${toHumanReadableTime(
        low.minWaitTimeEstimate,
      )} - ${toHumanReadableTime(low.maxWaitTimeEstimate)}`;
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
      text = `${toHumanReadableTime(
        medium.minWaitTimeEstimate,
      )} - ${toHumanReadableTime(medium.maxWaitTimeEstimate)}`;
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
      text = `${toHumanReadableTime(
        high.minWaitTimeEstimate,
      )} - ${toHumanReadableTime(high.maxWaitTimeEstimate)}`;
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

GasTiming.propTypes = {
  maxPriorityFeePerGas: PropTypes.number.isRequired,
};
