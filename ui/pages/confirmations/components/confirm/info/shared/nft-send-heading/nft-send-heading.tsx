import { Nft } from '@metamask/assets-controllers';
import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { useSelector } from 'react-redux';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../../../../shared/constants/network';
import { getNetworkConfigurationsByChainId } from '../../../../../../../../shared/modules/selectors/networks';
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
import {
  getNftImage,
  getNftImageAlt,
} from '../../../../../../../helpers/utils/nfts';
import { useConfirmContext } from '../../../../../context/confirm';
import { useAssetDetails } from '../../../../../hooks/useAssetDetails';
import { ellipsify } from '../../../../../send/send.utils';
import useFetchNftDetailsFromTokenURI from '../../../../../../../hooks/useFetchNftDetailsFromTokenURI';

export const generateTokenIdDisplay = (tokenId: string) => {
  if (tokenId.length >= 10) {
    return ellipsify(tokenId, 4, 4);
  }

  return tokenId;
};

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
    tokenURI,
  } = useAssetDetails(tokenAddress, userAddress, data, chainId);
  // Attempt to fetch image and name from tokenURI
  const { image: imageFromTokenURI, name: nameFromTokenURI } =
    useFetchNftDetailsFromTokenURI(tokenURI);
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
  const image = getNftImage((nft as Nft | undefined)?.image);
  const nftImageAlt = nft ? getNftImageAlt(nft) : '';
  // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const nftSrcUrl = imageOriginal ?? (image || imageFromTokenURI || '');
  const isIpfsURL = nftSrcUrl?.startsWith('ipfs:');
  const currentChain = networkConfigurations[chainId];
  const tokenIdDisplay =
    assetTokenId && `#${generateTokenIdDisplay(assetTokenId)}`;

  const TokenImage = (
    <Box style={{ width: '48px' }}>
      <NftItem
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        src={tokenImage || imageFromTokenURI}
        alt={nftImageAlt}
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        name={assetName || nameFromTokenURI}
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
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
      {tokenIdDisplay}
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
