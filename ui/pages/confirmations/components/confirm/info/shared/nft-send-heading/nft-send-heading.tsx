import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import {
  AvatarToken,
  AvatarTokenSize,
  Box,
  Text,
} from '../../../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
import { useConfirmContext } from '../../../../../context/confirm';
import { useAssetDetails } from '../../../../../hooks/useAssetDetails';

const NFTSendHeading = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const tokenAddress = transactionMeta.txParams.to;
  const userAddress = transactionMeta.txParams.from;
  const { data } = transactionMeta.txParams;
  const { chainId } = transactionMeta;

  const { assetName, tokenImage, tokenId } = useAssetDetails(
    tokenAddress,
    userAddress,
    data,
    chainId,
  );

  const TokenImage = <AvatarToken src={tokenImage} size={AvatarTokenSize.Xl} />;

  const TokenName = (
    <Text
      variant={TextVariant.headingLg}
      color={TextColor.inherit}
      marginTop={3}
    >
      {assetName}
    </Text>
  );

  const TokenID = (
    <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
      {tokenId}
    </Text>
  );

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      padding={4}
    >
      {TokenImage}
      {TokenName}
      {TokenID}
    </Box>
  );
};

export default NFTSendHeading;
