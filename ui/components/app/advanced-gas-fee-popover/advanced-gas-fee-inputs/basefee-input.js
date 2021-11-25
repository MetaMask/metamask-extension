import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { PRIORITY_LEVELS } from '../../../../../shared/constants/gas';
import {
  divideCurrencies,
  multiplyCurrencies,
} from '../../../../../shared/modules/conversion.utils';
import { PRIMARY, SECONDARY } from '../../../../helpers/constants/common';
import { decGWEIToHexWEI } from '../../../../helpers/utils/conversions.util';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useUserPreferencedCurrency } from '../../../../hooks/useUserPreferencedCurrency';
import { useCurrencyDisplay } from '../../../../hooks/useCurrencyDisplay';
import Button from '../../../ui/button';
import FormField from '../../../ui/form-field';
import I18nValue from '../../../ui/i18n-value';

import AdvancedGasFeeInputSubtext from '../advanced-gas-fee-input-subtext';
import { getAdvancedGasFeeValues } from '../../../../selectors';

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

const BasefeeInput = () => {
  const t = useI18nContext();
  const { gasFeeEstimates, estimateUsed, maxFeePerGas } = useGasFeeContext();
  const { estimatedBaseFee } = gasFeeEstimates;
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
      if (editingInGwei) {
        setMaxBaseFeeGWEI(value);
        setMaxBaseFeeMultiplier(divideCurrencyValues(value, estimatedBaseFee));
      } else {
        setMaxBaseFeeMultiplier(value);
        setMaxBaseFeeGWEI(
          multiplyCurrencyValues(
            estimatedBaseFee,
            value,
            numberOfDecimalsPrimary,
          ),
        );
      }
    },
    [
      editingInGwei,
      estimatedBaseFee,
      numberOfDecimalsPrimary,
      setMaxBaseFeeGWEI,
      setMaxBaseFeeMultiplier,
    ],
  );

  return (
    <FormField
      onChange={updateBaseFee}
      titleText={t('maxBaseFee')}
      titleUnit={editingInGwei ? 'GWEI' : `(${t('multiplier')})`}
      tooltipText={t('advancedBaseGasFeeToolTip')}
      titleDetail={
        <Button
          className="advanced-gas-fee-input__edit-link"
          type="link"
          onClick={() => setEditingInGwei(!editingInGwei)}
        >
          <I18nValue
            messageKey={editingInGwei ? 'editInMultiplier' : 'editInGwei'}
          />
        </Button>
      }
      value={editingInGwei ? maxBaseFeeGWEI : maxBaseFeeMultiplier}
      detailText={
        editingInGwei
          ? `${maxBaseFeeMultiplier}x ${`≈ ${baseFeeInFiat}`}`
          : `${maxBaseFeeGWEI} GWEI ${`≈ ${baseFeeInFiat}`}`
      }
      numeric
      inputDetails={
        <AdvancedGasFeeInputSubtext
          latest={estimatedBaseFee}
          historical="23-359 GWEI"
        />
      }
    />
  );
};

export default BasefeeInput;
