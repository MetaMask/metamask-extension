import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import { GAS_ESTIMATE_TYPES } from '../../../../shared/constants/gas';

import { useGasFeeEstimates } from '../../../hooks/useGasFeeEstimates';
import { I18nContext } from '../../../contexts/i18n';

import Typography from '../../ui/typography/typography';
import {
  TYPOGRAPHY,
  COLORS,
  TEXT_ALIGN,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';
import InfoTooltip from '../../ui/info-tooltip/info-tooltip';

import { getGasTimeEstimate } from '../../../store/actions';

// Once we reach this second threshold, we switch to minutes as a unit
const SECOND_CUTOFF = 90;

export default function GasTiming({ maxPriorityFeePerGas, maxFeePerGas }) {
  const {
    gasFeeEstimates,
    isGasEstimatesLoading,
    gasEstimateType,
  } = useGasFeeEstimates();

  const [customEstimatedTime, setCustomEstimatedTime] = useState(null);

  // If the user has chosen a value lower than the low gas fee estimate,
  // We'll need to use the useEffect hook below to make a call to calculate
  // the time to show
  const isUnknownLow =
    gasFeeEstimates.low &&
    Number(maxPriorityFeePerGas) <
      Number(gasFeeEstimates.low.suggestedMaxPriorityFeePerGas);

  useEffect(() => {
    const priority = maxPriorityFeePerGas;
    const fee = maxFeePerGas;

    if (isUnknownLow) {
      getGasTimeEstimate(priority, fee).then((result) => {
        if (maxFeePerGas === fee && maxPriorityFeePerGas === priority) {
          setCustomEstimatedTime(result);
        }
      });
    }
  }, [
    maxPriorityFeePerGas,
    maxFeePerGas,
    isUnknownLow,
    customEstimatedTime,
    gasFeeEstimates,
  ]);

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
        toHumanReadableTime(low.maxWaitTimeEstimate),
      ]);
    } else {
      text = t('gasTimingVeryPositive', [
        toHumanReadableTime(high.minWaitTimeEstimate),
      ]);
    }
  } else {
    attitude = 'negative';

    // If the user has chosen a value less than our low estimate,
    // calculate a potential wait time
    if (isUnknownLow) {
      if (
        !customEstimatedTime ||
        customEstimatedTime === 'unknown' ||
        customEstimatedTime.upperTimeBound === 'unknown'
      ) {
        return (
          <div className="edit-gas-display__error">
            <Typography
              color={COLORS.ERROR1}
              variant={TYPOGRAPHY.H7}
              align={TEXT_ALIGN.CENTER}
              fontWeight={FONT_WEIGHT.BOLD}
            >
              {t('editGasTooLow')}{' '}
              <InfoTooltip
                position="top"
                contentText={t('editGasTooLowTooltip')}
              />
            </Typography>
          </div>
        );
      }
      text = t('gasTimingNegative', [
        toHumanReadableTime(Number(customEstimatedTime.upperTimeBound)),
      ]);
    } else {
      text = t('gasTimingNegative', [
        toHumanReadableTime(low.maxWaitTimeEstimate),
      ]);
    }
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
  maxFeePerGas: PropTypes.string.isRequired,
};
