import React from 'react';
import { BigNumber } from 'bignumber.js';
import { ConfirmInfoRow } from '../../../../../components/app/confirm/info/row';
import { useIntentsContext } from '../../../context/intents/intents';
import { useIntentSourceAmounts } from '../../../hooks/transactions/useIntentSourceAmount';
import { useTokenFiatAmount } from '../../../../../hooks/useTokenFiatAmount';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import { Box, Text } from '../../../../../components/component-library';
import { TokenPill } from '../../confirm/token-pill/token-pill';

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
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        justifyContent={JustifyContent.flexEnd}
        alignItems={AlignItems.center}
        gap={2}
      >
        <Text>{feeFiat}</Text>
        <Text>{feeTotal}</Text>
        <TokenPill chainId={sourceChainId} tokenAddress={sourceTokenAddress} />
      </Box>
    </ConfirmInfoRow>
  );
}
