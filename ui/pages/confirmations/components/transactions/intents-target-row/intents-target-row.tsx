import React, { useMemo } from 'react';
import { Hex } from '@metamask/utils';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../../../helpers/constants/design-system';
import BigNumber from 'bignumber.js';
import { useTokenFiatAmount } from '../../../../../hooks/useTokenFiatAmount';
import { Box, Text } from '../../../../../components/component-library';
import { ConfirmInfoRow } from '../../../../../components/app/confirm/info/row';
import { AssetPill } from '../../simulation-details/asset-pill';
import { NATIVE_TOKEN_ADDRESS } from '../../../../../helpers/constants/intents';
import { TokenStandard } from '../../../../../../shared/constants/transaction';
import { AssetIdentifier } from '../../simulation-details/types';
import { useTokenDecimals } from '../../../hooks/transactions/useTokenDecimals';

export function IntentsTargetRow({
  targetChainId,
  targets,
}: {
  targetChainId: Hex;
  targets: {
    targetTokenAddress: Hex;
    targetAmount: Hex;
  }[];
}) {
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

  const standard: TokenStandard =
    targetTokenAddress === NATIVE_TOKEN_ADDRESS
      ? TokenStandard.none
      : TokenStandard.ERC20;

  const asset: AssetIdentifier = {
    chainId: targetChainId,
    address: targetTokenAddress,
    standard,
  } as AssetIdentifier;

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
      <AssetPill asset={asset} />
    </Box>
  );
}
