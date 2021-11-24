import React, { useCallback, useState } from 'react';

import {
  divideCurrencies,
  multiplyCurrencies,
} from '../../../../../shared/modules/conversion.utils';
import { SECONDARY } from '../../../../helpers/constants/common';
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

const devideCurrencyValues = (value, baseFee) =>
  divideCurrencies(decGWEIToHexWEI(value), baseFee, {
    numberOfDecimals: 6,
    dividendBase: 16,
    divisorBase: 16,
    toNumericBase: 'dec',
  });

const multiplyCurrencyValues = (baseFee, value) =>
  multiplyCurrencies(baseFee, value, {
    numberOfDecimals: 6,
    multiplicandBase: 16,
    multiplierBase: 10,
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
  });

const AdvancedGasFeeInputBaseFee = () => {
  const t = useI18nContext();
  const { estimatedBaseFee, maxFeePerGas } = useGasFeeContext();

  const [editingInGwei, setEditingInGwei] = useState(false);

  const [maxBaseFeeMultiplier, setMaxBaseFeeMultiplier] = useState(
    devideCurrencyValues(maxFeePerGas, estimatedBaseFee),
  );
  const [maxBaseFeeGWEI, setMaxBaseFeeGWEI] = useState(
    multiplyCurrencyValues(estimatedBaseFee, maxBaseFeeMultiplier),
  );

  const { currency, numberOfDecimals } = useUserPreferencedCurrency(SECONDARY);
  const [, { value: baseFeeInFiat }] = useCurrencyDisplay(
    decGWEIToHexWEI(maxBaseFeeGWEI),
    { currency, numberOfDecimals },
  );

  const updateBaseFee = useCallback(
    (value) => {
      if (editingInGwei) {
        setMaxBaseFeeGWEI(value);
        setMaxBaseFeeMultiplier(devideCurrencyValues(value, estimatedBaseFee));
      } else {
        setMaxBaseFeeMultiplier(value);
        setMaxBaseFeeGWEI(multiplyCurrencyValues(estimatedBaseFee, value));
      }
    },
    [
      editingInGwei,
      estimatedBaseFee,
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
            className="advanced-gas-fee-popover__edit-link"
            type="link"
            onClick={() => setEditingInGwei(true)}
          >
            <I18nValue messageKey="editInMultiplier" />
          </Button>
        ) : (
          <Button
            className="advanced-gas-fee-popover__edit-link"
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
          currentValue={hexWEIToDecGWEI(estimatedBaseFee)}
          rangeValue="23-359 GWEI"
        />
      }
    />
  );
};

export default AdvancedGasFeeInputBaseFee;
