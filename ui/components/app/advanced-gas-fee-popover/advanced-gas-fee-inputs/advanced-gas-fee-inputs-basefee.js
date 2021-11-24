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

const AdvancedGasFeeInputBaseFee = () => {
  const t = useI18nContext();
  const { estimatedBaseFee, onManualChange, maxFeePerGas } = useGasFeeContext();

  const [editingInGwei, setEditingInGwei] = useState(false);

  const baseFeeMultiplier = divideCurrencies(
    decGWEIToHexWEI(maxFeePerGas),
    estimatedBaseFee,
    {
      numberOfDecimals: 6,
      dividendBase: 16,
      divisorBase: 16,
      toNumericBase: 'dec',
    },
  );
  const [maxBaseFeeMultiplier, setMaxBaseFeeMultiplier] = useState(
    baseFeeMultiplier,
  );

  const baseFee = multiplyCurrencies(estimatedBaseFee, maxBaseFeeMultiplier, {
    numberOfDecimals: 6,
    multiplicandBase: 16,
    multiplierBase: 10,
    toNumericBase: 'dec',
    fromDenomination: 'WEI',
    toDenomination: 'GWEI',
  });
  const [maxBaseFeeGWEI, setMaxBaseFeeGWEI] = useState(baseFee);
  const { currency, numberOfDecimals } = useUserPreferencedCurrency(SECONDARY);
  const [, { value: baseFeeInFiat }] = useCurrencyDisplay(
    decGWEIToHexWEI(baseFee),
    { currency, numberOfDecimals },
  );
  const baseFeeFiatMessage =
    parseFloat(baseFeeInFiat.split('$')[1]) >= 0.01
      ? `≈ ${baseFeeInFiat}`
      : t('fiatValueLowerThanDecimalsShown');

  const setBaseFee = useCallback(
    (value) => {
      let baseFeeValue = value;
      if (editingInGwei) {
        baseFeeValue = divideCurrencies(
          decGWEIToHexWEI(value),
          estimatedBaseFee,
          {
            numberOfDecimals: 6,
            dividendBase: 16,
            divisorBase: 16,
            toNumericBase: 'dec',
          },
        );
        setMaxBaseFeeGWEI(value);
        setMaxBaseFeeMultiplier(baseFeeValue);
      } else {
        baseFeeValue = multiplyCurrencies(estimatedBaseFee, value, {
          numberOfDecimals: 6,
          multiplicandBase: 16,
          multiplierBase: 10,
          toNumericBase: 'dec',
          fromDenomination: 'WEI',
          toDenomination: 'GWEI',
        });
        setMaxBaseFeeMultiplier(value);
        setMaxBaseFeeGWEI(baseFeeValue);
      }
    },
    [
      estimatedBaseFee,
      editingInGwei,
      setMaxBaseFeeGWEI,
      setMaxBaseFeeMultiplier,
    ],
  );

  const updateBaseFeeMode = useCallback(
    (value) => {
      if (value) {
        const baseFeeGwei = multiplyCurrencies(
          estimatedBaseFee,
          maxBaseFeeMultiplier,
          {
            numberOfDecimals: 6,
            multiplicandBase: 16,
            multiplierBase: 10,
            toNumericBase: 'dec',
            fromDenomination: 'WEI',
            toDenomination: 'GWEI',
          },
        );
        setMaxBaseFeeGWEI(baseFeeGwei);
      } else {
        const baseFeeMul = divideCurrencies(
          decGWEIToHexWEI(maxBaseFeeGWEI),
          estimatedBaseFee,
          {
            numberOfDecimals: 6,
            dividendBase: 16,
            divisorBase: 16,
            toNumericBase: 'dec',
          },
        );
        setMaxBaseFeeMultiplier(baseFeeMul);
      }
      setEditingInGwei(value);
    },
    [
      estimatedBaseFee,
      maxBaseFeeMultiplier,
      maxBaseFeeGWEI,
      setMaxBaseFeeGWEI,
      setMaxBaseFeeMultiplier,
      setEditingInGwei,
    ],
  );

  return (
    <FormField
      onChange={(value) => {
        onManualChange?.();
        setBaseFee(value);
      }}
      titleFontSize={TYPOGRAPHY.H7}
      titleText={t('maxBaseFee')}
      titleUnit={editingInGwei ? 'GWEI' : `(${t('multiplier')})`}
      tooltipText={t('advancedBaseGasFeeToolTip')}
      titleDetail={
        editingInGwei ? (
          <Button
            className="advanced-gas-fee-popover__edit-link"
            type="link"
            onClick={() => updateBaseFeeMode(false)}
          >
            <I18nValue messageKey="editInMultiplier" />
          </Button>
        ) : (
          <Button
            className="advanced-gas-fee-popover__edit-link"
            type="link"
            onClick={() => updateBaseFeeMode(true)}
          >
            <I18nValue messageKey="editInGwei" />
          </Button>
        )
      }
      value={editingInGwei ? maxBaseFeeGWEI : maxBaseFeeMultiplier}
      detailText={
        editingInGwei
          ? `${maxBaseFeeMultiplier}x ${baseFeeFiatMessage}`
          : `${baseFee} GWEI ${baseFeeFiatMessage}`
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
