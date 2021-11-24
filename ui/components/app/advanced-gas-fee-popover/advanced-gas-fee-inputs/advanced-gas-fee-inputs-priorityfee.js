import React, { useState } from 'react';

import { SECONDARY } from '../../../../helpers/constants/common';
import { TYPOGRAPHY } from '../../../../helpers/constants/design-system';
import { decGWEIToHexWEI } from '../../../../helpers/utils/conversions.util';
import { useCurrencyDisplay } from '../../../../hooks/useCurrencyDisplay';
import { useGasFeeContext } from '../../../../contexts/gasFee';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useUserPreferencedCurrency } from '../../../../hooks/useUserPreferencedCurrency';
import FormField from '../../../ui/form-field';

import AdvancedGasFeeInputSubtext from '../advanced-gas-fee-input-subtext';

const AdvancedGasFeeInputPriorityFee = () => {
  const t = useI18nContext();
  const { maxPriorityFeePerGas } = useGasFeeContext();

  const [priorityFee, setPriorityFee] = useState(maxPriorityFeePerGas);

  const { currency, numberOfDecimals } = useUserPreferencedCurrency(SECONDARY);

  const [, { value: priorityFeeInFiat }] = useCurrencyDisplay(
    decGWEIToHexWEI(priorityFee),
    { currency, numberOfDecimals },
  );

  return (
    <FormField
      onChange={setPriorityFee}
      titleFontSize={TYPOGRAPHY.H7}
      titleText={t('priorityFee')}
      titleUnit={t('gweiInParanthesis')}
      tooltipText={t('advancedPriorityFeeToolTip')}
      value={priorityFee}
      detailText={`≈ ${priorityFeeInFiat}`}
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
