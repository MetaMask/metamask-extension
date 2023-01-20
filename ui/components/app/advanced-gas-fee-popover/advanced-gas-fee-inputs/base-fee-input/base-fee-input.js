import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { HIGH_FEE_WARNING_MULTIPLIER } from '../../../../../pages/send/send.constants';
import {
  EDIT_GAS_MODES,
  PRIORITY_LEVELS,
} from '../../../../../../shared/constants/gas';
import { PRIMARY } from '../../../../../helpers/constants/common';
import { bnGreaterThan, bnLessThan } from '../../../../../helpers/utils/util';
import { getAdvancedGasFeeValues } from '../../../../../selectors';
import { useGasFeeContext } from '../../../../../contexts/gasFee';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useUserPreferencedCurrency } from '../../../../../hooks/useUserPreferencedCurrency';
import { useCurrencyDisplay } from '../../../../../hooks/useCurrencyDisplay';
import Box from '../../../../ui/box';
import FormField from '../../../../ui/form-field';

import { useAdvancedGasFeePopoverContext } from '../../context';
import AdvancedGasFeeInputSubtext from '../../advanced-gas-fee-input-subtext';
import { decGWEIToHexWEI } from '../../../../../../shared/modules/conversion.utils';

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

  const { gasFeeEstimates, estimateUsed, maxFeePerGas, editGasMode } =
    useGasFeeContext();
  const {
    gasLimit,
    maxPriorityFeePerGas,
    setErrorValue,
    setMaxFeePerGas,
    setMaxBaseFee,
  } = useAdvancedGasFeePopoverContext();

  const { estimatedBaseFee, historicalBaseFeeRange, baseFeeTrend } =
    gasFeeEstimates;
  const [baseFeeError, setBaseFeeError] = useState();
  const { currency, numberOfDecimals } = useUserPreferencedCurrency(PRIMARY);

  const advancedGasFeeValues = useSelector(getAdvancedGasFeeValues);

  const [baseFee, setBaseFee] = useState(() => {
    if (
      estimateUsed !== PRIORITY_LEVELS.CUSTOM &&
      advancedGasFeeValues?.maxBaseFee &&
      editGasMode !== EDIT_GAS_MODES.SWAPS
    ) {
      return advancedGasFeeValues.maxBaseFee;
    }

    return maxFeePerGas;
  });

  const [baseFeeInPrimaryCurrency] = useCurrencyDisplay(
    decGWEIToHexWEI(baseFee * gasLimit),
    { currency, numberOfDecimals },
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
    <Box className="base-fee-input" marginLeft={2} marginRight={2}>
      <FormField
        dataTestId="base-fee-input"
        error={baseFeeError ? t(baseFeeError) : ''}
        onChange={updateBaseFee}
        titleText={t('maxBaseFee')}
        titleUnit={`(${t('gwei')})`}
        tooltipText={t('advancedBaseGasFeeToolTip')}
        value={baseFee}
        detailText={`≈ ${baseFeeInPrimaryCurrency}`}
        allowDecimals
        numeric
      />
      <AdvancedGasFeeInputSubtext
        latest={estimatedBaseFee}
        historical={historicalBaseFeeRange}
        trend={baseFeeTrend}
      />
    </Box>
  );
};

export default BaseFeeInput;
