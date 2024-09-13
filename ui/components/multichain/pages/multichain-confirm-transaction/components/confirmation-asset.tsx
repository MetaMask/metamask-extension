import React from 'react';
import { BigNumber } from 'bignumber.js';
import { AvatarToken, Box, Text } from '../../../../component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { DraftTransaction } from '../../../../../ducks/multichain-send/multichain-send';
import { useMultichainCurrencyDisplayByAsset } from '../../../../../hooks/useMultichainCurrencyDisplayByAsset';

export type MultichainConfirmationAssetTotalProps = {
  sendAsset: DraftTransaction['transactionParams']['sendAsset'];
  fee: DraftTransaction['transactionParams']['fee'];
};

export const MultichainConfirmationAssetTotal = ({
  sendAsset,
  fee,
}: MultichainConfirmationAssetTotalProps) => {
  const totalBalance = new BigNumber(fee.fee)
    .plus(new BigNumber(sendAsset.amount))
    .div(new BigNumber(10).pow(sendAsset.assetDetails.details.decimals))
    .toString();

  const { fiatValue: totalFiatBalance } = useMultichainCurrencyDisplayByAsset({
    assetDetails: sendAsset.assetDetails,
    amount: totalBalance,
  });

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      marginBottom={4}
    >
      <AvatarToken
        name={sendAsset.assetDetails.symbol}
        src={sendAsset.assetDetails.image}
        marginBottom={2}
      />
      <Text
        variant={TextVariant.headingLg}
        marginBottom={2}
        data-testid="multichain-confirmation-total-balance"
      >
        {`${totalBalance} ${sendAsset.assetDetails.symbol}`}
      </Text>
      <Text
        variant={TextVariant.bodyMdMedium}
        color={TextColor.textAlternative}
        data-testid="multichain-confirmation-total-fiat-balance"
      >
        {totalFiatBalance}
      </Text>
    </Box>
  );
};
