import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { HIGH_FEE_WARNING_MULTIPLIER } from '../../../../../pages/send/send.constants';
import { PRIORITY_LEVELS } from '../../../../../../shared/constants/gas';
import { SECONDARY } from '../../../../../helpers/constants/common';
import { decGWEIToHexWEI } from '../../../../../helpers/utils/conversions.util';
import { getAdvancedGasFeeValues } from '../../../../../selectors';
import { useCurrencyDisplay } from '../../../../../hooks/useCurrencyDisplay';
import { useGasFeeContext } from '../../../../../contexts/gasFee';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useUserPreferencedCurrency } from '../../../../../hooks/useUserPreferencedCurrency';
import FormField from '../../../../ui/form-field';
import { bnGreaterThan, bnLessThan } from '../../../../../helpers/utils/util';

import { useAdvancedGasFeePopoverContext } from '../../context';
import AdvancedGasFeeInputSubtext from '../../advanced-gas-fee-input-subtext';
import { renderFeeRange } from '../utils';

const validatePriorityFee = (value, gasFeeEstimates) => {
  if (value <= 0) {
    return 'editGasMaxPriorityFeeBelowMinimumV2';
  }
  if (
    gasFeeEstimates?.low &&
    bnLessThan(value, gasFeeEstimates.low.suggestedMaxPriorityFeePerGas)
  ) {
    return 'editGasMaxPriorityFeeLowV2';
  }
  if (
    gasFeeEstimates?.high &&
    bnGreaterThan(
      value,
      gasFeeEstimates.high.suggestedMaxPriorityFeePerGas *
        HIGH_FEE_WARNING_MULTIPLIER,
    )
  ) {
    return 'editGasMaxPriorityFeeHighV2';
  }
  return null;
};

const PriorityFeeInput = () => {
  const t = useI18nContext();
  const advancedGasFeeValues = useSelector(getAdvancedGasFeeValues);
  const {
    setErrorValue,
    setMaxPriorityFeePerGas,
  } = useAdvancedGasFeePopoverContext();
  const {
    estimateUsed,
    gasFeeEstimates,
    maxPriorityFeePerGas,
  } = useGasFeeContext();
  const {
    latestPriorityFeeRange,
    historicalPriorityFeeRange,
  } = gasFeeEstimates;
  const [priorityFeeError, setPriorityFeeError] = useState();

  const [priorityFee, setPriorityFee] = useState(() => {
    if (
      estimateUsed !== PRIORITY_LEVELS.CUSTOM &&
      advancedGasFeeValues?.priorityFee
    )
      return advancedGasFeeValues.priorityFee;
    return maxPriorityFeePerGas;
  });

  const { currency, numberOfDecimals } = useUserPreferencedCurrency(SECONDARY);

  const [, { value: priorityFeeInFiat }] = useCurrencyDisplay(
    decGWEIToHexWEI(priorityFee),
    { currency, numberOfDecimals },
  );

  const updatePriorityFee = (value) => {
    setPriorityFee(value);
  };

  useEffect(() => {
    setMaxPriorityFeePerGas(priorityFee);
    const error = validatePriorityFee(priorityFee, gasFeeEstimates);
    setErrorValue(
      'maxPriorityFeePerGas',
      error === 'editGasMaxPriorityFeeBelowMinimumV2',
    );
    setPriorityFeeError(error);
  }, [
    gasFeeEstimates,
    priorityFee,
    setErrorValue,
    setMaxPriorityFeePerGas,
    setPriorityFeeError,
  ]);

  return (
    <>
      <FormField
        error={priorityFeeError ? t(priorityFeeError) : ''}
        onChange={updatePriorityFee}
        titleText={t('priorityFeeProperCase')}
        titleUnit="(GWEI)"
        tooltipText={t('advancedPriorityFeeToolTip')}
        value={priorityFee}
        detailText={`≈ ${priorityFeeInFiat}`}
        numeric
      />
      <AdvancedGasFeeInputSubtext
        latest={renderFeeRange(latestPriorityFeeRange)}
        historical={renderFeeRange(historicalPriorityFeeRange)}
      />
    </>
  );
};

export default PriorityFeeInput;
