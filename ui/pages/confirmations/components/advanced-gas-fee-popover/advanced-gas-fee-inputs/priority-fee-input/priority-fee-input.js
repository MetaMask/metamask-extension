import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { HIGH_FEE_WARNING_MULTIPLIER } from '../../../../send-legacy/send.constants';
import {
  EditGasModes,
  PriorityLevels,
} from '../../../../../../../shared/constants/gas';
import { PRIMARY } from '../../../../../../helpers/constants/common';
import { getAdvancedGasFeeValues } from '../../../../../../selectors';
import { useCurrencyDisplay } from '../../../../../../hooks/useCurrencyDisplay';
import { useGasFeeContext } from '../../../../../../contexts/gasFee';
import { useI18nContext } from '../../../../../../hooks/useI18nContext';
import { useUserPreferencedCurrency } from '../../../../../../hooks/useUserPreferencedCurrency';
import FormField from '../../../../../../components/ui/form-field';
import Box from '../../../../../../components/ui/box';

import { useAdvancedGasFeePopoverContext } from '../../context';
import AdvancedGasFeeInputSubtext from '../../advanced-gas-fee-input-subtext';
import { decGWEIToHexWEI } from '../../../../../../../shared/modules/conversion.utils';
import { Numeric } from '../../../../../../../shared/modules/Numeric';
import { IGNORE_GAS_LIMIT_CHAIN_IDS } from '../../../../constants';

const validatePriorityFee = (value, gasFeeEstimates, chainId) => {
  const priorityFeeValue = new Numeric(value, 10);
  if (priorityFeeValue.lessThan(0, 10)) {
    return 'editGasMaxPriorityFeeBelowMinimumV2';
  }
  if (
    gasFeeEstimates?.low &&
    priorityFeeValue.lessThan(
      gasFeeEstimates.low.suggestedMaxPriorityFeePerGas,
      10,
    ) &&
    IGNORE_GAS_LIMIT_CHAIN_IDS.includes(chainId)
  ) {
    return 'editGasMaxPriorityFeeLowV2';
  }
  if (
    gasFeeEstimates?.high &&
    priorityFeeValue.greaterThan(
      gasFeeEstimates.high.suggestedMaxPriorityFeePerGas *
        HIGH_FEE_WARNING_MULTIPLIER,
      10,
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
  const {
    editGasMode,
    estimateUsed,
    gasFeeEstimates,
    maxPriorityFeePerGas: maxPriorityFeePerGasNumber,
    transaction: { chainId },
  } = useGasFeeContext();
  const maxPriorityFeePerGas = new Numeric(
    maxPriorityFeePerGasNumber,
    10,
  ).toString();
  const {
    latestPriorityFeeRange,
    historicalPriorityFeeRange,
    priorityFeeTrend,
  } = gasFeeEstimates ?? {};
  const [priorityFeeError, setPriorityFeeError] = useState();

  const defaultPriorityFee =
    estimateUsed !== PriorityLevels.custom &&
    advancedGasFeeValues?.priorityFee &&
    editGasMode !== EditGasModes.swaps
      ? advancedGasFeeValues.priorityFee
      : maxPriorityFeePerGas;

  const [priorityFee, setPriorityFee] = useState(
    defaultPriorityFee > 0 ? defaultPriorityFee : undefined,
  );
  useEffect(() => {
    if (priorityFee === undefined && defaultPriorityFee > 0) {
      setPriorityFee(defaultPriorityFee);
    }
  }, [priorityFee, defaultPriorityFee, setPriorityFee]);

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
    const error = validatePriorityFee(priorityFee, gasFeeEstimates, chainId);
    setErrorValue(
      'maxPriorityFeePerGas',
      error === 'editGasMaxPriorityFeeBelowMinimumV2',
    );
    setPriorityFeeError(error);
  }, [
    chainId,
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
