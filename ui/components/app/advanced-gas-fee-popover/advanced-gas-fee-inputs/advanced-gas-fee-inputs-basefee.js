import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { PRIORITY_LEVELS } from '../../../../../shared/constants/gas';
import {
  divideCurrencies,
  multiplyCurrencies,
} from '../../../../../shared/modules/conversion.utils';
import { PRIMARY, SECONDARY } from '../../../../helpers/constants/common';
import {
  decGWEIToHexWEI,
  hexWEIToDecGWEI,
} from '../../../../helpers/utils/conversions.util';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useUserPreferencedCurrency } from '../../../../hooks/useUserPreferencedCurrency';
import { useCurrencyDisplay } from '../../../../hooks/useCurrencyDisplay';
import Button from '../../../ui/button';
import FormField from '../../../ui/form-field';
import I18nValue from '../../../ui/i18n-value';

import AdvancedGasFeeInputSubtext from '../advanced-gas-fee-input-subtext';
import { getAdvancedGasFeeValues } from '../../../../selectors';

const devideCurrencyValues = (value, baseFee, numberOfDecimals) => {
  if (baseFee > 1)
    return divideCurrencies(decGWEIToHexWEI(value), baseFee, {
      numberOfDecimals,
      dividendBase: 16,
      divisorBase: 16,
      toNumericBase: 'dec',
    });
  return 1;
};

const multiplyCurrencyValues = (baseFee, value, numberOfDecimals) =>
  multiplyCurrencies(baseFee, value, {
    numberOfDecimals,
    multiplicandBase: 16,
    multiplierBase: 10,
    fromNumericBase: 'hex',
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
  });

const AdvancedGasFeeInputBaseFee = () => {
  const t = useI18nContext();
  const { estimatedBaseFee, estimateUsed, maxFeePerGas } = useGasFeeContext();
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
    )
      return multiplyCurrencyValues(
        estimatedBaseFee,
        advancedGasFeeValues.maxBaseFee,
        numberOfDecimalsPrimary,
      );
    return estimatedBaseFee;
  });

  const [maxBaseFeeMultiplier, setMaxBaseFeeMultiplier] = useState(() => {
    if (
      estimateUsed !== PRIORITY_LEVELS.CUSTOM &&
      advancedGasFeeValues?.maxBaseFee
    )
      return advancedGasFeeValues.maxBaseFee;
    return devideCurrencyValues(
      maxFeePerGas,
      estimatedBaseFee,
      numberOfDecimalsPrimary,
    );
  });

  const [, { value: baseFeeInFiat }] = useCurrencyDisplay(
    decGWEIToHexWEI(maxBaseFeeGWEI),
    { currency, numberOfDecimalsFiat },
  );

  const updateBaseFee = useCallback(
    (value) => {
      if (editingInGwei) {
        setMaxBaseFeeGWEI(value);
        setMaxBaseFeeMultiplier(
          devideCurrencyValues(
            value,
            estimatedBaseFee,
            numberOfDecimalsPrimary,
          ),
        );
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
          latest={hexWEIToDecGWEI(estimatedBaseFee)}
          historical="23-359 GWEI"
        />
      }
    />
  );
};

export default AdvancedGasFeeInputBaseFee;
