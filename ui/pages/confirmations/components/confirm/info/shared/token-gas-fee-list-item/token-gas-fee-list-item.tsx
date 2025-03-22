import React from 'react';
import { Box, Text } from '../../../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
import Identicon from '../../../../../../../components/ui/identicon';
import { GasFeeToken } from '@metamask/transaction-controller';
import BigNumber from 'bignumber.js';
import classnames from 'classnames';
import { useEthFiatAmount } from '../../../../../../../hooks/useEthFiatAmount';
import { Hex } from '@metamask/utils';

export type TokenGasFeeListItemProps = {
  gasFeeToken: GasFeeToken;
  isSelected?: boolean;
  onClick?: (token: GasFeeToken) => void;
};

export function TokenGasFeeListItem({
  gasFeeToken,
  isSelected,
  onClick,
}: TokenGasFeeListItemProps) {
  const { amount, balance, decimals, rateWei, symbol, tokenAddress } =
    gasFeeToken;

  const amountFormatted = new BigNumber(amount).shift(-decimals).toString();
  const amountFiat = useFiatTokenValue(amount, rateWei, decimals);
  const balanceFiat = useFiatTokenValue(balance, rateWei, decimals);

  return (
    <ListItem
      image={<Identicon address={tokenAddress} diameter={32} />}
      isSelected={isSelected}
      leftPrimary={symbol}
      leftSecondary={`Bal: ${balanceFiat}`}
      rightPrimary={amountFiat}
      rightSecondary={`${amountFormatted} ${symbol}`}
      onClick={() => onClick?.(gasFeeToken)}
    />
  );
}

function useFiatTokenValue(tokenValue: Hex, rateWei: Hex, decimals: number) {
  const nativeWei = new BigNumber(tokenValue)
    .shift(-decimals)
    .mul(new BigNumber(rateWei));

  const nativeEth = nativeWei.shift(-18);

  return useEthFiatAmount(nativeEth, {}, false);
}

function ListItem({
  image,
  leftPrimary,
  leftSecondary,
  rightPrimary,
  rightSecondary,
  isSelected,
  onClick,
}: {
  image: React.ReactNode;
  leftPrimary: string;
  leftSecondary: string;
  rightPrimary: string;
  rightSecondary: string;
  isSelected?: boolean;
  onClick?: () => void;
}) {
  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      backgroundColor={isSelected ? BackgroundColor.primaryMuted : undefined}
      padding={2}
      className={classnames('token-gas-fee-list-item', {
        'token-gas-fee-list-item--selected': isSelected ?? false,
      })}
      onClick={() => onClick?.()}
    >
      {isSelected && <SelectedIndicator />}
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Row}
        alignItems={AlignItems.center}
        paddingLeft={2}
      >
        {image}
        <Box textAlign={TextAlign.Left} marginLeft={4}>
          <Text variant={TextVariant.bodyMdMedium}>{leftPrimary}</Text>
          <Text color={TextColor.textAlternative}>{leftSecondary}</Text>
        </Box>
      </Box>
      <Box textAlign={TextAlign.Right}>
        <Text variant={TextVariant.bodyMdMedium}>{rightPrimary}</Text>
        <Text color={TextColor.textAlternative}>{rightSecondary}</Text>
      </Box>
    </Box>
  );
}

function SelectedIndicator() {
  return (
    <Box
      borderRadius={BorderRadius.pill}
      backgroundColor={BackgroundColor.primaryDefault}
      className="token-gas-fee-list-item__selected-indicator"
    />
  );
}
