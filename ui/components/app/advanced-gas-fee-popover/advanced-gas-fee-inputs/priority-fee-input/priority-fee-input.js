import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { HIGH_FEE_WARNING_MULTIPLIER } from '../../../../../pages/send/send.constants';
import {
  EditGasModes,
  PriorityLevels,
} from '../../../../../../shared/constants/gas';
import { PRIMARY } from '../../../../../helpers/constants/common';
import { getAdvancedGasFeeValues } from '../../../../../selectors';
import { useCurrencyDisplay } from '../../../../../hooks/useCurrencyDisplay';
import { useGasFeeContext } from '../../../../../contexts/gasFee';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useUserPreferencedCurrency } from '../../../../../hooks/useUserPreferencedCurrency';
import FormField from '../../../../ui/form-field';
import Box from '../../../../ui/box';
import { bnGreaterThan, bnLessThan } from '../../../../../helpers/utils/util';

import { useAdvancedGasFeePopoverContext } from '../../context';
import AdvancedGasFeeInputSubtext from '../../advanced-gas-fee-input-subtext';
import { decGWEIToHexWEI } from '../../../../../../shared/modules/conversion.utils';

const validatePriorityFee = (value, gasFeeEstimates) => {
  if (value < 0) {
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
  const { gasLimit, setErrorValue, setMaxPriorityFeePerGas } =
    useAdvancedGasFeePopoverContext();
  const { editGasMode, estimateUsed, gasFeeEstimates, maxPriorityFeePerGas } =
    useGasFeeContext();
  const {
    latestPriorityFeeRange,
    historicalPriorityFeeRange,
    priorityFeeTrend,
  } = gasFeeEstimates;
  const [priorityFeeError, setPriorityFeeError] = useState();

  const [priorityFee, setPriorityFee] = useState(() => {
    if (
      estimateUsed !== PriorityLevels.custom &&
      advancedGasFeeValues?.priorityFee &&
      editGasMode !== EditGasModes.swaps
    ) {
      return advancedGasFeeValues.priorityFee;
    }
    return maxPriorityFeePerGas;
  });

  const { currency, numberOfDecimals } = useUserPreferencedCurrency(PRIMARY);

  const [priorityFeeInPrimaryCurrency] = useCurrencyDisplay(
    decGWEIToHexWEI(priorityFee * gasLimit),
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
    <Box
      marginTop={4}
      marginLeft={2}
      marginRight={2}
      className="priority-fee-input"
    >
      <FormField
        dataTestId="priority-fee-input"
        error={priorityFeeError ? t(priorityFeeError) : ''}
        onChange={updatePriorityFee}
        titleText={t('priorityFeeProperCase')}
        titleUnit={`(${t('gwei')})`}
        tooltipText={t('advancedPriorityFeeToolTip')}
        value={priorityFee}
        detailText={`≈ ${priorityFeeInPrimaryCurrency}`}
        allowDecimals
        numeric
      />
      <AdvancedGasFeeInputSubtext
        latest={latestPriorityFeeRange}
        historical={historicalPriorityFeeRange}
        trend={priorityFeeTrend}
      />
    </Box>
  );
};

export default PriorityFeeInput;
