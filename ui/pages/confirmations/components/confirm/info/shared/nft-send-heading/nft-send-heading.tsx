import { Nft } from '@metamask/assets-controllers';
import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../../../../shared/constants/network';
import { isEqualCaseInsensitive } from '../../../../../../../../shared/modules/string-utils';
import { Box, Text } from '../../../../../../../components/component-library';
import { NftItem } from '../../../../../../../components/multichain/nft-item';
import { getNFTsByChainId } from '../../../../../../../ducks/metamask/metamask';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../../../../../../helpers/constants/design-system';
import { getNftImageAlt } from '../../../../../../../helpers/utils/nfts';
import { getNetworkConfigurationsByChainId } from '../../../../../../../selectors';
import { useConfirmContext } from '../../../../../context/confirm';
import { useAssetDetails } from '../../../../../hooks/useAssetDetails';

const NFTSendHeading = () => {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const tokenAddress = transactionMeta.txParams.to;
  const userAddress = transactionMeta.txParams.from;
  const { data } = transactionMeta.txParams;
  const { chainId } = transactionMeta;
  const {
    assetName,
    tokenImage,
    tokenId: assetTokenId,
  } = useAssetDetails(tokenAddress, userAddress, data, chainId);
  const nfts: Nft[] = useSelector((state) =>
    getNFTsByChainId(state, chainId),
  ) as Nft[];
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const nft: Nft | undefined =
    assetTokenId &&
    nfts.find(
      ({ address, tokenId }: Nft) =>
        isEqualCaseInsensitive(address, tokenAddress as string) &&
        assetTokenId === tokenId.toString(),
    );
  const imageOriginal = (nft as Nft | undefined)?.imageOriginal;
  const image = (nft as Nft | undefined)?.image;
  const nftImageAlt = nft && getNftImageAlt(nft);
  const nftSrcUrl = imageOriginal ?? (image || '');
  const isIpfsURL = nftSrcUrl?.startsWith('ipfs:');
  const currentChain = networkConfigurations[chainId];

  const TokenImage = (
    <Box style={{ width: '48px' }}>
      <NftItem
        src={tokenImage}
        alt={image && nftImageAlt ? nftImageAlt : ''}
        name={assetName}
        tokenId={assetTokenId || ''}
        networkName={currentChain.name ?? ''}
        networkSrc={
          CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
            chainId as keyof typeof CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP
          ]
        }
        isIpfsURL={isIpfsURL}
      />
    </Box>
  );

  const TokenName = (
    <Text
      variant={TextVariant.headingLg}
      color={TextColor.inherit}
      marginTop={3}
      textAlign={TextAlign.Center}
    >
      {assetName}
    </Text>
  );

  const TokenID = (
    <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
      {`#${assetTokenId}`}
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
