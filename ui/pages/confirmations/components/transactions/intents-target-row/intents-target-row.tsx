import React, { useMemo } from 'react';
import { Hex } from '@metamask/utils';
import { BigNumber } from 'bignumber.js';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import { useTokenFiatAmount } from '../../../../../hooks/useTokenFiatAmount';
import { Box, Text } from '../../../../../components/component-library';
import { ConfirmInfoRow } from '../../../../../components/app/confirm/info/row';
import { useTokenDecimals } from '../../../hooks/transactions/useTokenDecimals';
import { useIntentsTargets } from '../../../hooks/transactions/useIntentsTargets';
import { useIntentsTargetChainId } from '../../../hooks/transactions/useIntentsTargetChainId';
import { TokenPill } from '../../confirm/token-pill/token-pill';

export function IntentsTargetRow() {
  const targetChainId = useIntentsTargetChainId();
  const targets = useIntentsTargets();

  return (
    <ConfirmInfoRow label="Target">
      <Box display={Display.Flex} flexDirection={FlexDirection.Column} gap={2}>
        {targets.map(({ targetTokenAddress, targetAmount }) => (
          <Line
            key={targetTokenAddress}
            targetChainId={targetChainId}
            targetTokenAddress={targetTokenAddress}
            targetAmount={targetAmount}
          />
        ))}
      </Box>
    </ConfirmInfoRow>
  );
}

function Line({
  targetChainId,
  targetTokenAddress,
  targetAmount,
}: {
  targetChainId: Hex;
  targetTokenAddress: Hex;
  targetAmount: Hex;
}) {
  const tokenAddresses = useMemo(
    () => [targetTokenAddress],
    [targetTokenAddress],
  );

  const { value: allTokenDecimals } = useTokenDecimals({
    chainId: targetChainId,
    tokenAddresses,
  });

  const decimals = allTokenDecimals?.[0];

  const targetAmountFormatted =
    targetAmount && decimals
      ? new BigNumber(targetAmount).shift(-decimals).round(6).toString()
      : undefined;

  const targetAmountFiat = useTokenFiatAmount(
    targetTokenAddress,
    targetAmountFormatted,
    undefined,
    {},
    true,
    targetChainId,
  );

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.flexEnd}
      alignItems={AlignItems.center}
      gap={2}
    >
      <Text>{targetAmountFiat}</Text>
      <Text>{targetAmountFormatted}</Text>
      <TokenPill chainId={targetChainId} tokenAddress={targetTokenAddress} />
    </Box>
  );
}
