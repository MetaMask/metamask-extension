import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { HIGH_FEE_WARNING_MULTIPLIER } from '../../../../../pages/send/send.constants';
import { PRIORITY_LEVELS } from '../../../../../../shared/constants/gas';
import { SECONDARY } from '../../../../../helpers/constants/common';
import { bnGreaterThan, bnLessThan } from '../../../../../helpers/utils/util';
import { decGWEIToHexWEI } from '../../../../../helpers/utils/conversions.util';
import { getAdvancedGasFeeValues } from '../../../../../selectors';
import { useGasFeeContext } from '../../../../../contexts/gasFee';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useUserPreferencedCurrency } from '../../../../../hooks/useUserPreferencedCurrency';
import { useCurrencyDisplay } from '../../../../../hooks/useCurrencyDisplay';
import Box from '../../../../ui/box';
import FormField from '../../../../ui/form-field';

import { useAdvancedGasFeePopoverContext } from '../../context';
import AdvancedGasFeeInputSubtext from '../../advanced-gas-fee-input-subtext';
import {
  roundToDecimalPlacesRemovingExtraZeroes,
  renderFeeRange,
} from '../utils';

const validateBaseFee = (value, gasFeeEstimates, maxPriorityFeePerGas) => {
  if (bnGreaterThan(maxPriorityFeePerGas, value)) {
    return 'editGasMaxBaseFeeGWEIImbalance';
  }
  if (
    gasFeeEstimates?.low &&
    bnLessThan(value, gasFeeEstimates.low.suggestedMaxFeePerGas)
  ) {
    return 'editGasMaxBaseFeeLow';
  }
  if (
    gasFeeEstimates?.high &&
    bnGreaterThan(
      value,
      gasFeeEstimates.high.suggestedMaxFeePerGas * HIGH_FEE_WARNING_MULTIPLIER,
    )
  ) {
    return 'editGasMaxBaseFeeHigh';
  }
  return null;
};

const BaseFeeInput = () => {
  const t = useI18nContext();

  const { gasFeeEstimates, estimateUsed, maxFeePerGas } = useGasFeeContext();
  const {
    maxPriorityFeePerGas,
    setErrorValue,
    setMaxFeePerGas,
    setMaxBaseFee,
  } = useAdvancedGasFeePopoverContext();

  const {
    estimatedBaseFee,
    historicalBaseFeeRange,
    baseFeeTrend,
  } = gasFeeEstimates;
  const [baseFeeError, setBaseFeeError] = useState();
  const {
    currency,
    numberOfDecimals: numberOfDecimalsFiat,
  } = useUserPreferencedCurrency(SECONDARY);

  const advancedGasFeeValues = useSelector(getAdvancedGasFeeValues);

  const [baseFee, setBaseFee] = useState(() => {
    if (
      estimateUsed !== PRIORITY_LEVELS.CUSTOM &&
      advancedGasFeeValues?.maxBaseFee
    ) {
      return advancedGasFeeValues.maxBaseFee;
    }

    return maxFeePerGas;
  });

  const [, { value: baseFeeInFiat }] = useCurrencyDisplay(
    decGWEIToHexWEI(baseFee),
    { currency, numberOfDecimalsFiat },
  );

  const updateBaseFee = useCallback(
    (value) => {
      setBaseFee(value);
    },
    [setBaseFee],
  );

  useEffect(() => {
    setMaxFeePerGas(baseFee);
    const error = validateBaseFee(
      baseFee,
      gasFeeEstimates,
      maxPriorityFeePerGas,
    );

    setBaseFeeError(error);
    setErrorValue('maxFeePerGas', error === 'editGasMaxBaseFeeGWEIImbalance');
    setMaxBaseFee(baseFee);
  }, [
    baseFee,
    gasFeeEstimates,
    maxPriorityFeePerGas,
    setBaseFeeError,
    setErrorValue,
    setMaxFeePerGas,
    setMaxBaseFee,
  ]);

  return (
    <Box className="base-fee-input" margin={[0, 2]}>
      <FormField
        dataTestId="base-fee-input"
        error={baseFeeError ? t(baseFeeError) : ''}
        onChange={updateBaseFee}
        titleText={t('maxBaseFee')}
        titleUnit={`(${t('gwei')})`}
        tooltipText={t('advancedBaseGasFeeToolTip')}
        value={baseFee}
        detailText={`≈ ${baseFeeInFiat}`}
        numeric
      />
      <AdvancedGasFeeInputSubtext
        latest={`${roundToDecimalPlacesRemovingExtraZeroes(
          estimatedBaseFee,
          2,
        )} GWEI`}
        historical={renderFeeRange(historicalBaseFeeRange)}
        feeTrend={baseFeeTrend}
      />
    </Box>
  );
};

export default BaseFeeInput;
