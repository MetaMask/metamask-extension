import React, { useCallback, useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

import { HIGH_FEE_WARNING_MULTIPLIER } from '../../../../../pages/send/send.constants';
import { PRIORITY_LEVELS } from '../../../../../../shared/constants/gas';
import {
  divideCurrencies,
  multiplyCurrencies,
} from '../../../../../../shared/modules/conversion.utils';
import { PRIMARY, SECONDARY } from '../../../../../helpers/constants/common';
import { bnGreaterThan, bnLessThan } from '../../../../../helpers/utils/util';
import { decGWEIToHexWEI } from '../../../../../helpers/utils/conversions.util';

import { getAdvancedGasFeeValues } from '../../../../../selectors';
import { useGasFeeContext } from '../../../../../contexts/gasFee';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useUserPreferencedCurrency } from '../../../../../hooks/useUserPreferencedCurrency';
import { useCurrencyDisplay } from '../../../../../hooks/useCurrencyDisplay';
import Button from '../../../../ui/button';
import Box from '../../../../ui/box';
import FormField from '../../../../ui/form-field';
import I18nValue from '../../../../ui/i18n-value';

import { useAdvancedGasFeePopoverContext } from '../../context';
import AdvancedGasFeeInputSubtext from '../../advanced-gas-fee-input-subtext';
import {
  roundToDecimalPlacesRemovingExtraZeroes,
  renderFeeRange,
} from '../utils';

const divideCurrencyValues = (value, baseFee) => {
  if (baseFee === 0) {
    return 0;
  }
  return divideCurrencies(value, baseFee, {
    numberOfDecimals: 2,
    dividendBase: 10,
    divisorBase: 10,
  }).toNumber();
};

const multiplyCurrencyValues = (baseFee, value, numberOfDecimals) =>
  multiplyCurrencies(baseFee, value, {
    numberOfDecimals,
    multiplicandBase: 10,
    multiplierBase: 10,
  }).toNumber();

const validateBaseFee = (
  editingInGwei,
  value,
  gasFeeEstimates,
  maxPriorityFeePerGas,
) => {
  if (bnGreaterThan(maxPriorityFeePerGas, value)) {
    return editingInGwei
      ? 'editGasMaxBaseFeeGWEIImbalance'
      : 'editGasMaxBaseFeeMultiplierImbalance';
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
  } = useAdvancedGasFeePopoverContext();

  const { estimatedBaseFee, historicalBaseFeeRange } = gasFeeEstimates;
  const [baseFeeError, setBaseFeeError] = useState();
  const {
    numberOfDecimals: numberOfDecimalsPrimary,
  } = useUserPreferencedCurrency(PRIMARY);
  const {
    currency,
    numberOfDecimals: numberOfDecimalsFiat,
  } = useUserPreferencedCurrency(SECONDARY);

  const advancedGasFeeValues = useSelector(getAdvancedGasFeeValues);

  const [editingInGwei, setEditingInGwei] = useState(false);

  const [maxBaseFeeGWEI, setMaxBaseFeeGWEI] = useState(() => {
    if (
      estimateUsed !== PRIORITY_LEVELS.CUSTOM &&
      advancedGasFeeValues?.maxBaseFee
    ) {
      return multiplyCurrencyValues(
        estimatedBaseFee,
        advancedGasFeeValues.maxBaseFee,
        numberOfDecimalsPrimary,
      );
    }
    return maxFeePerGas;
  });

  const [maxBaseFeeMultiplier, setMaxBaseFeeMultiplier] = useState(() => {
    if (
      estimateUsed !== PRIORITY_LEVELS.CUSTOM &&
      advancedGasFeeValues?.maxBaseFee
    ) {
      return advancedGasFeeValues.maxBaseFee;
    }
    return divideCurrencyValues(maxFeePerGas, estimatedBaseFee);
  });

  const [, { value: baseFeeInFiat }] = useCurrencyDisplay(
    decGWEIToHexWEI(maxBaseFeeGWEI),
    { currency, numberOfDecimalsFiat },
  );

  const updateBaseFee = useCallback(
    (value) => {
      let baseFeeInGWEI;
      let baseFeeMultiplierValue;
      if (editingInGwei) {
        baseFeeInGWEI = value;
        baseFeeMultiplierValue = divideCurrencyValues(value, estimatedBaseFee);
      } else {
        baseFeeInGWEI = multiplyCurrencyValues(
          estimatedBaseFee,
          value,
          numberOfDecimalsPrimary,
        );
        baseFeeMultiplierValue = value;
      }
      setMaxBaseFeeGWEI(baseFeeInGWEI);
      setMaxBaseFeeMultiplier(baseFeeMultiplierValue);
    },
    [
      editingInGwei,
      estimatedBaseFee,
      numberOfDecimalsPrimary,
      setMaxBaseFeeGWEI,
      setMaxBaseFeeMultiplier,
    ],
  );

  useEffect(() => {
    setMaxFeePerGas(maxBaseFeeGWEI);
    const error = validateBaseFee(
      editingInGwei,
      maxBaseFeeGWEI,
      gasFeeEstimates,
      maxPriorityFeePerGas,
    );

    setBaseFeeError(error);
    setErrorValue(
      'maxFeePerGas',
      error === 'editGasMaxBaseFeeGWEIImbalance' ||
        error === 'editGasMaxBaseFeeMultiplierImbalance',
    );
  }, [
    editingInGwei,
    gasFeeEstimates,
    maxBaseFeeGWEI,
    maxPriorityFeePerGas,
    setBaseFeeError,
    setErrorValue,
    setMaxFeePerGas,
  ]);

  return (
    <Box className="base-fee-input">
      <FormField
        error={baseFeeError ? t(baseFeeError) : ''}
        onChange={updateBaseFee}
        titleText={t('maxBaseFee')}
        titleUnit={editingInGwei ? 'GWEI' : `(${t('multiplier')})`}
        tooltipText={t('advancedBaseGasFeeToolTip')}
        titleDetail={
          <Button
            className="base-fee-input__edit-link"
            type="link"
            onClick={() => setEditingInGwei(!editingInGwei)}
          >
            <I18nValue
              messageKey={editingInGwei ? 'editInMultiplier' : 'editInGwei'}
            />
          </Button>
        }
        value={editingInGwei ? maxBaseFeeGWEI : maxBaseFeeMultiplier}
        detailText={`≈ ${baseFeeInFiat}`}
        numeric
      />
      <AdvancedGasFeeInputSubtext
        latest={`${roundToDecimalPlacesRemovingExtraZeroes(
          estimatedBaseFee,
          2,
        )} GWEI`}
        historical={renderFeeRange(historicalBaseFeeRange)}
      />
    </Box>
  );
};

export default BaseFeeInput;
