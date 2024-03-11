import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { HIGH_FEE_WARNING_MULTIPLIER } from '../../../../send/send.constants';
import {
  EditGasModes,
  PriorityLevels,
} from '../../../../../../../shared/constants/gas';
import { PRIMARY } from '../../../../../../helpers/constants/common';
import { getAdvancedGasFeeValues } from '../../../../../../selectors';
import { useGasFeeContext } from '../../../../../../contexts/gasFee';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useUserPreferencedCurrency } from '../../../../../../hooks/useUserPreferencedCurrency';
import { useCurrencyDisplay } from '../../../../../../hooks/useCurrencyDisplay';
import Box from '../../../../../../components/ui/box';
import FormField from '../../../../../../components/ui/form-field';

import { useAdvancedGasFeePopoverContext } from '../../context';
import AdvancedGasFeeInputSubtext from '../../advanced-gas-fee-input-subtext';
import { decGWEIToHexWEI } from '../../../../../../../shared/modules/conversion.utils';
import { Numeric } from '../../../../../../../shared/modules/Numeric';

const validateBaseFee = (value, gasFeeEstimates, maxPriorityFeePerGas) => {
  const baseFeeValue = new Numeric(value, 10);
  if (new Numeric(maxPriorityFeePerGas, 10).greaterThan(baseFeeValue)) {
    return 'editGasMaxBaseFeeGWEIImbalance';
  }
  if (
    gasFeeEstimates?.low &&
    baseFeeValue.lessThan(gasFeeEstimates.low.suggestedMaxFeePerGas, 10)
  ) {
    return 'editGasMaxBaseFeeLow';
  }
  if (
    gasFeeEstimates?.high &&
    baseFeeValue.greaterThan(
      gasFeeEstimates.high.suggestedMaxFeePerGas * HIGH_FEE_WARNING_MULTIPLIER,
      10,
    )
  ) {
    return 'editGasMaxBaseFeeHigh';
  }
  return null;
};

const BaseFeeInput = () => {
  const t = useI18nContext();

  const {
    gasFeeEstimates,
    estimateUsed,
    maxFeePerGas: maxBaseFeeNumber,
    editGasMode,
  } = useGasFeeContext();
  const maxFeePerGas = new Numeric(maxBaseFeeNumber, 10).toString();
  const {
    gasLimit,
    maxPriorityFeePerGas,
    setErrorValue,
    setMaxFeePerGas,
    setMaxBaseFee,
  } = useAdvancedGasFeePopoverContext();

  const { estimatedBaseFee, historicalBaseFeeRange, baseFeeTrend } =
    gasFeeEstimates ?? {};

  const [baseFeeError, setBaseFeeError] = useState();
  const { currency, numberOfDecimals } = useUserPreferencedCurrency(PRIMARY);

  const advancedGasFeeValues = useSelector(getAdvancedGasFeeValues);

  const defaultBaseFee =
    estimateUsed !== PriorityLevels.custom &&
    advancedGasFeeValues?.maxBaseFee &&
    editGasMode !== EditGasModes.swaps
      ? advancedGasFeeValues.maxBaseFee
      : maxFeePerGas;

  const [baseFee, setBaseFee] = useState(defaultBaseFee);
  useEffect(() => {
    setBaseFee(defaultBaseFee);
  }, [defaultBaseFee, setBaseFee]);

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
