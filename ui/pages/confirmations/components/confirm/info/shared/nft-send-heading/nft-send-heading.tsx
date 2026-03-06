import { Nft } from '@metamask/assets-controllers';
import { TransactionMeta } from '@metamask/transaction-controller';
import {
  Box,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import React from 'react';
import { useSelector } from 'react-redux';
import { CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP } from '../../../../../../../../shared/constants/network';
import { getNetworkConfigurationsByChainId } from '../../../../../../../../shared/modules/selectors/networks';
import { isEqualCaseInsensitive } from '../../../../../../../../shared/modules/string-utils';
import { NftItem } from '../../../../../../../components/multichain/nft-item';
import { getNFTsByChainId } from '../../../../../../../ducks/metamask/metamask';
import {
  getNftImage,
  getNftImageAlt,
} from '../../../../../../../helpers/utils/nfts';
import { useConfirmContext } from '../../../../../context/confirm';
import { useAssetDetails } from '../../../../../hooks/useAssetDetails';
import { useNftImageUrl } from '../../../../../hooks/useNftImageUrl';
import { ellipsify } from '../../../../../send-utils/send.utils';
import useFetchNftDetailsFromTokenURI from '../../../../../../../hooks/useFetchNftDetailsFromTokenURI';
import SendHeadingLayout from '../send-heading-layout/send-heading-layout';

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
  const nftItemSrc = useNftImageUrl(tokenImage || imageFromTokenURI);

  const TokenImage = (
    <Box style={{ width: '48px' }}>
      <NftItem
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31880
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        src={nftItemSrc}
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
    <Box paddingBottom={1}>
      <Text
        variant={TextVariant.HeadingLg}
        color={TextColor.Inherit}
      >
        {assetName}
      </Text>
    </Box>
  );

  const TokenID = (
    <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
      {tokenIdDisplay}
    </Text>
  );

  return (
    <SendHeadingLayout image={TokenImage}>
      {TokenName}
      {TokenID}
    </SendHeadingLayout>
  );
};

export default NFTSendHeading;
