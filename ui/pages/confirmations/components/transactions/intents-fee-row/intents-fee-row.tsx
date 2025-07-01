import React from 'react';
import BigNumber from 'bignumber.js';
import {
  ConfirmInfoRow,
  ConfirmInfoRowText,
} from '../../../../../components/app/confirm/info/row';
import { useIntentsContext } from '../../../context/intents/intents';
import { useIntentSourceAmounts } from '../../../hooks/transactions/useIntentSourceAmount';
import { useTokenFiatAmount } from '../../../../../hooks/useTokenFiatAmount';

export function IntentsFeeRow() {
  const { sourceToken } = useIntentsContext();
  const sourceAmounts = useIntentSourceAmounts();

  const sourceChainId = sourceToken?.chainId;
  const sourceTokenAddress = sourceToken?.address;

  const feeTotal = sourceAmounts
    ?.reduce(
      (acc, amount) => acc.plus(new BigNumber(amount.sourceAmountFeeFormatted)),
      new BigNumber(0),
    )
    .round(6)
    .toString();

  const feeFiat = useTokenFiatAmount(
    sourceTokenAddress,
    feeTotal,
    undefined,
    {},
    true,
    sourceChainId,
  );

  if (!sourceAmounts?.length || !sourceChainId || !sourceTokenAddress) {
    return null;
  }

  return (
    <ConfirmInfoRow label="Fee">
      <ConfirmInfoRowText text={`${feeFiat} ${feeTotal}`} />
    </ConfirmInfoRow>
  );
}
