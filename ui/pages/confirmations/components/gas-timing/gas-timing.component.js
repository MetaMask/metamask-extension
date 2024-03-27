import React, { useContext, useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { useSelector } from 'react-redux';
import { Box, Text } from '../../../../components/component-library';
import {
  Display,
  FONT_WEIGHT,
  TextColor,
  TextVariant,
  TypographyVariant,
} from '../../../../helpers/constants/design-system';
import {
  getGasEstimateType,
  getGasFeeEstimates,
  getIsGasEstimatesLoading,
} from '../../../../ducks/metamask/metamask';

import { GAS_FORM_ERRORS } from '../../../../helpers/constants/gas';
import { GasEstimateTypes } from '../../../../../shared/constants/gas';
import { I18nContext } from '../../../../contexts/i18n';
import Typography from '../../../../components/ui/typography/typography';
import { getGasFeeTimeEstimate } from '../../../../store/actions';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { usePrevious } from '../../../../hooks/usePrevious';
import { useDraftTransactionWithTxParams } from '../../hooks/useDraftTransactionWithTxParams';

// Once we reach this second threshold, we switch to minutes as a unit
const SECOND_CUTOFF = 90;

// Shows "seconds" as unit of time if under SECOND_CUTOFF, otherwise "minutes"
const toHumanReadableTime = (milliseconds = 1, t) => {
  const seconds = Math.ceil(milliseconds / 1000);
  if (seconds <= SECOND_CUTOFF) {
    return t('gasTimingSecondsShort', [seconds]);
  }
  return t('gasTimingMinutesShort', [Math.ceil(seconds / 60)]);
};
export default function GasTiming({
  maxFeePerGas = 0,
  maxPriorityFeePerGas = 0,
  gasWarnings,
}) {
  const gasEstimateType = useSelector(getGasEstimateType);
  const gasFeeEstimates = useSelector(getGasFeeEstimates);
  const isGasEstimatesLoading = useSelector(getIsGasEstimatesLoading);

  const [customEstimatedTime, setCustomEstimatedTime] = useState(null);
  const t = useContext(I18nContext);
  const { estimateUsed } = useGasFeeContext();

  const transactionData = useDraftTransactionWithTxParams();

  // If the user has chosen a value lower than the low gas fee estimate,
  // We'll need to use the useEffect hook below to make a call to calculate
  // the time to show
  const isUnknownLow =
    gasFeeEstimates?.low &&
    Number(maxPriorityFeePerGas) <
      Number(gasFeeEstimates.low.suggestedMaxPriorityFeePerGas);

  const previousMaxFeePerGas = usePrevious(maxFeePerGas);
  const previousMaxPriorityFeePerGas = usePrevious(maxPriorityFeePerGas);
  const previousIsUnknownLow = usePrevious(isUnknownLow);

  useEffect(() => {
    let isMounted = true;
    const priority = maxPriorityFeePerGas;
    const fee = maxFeePerGas;

    if (
      isUnknownLow ||
      (priority && priority !== previousMaxPriorityFeePerGas) ||
      (fee && fee !== previousMaxFeePerGas)
    ) {
      // getGasFeeTimeEstimate requires parameters in string format
      getGasFeeTimeEstimate(
        new BigNumber(priority, 10).toString(10),
        new BigNumber(fee, 10).toString(10),
      ).then((result) => {
        if (
          maxFeePerGas === fee &&
          maxPriorityFeePerGas === priority &&
          isMounted
        ) {
          setCustomEstimatedTime(result);
        }
      });
    }

    if (isUnknownLow !== false && previousIsUnknownLow === true) {
      setCustomEstimatedTime(null);
    }

    return () => {
      isMounted = false;
    };
  }, [
    maxPriorityFeePerGas,
    maxFeePerGas,
    isUnknownLow,
    previousMaxFeePerGas,
    previousMaxPriorityFeePerGas,
    previousIsUnknownLow,
  ]);

  if (
    gasWarnings?.maxPriorityFee === GAS_FORM_ERRORS.MAX_PRIORITY_FEE_TOO_LOW ||
    gasWarnings?.maxFee === GAS_FORM_ERRORS.MAX_FEE_TOO_LOW
  ) {
    return (
      <Typography
        variant={TypographyVariant.H7}
        fontWeight={FONT_WEIGHT.BOLD}
        className={classNames('gas-timing', 'gas-timing--negative')}
      >
        {t('editGasTooLow')}
      </Typography>
    );
  }

  // Don't show anything if we don't have enough information
  if (isGasEstimatesLoading || gasEstimateType !== GasEstimateTypes.feeMarket) {
    return null;
  }

  const { low = {}, medium = {}, high = {} } = gasFeeEstimates;

  const estimateToUse =
    estimateUsed || transactionData.userFeeLevel || 'medium';
  let text = t(estimateToUse);
  let time = '';
  let attitude = 'positive';

  if (estimateToUse === 'low') {
    text = t('gasTimingLow');
  }

  // Anything medium or faster is positive
  if (
    Number(maxPriorityFeePerGas) >= Number(medium.suggestedMaxPriorityFeePerGas)
  ) {
    // High+ is very likely, medium is likely
    if (
      Number(maxPriorityFeePerGas) < Number(high.suggestedMaxPriorityFeePerGas)
    ) {
      // Medium
      time = toHumanReadableTime(low.maxWaitTimeEstimate, t);
    } else {
      // High
      time = toHumanReadableTime(high.minWaitTimeEstimate, t);
    }
  } else if (isUnknownLow) {
    // If the user has chosen a value less than our low estimate,
    // calculate a potential wait time

    if (estimateToUse === 'low') {
      attitude = 'negative';
    }
    // If we didn't get any useful information, show the
    // "unknown processing time" message
    if (
      !customEstimatedTime ||
      customEstimatedTime === 'unknown' ||
      customEstimatedTime?.upperTimeBound === 'unknown'
    ) {
      text = t('editGasTooLow');
      attitude = 'negative';
    } else {
      time = toHumanReadableTime(
        Number(customEstimatedTime?.upperTimeBound),
        t,
      );
    }
  } else {
    time = toHumanReadableTime(low.maxWaitTimeEstimate, t);
  }

  const getColorFromAttitude = () => {
    switch (attitude) {
      case 'positive':
        return TextColor.successDefault;
      case 'warning':
        return TextColor.warningDefault;
      case 'negative':
        return TextColor.errorDefault;
      default:
        return TextColor.successDefault;
    }
  };

  return (
    <Box display={Display.Flex}>
      <Text color={TextColor.textMuted} variant={TextVariant.bodyXs}>
        {text}
      </Text>

      <Text
        variant={TextVariant.bodyXs}
        marginLeft={1}
        color={getColorFromAttitude()}
      >
        <span data-testid="gas-timing-time">~{time}</span>
      </Text>
    </Box>
  );
}

GasTiming.propTypes = {
  maxPriorityFeePerGas: PropTypes.string,
  maxFeePerGas: PropTypes.string,
  gasWarnings: PropTypes.object,
};
