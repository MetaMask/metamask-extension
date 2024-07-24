import React from 'react';
import { BigNumber } from 'bignumber.js';

import { calcTokenAmount } from '../../../../../../shared/lib/transactions-controller-utils';
import {
  formatAmount,
  formatAmountMaxPrecision,
} from '../../../../../pages/confirmations/components/simulation-details/formatAmount';
import { ConfirmInfoRowText } from './text';

type ConfirmInfoRowTextTokenProps = {
  value: number | string | BigNumber;
  decimals: number;
};

export const ConfirmInfoRowTextToken: React.FC<
  ConfirmInfoRowTextTokenProps
> = ({ value, decimals }) => {
  const tokenValue = calcTokenAmount(value, decimals);

  // FIXME - Precision may be lost for large values when using formatAmount
  /** @see {@link https://github.com/MetaMask/metamask-extension/issues/25755} */
  const tokenText = formatAmount('en-US', tokenValue);
  const tokenTextMaxPrecision = formatAmountMaxPrecision('en-US', tokenValue);

  return (
    <ConfirmInfoRowText
      isEllipsis={true}
      text={tokenText}
      tooltip={tokenTextMaxPrecision}
    />
  );
};
