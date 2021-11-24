import React, { useCallback, useState } from 'react';
import { useSelector } from 'react-redux';

import { PRIORITY_LEVELS } from '../../../../../shared/constants/gas';
import {
  divideCurrencies,
  multiplyCurrencies,
} from '../../../../../shared/modules/conversion.utils';
import { PRIMARY, SECONDARY } from '../../../../helpers/constants/common';
import { TYPOGRAPHY } from '../../../../helpers/constants/design-system';
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

const devideCurrencyValues = (value, baseFee, numberOfDecimals) =>
  divideCurrencies(decGWEIToHexWEI(value), baseFee, {
    numberOfDecimals,
    dividendBase: 16,
    divisorBase: 16,
    toNumericBase: 'dec',
  });

const multiplyCurrencyValues = (baseFee, value, numberOfDecimals) =>
  multiplyCurrencies(baseFee, value, {
    numberOfDecimals,
    multiplicandBase: 16,
    multiplierBase: 10,
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
    if (estimateUsed === PRIORITY_LEVELS.CUSTOM) return estimatedBaseFee;
    return multiplyCurrencyValues(
      estimatedBaseFee,
      advancedGasFeeValues.maxBaseFee,
      numberOfDecimalsPrimary,
    );
  });

  const [maxBaseFeeMultiplier, setMaxBaseFeeMultiplier] = useState(() => {
    if (estimateUsed === PRIORITY_LEVELS.CUSTOM)
      return devideCurrencyValues(
        maxFeePerGas,
        estimatedBaseFee,
        numberOfDecimalsPrimary,
      );
    return advancedGasFeeValues.maxBaseFee;
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
      titleFontSize={TYPOGRAPHY.H7}
      titleText={t('maxBaseFee')}
      titleUnit={editingInGwei ? 'GWEI' : `(${t('multiplier')})`}
      tooltipText={t('advancedBaseGasFeeToolTip')}
      titleDetail={
        editingInGwei ? (
          <Button
            className="advanced-gas-fee-input__edit-link"
            type="link"
            onClick={() => setEditingInGwei(true)}
          >
            <I18nValue messageKey="editInMultiplier" />
          </Button>
        ) : (
          <Button
            className="advanced-gas-fee-input__edit-link"
            type="link"
            onClick={() => setEditingInGwei(false)}
          >
            <I18nValue messageKey="editInGwei" />
          </Button>
        )
      }
      value={editingInGwei ? maxBaseFeeGWEI : maxBaseFeeMultiplier}
      detailText={
        editingInGwei
          ? `${maxBaseFeeMultiplier}x ${`≈ ${baseFeeInFiat}`}`
          : `${maxBaseFeeGWEI} GWEI ${`≈ ${baseFeeInFiat}`}`
      }
      numeric
      bottomBorder
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

// todo: prepopulate default values from preference controller here
