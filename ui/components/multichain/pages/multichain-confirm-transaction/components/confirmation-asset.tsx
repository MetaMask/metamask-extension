import React from 'react';
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
import BigNumber from 'bignumber.js';

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
      <Text variant={TextVariant.headingLg} marginBottom={2}>
        {`${totalBalance} ${sendAsset.assetDetails.symbol}`}
      </Text>
      <Text
        variant={TextVariant.bodyMdMedium}
        color={TextColor.textAlternative}
      ></Text>
    </Box>
  );
};
