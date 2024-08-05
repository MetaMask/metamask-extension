import React from 'react';
import { BigNumber } from 'bignumber.js';

import { calcTokenAmount } from '../../../../../../shared/lib/transactions-controller-utils';
import {
  ellipsisAmountText,
  formatAmount,
  formatAmountMaxPrecision,
} from '../../../../../pages/confirmations/components/simulation-details/formatAmount';
import { ConfirmInfoRowText } from './text';

type ConfirmInfoRowTextTokenUnitsProps = {
  value: number | string | BigNumber;
  decimals: number;
};

export const ConfirmInfoRowTextTokenUnits: React.FC<
  ConfirmInfoRowTextTokenUnitsProps
> = ({ value, decimals }) => {
  const tokenValue = calcTokenAmount(value, decimals);

  const tokenText = formatAmount('en-US', tokenValue);
  const tokenTextMaxPrecision = formatAmountMaxPrecision('en-US', tokenValue);

  return (
    <ConfirmInfoRowText
      text={ellipsisAmountText(tokenText)}
      tooltip={tokenTextMaxPrecision}
    />
  );
};
