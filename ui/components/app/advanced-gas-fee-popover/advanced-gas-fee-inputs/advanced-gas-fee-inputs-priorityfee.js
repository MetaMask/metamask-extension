import React, { useState } from 'react';
import FormField from '../../../ui/form-field';
import { decGWEIToHexWEI } from '../../../../helpers/utils/conversions.util';
import { TYPOGRAPHY } from '../../../../helpers/constants/design-system';
import { SECONDARY } from '../../../../helpers/constants/common';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useUserPreferencedCurrency } from '../../../../hooks/useUserPreferencedCurrency';
import { useCurrencyDisplay } from '../../../../hooks/useCurrencyDisplay';
import AdvancedGasFeeInputSubtext from '../advanced-gas-fee-input-subtext';

const AdvancedGasFeeInputPriorityFee = () => {
  const t = useI18nContext();
  const { maxPriorityFeePerGas, onManualChange } = useGasFeeContext();

  const [priorityFee, setPriorityFee] = useState(maxPriorityFeePerGas);

  const { currency, numberOfDecimals } = useUserPreferencedCurrency(SECONDARY);

  const [, { value: priorityFeeInFiat }] = useCurrencyDisplay(
    decGWEIToHexWEI(priorityFee),
    { currency, numberOfDecimals },
  );

  const priorityFeeFiatMessage =
    parseFloat(priorityFeeInFiat.split('$')[1]) >= 0.01
      ? `≈ ${priorityFeeInFiat}`
      : t('fiatValueLowerThanDecimalsShown');

  return (
    <FormField
      onChange={(value) => {
        onManualChange?.();
        setPriorityFee(value);
      }}
      titleFontSize={TYPOGRAPHY.H7}
      titleText={t('priorityFee')}
      titleUnit={t('gweiInParanthesis')}
      tooltipText={t('advancedPriorityFeeToolTip')}
      value={priorityFee}
      detailText={priorityFeeFiatMessage}
      numeric
      bottomBorder
      inputDetails={
        <AdvancedGasFeeInputSubtext
          currentValue="1-18 GWEI"
          rangeValue="23-359 GWEI"
        />
      }
    />
  );
};

AdvancedGasFeeInputPriorityFee.propTypes = {};

export default AdvancedGasFeeInputPriorityFee;
