import type { BigNumber } from 'bignumber.js';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';

import { calcTokenAmount } from '../../../../../../shared/lib/transactions-controller-utils';
import { shortenString } from '../../../../../helpers/utils/util';
import {
  formatAmount,
  formatAmountMaxPrecision,
} from '../../../../../pages/confirmations/components/simulation-details/formatAmount';
import { ConfirmInfoRowText } from './text';

type ConfirmInfoRowTextTokenUnitsProps = {
  value: number | string | BigNumber;
  decimals?: number;
};

export const ConfirmInfoRowTextTokenUnits: React.FC<
  ConfirmInfoRowTextTokenUnitsProps
> = ({ value, decimals }) => {
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
