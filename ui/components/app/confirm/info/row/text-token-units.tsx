import React from 'react';
import { BigNumber } from 'bignumber.js';

import { calcTokenAmount } from '../../../../../../shared/lib/transactions-controller-utils';
import {
  formatAmount,
  formatAmountMaxPrecision,
} from '../../../../../../shared/lib/format-amount';
import { shortenString } from '../../../../../helpers/utils/util';
import { ConfirmInfoRowText } from './text';

type ConfirmInfoRowTextTokenUnitsProps = {
  value: number | string | BigNumber;
  decimals?: number;
};

export const ConfirmInfoRowTextTokenUnits = ({
  value,
  decimals,
}: ConfirmInfoRowTextTokenUnitsProps) => {
  const tokenValue = calcTokenAmount(value, decimals);

  const tokenText = formatAmount('en-US', tokenValue);
  const tokenTextMaxPrecision = formatAmountMaxPrecision('en-US', tokenValue);

  return (
    <ConfirmInfoRowText
      text={shortenString(tokenText, {
        truncatedCharLimit: 15,
        truncatedStartChars: 15,
        truncatedEndChars: 0,
        skipCharacterInEnd: true,
      })}
      tooltip={tokenTextMaxPrecision}
    />
  );
};
